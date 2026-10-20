import { addDays } from './dates'
import { entry } from '../test/fixtures'
import { LET_GO, lensesFor, PROMPT_REPEAT_DAYS, PROMPTS, promptFor, promptOptions } from './prompts'
import type { Entry, Lens, Mood } from './types'

const START = '2026-10-01'
const ALL_LENSES: Lens[] = ['people', 'subtraction', 'savour', 'selfCredit', 'kindness', 'hardDay', 'ordinary', 'lookAhead']

/** Simulates a run of nights, each saving the prompt it was given. */
function simulate(nights: number, moodFor: (i: number) => Mood) {
  const entries: Record<string, Entry> = {}
  for (let i = 0; i < nights; i++) {
    const date = addDays(START, i)
    const mood = moodFor(i)
    const p = promptFor(date, entries, mood)
    entries[date] = entry(date, ['tea'], mood, { lens: p.lens, promptId: p.id, promptText: p.text })
  }
  return Object.values(entries)
}

describe('prompt library', () => {
  it('has unique ids', () => {
    expect(new Set(PROMPTS.map((p) => p.id)).size).toBe(PROMPTS.length)
  })
  it('gives every lens several prompts', () => {
    for (const lens of ALL_LENSES) expect(PROMPTS.filter((p) => p.lens === lens).length).toBeGreaterThanOrEqual(6)
  })
})

describe('lens rotation', () => {
  it('never repeats a lens two nights in a row on normal nights', () => {
    const run = simulate(120, () => 4)
    for (let i = 1; i < run.length; i++) expect(run[i].lens).not.toBe(run[i - 1].lens)
  })

  it('never repeats a lens two nights in a row across mixed moods', () => {
    const run = simulate(120, (i) => ([4, 2, 2, 3, 5, 2, 4] as Mood[])[i % 7])
    for (let i = 1; i < run.length; i++) expect(run[i].lens).not.toBe(run[i - 1].lens)
  })

  it('uses every normal lens within two weeks', () => {
    const lenses = new Set(simulate(14, () => 4).map((e) => e.lens))
    for (const lens of lensesFor('normal')) expect(lenses).toContain(lens)
  })

  it('does not repeat a prompt within three weeks', () => {
    const run = simulate(150, () => 4)
    for (let i = 0; i < run.length; i++) {
      for (let j = Math.max(0, i - PROMPT_REPEAT_DAYS); j < i; j++) expect(run[i].promptId).not.toBe(run[j].promptId)
    }
  })

  it('keeps hard-day prompts for low nights', () => {
    for (const e of simulate(40, () => 4)) expect(e.lens).not.toBe('hardDay')
    for (const e of simulate(40, () => 2)) expect(['hardDay', 'selfCredit']).toContain(e.lens)
  })

  it('always asks a very low night what to let go of', () => {
    expect(promptOptions(START, {}, 1)).toEqual([LET_GO])
  })

  it('is stable for a night and shuffles to a different prompt', () => {
    expect(promptFor(START, {}, 4).id).toBe(promptFor(START, {}, 4).id)
    const options = promptOptions(START, {}, 4)
    expect(new Set(options.map((p) => p.id)).size).toBe(options.length)
    expect(promptFor(START, {}, 4, 1).lens).not.toBe(promptFor(START, {}, 4, 0).lens)
  })
})
