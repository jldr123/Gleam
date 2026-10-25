import { addDays } from './dates'
import { entry } from '../test/fixtures'
import { LET_GO, lensesFor, lensOf, PROMPT_REPEAT_DAYS, PROMPTS, promptFor, promptOptions } from './prompts'
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
    for (const lens of ALL_LENSES) expect(PROMPTS.filter((p) => p.lens === lens && !p.retired).length).toBeGreaterThanOrEqual(6)
  })

  it('uses the gentler wording, keeping ids stable', () => {
    const text = (id: string) => PROMPTS.find((p) => p.id === id)?.text
    expect(text('granted')).toBe('What small comfort did you have today?')
    expect(text('nevermet')).toBe('Who are you glad crossed your path?')
    expect(text('shelter')).toBe('What do you like about where you are tonight?')
    const all = PROMPTS.map((p) => p.text).join(' ')
    expect(all).not.toMatch(/go without|never met|without your bed/)
  })

  it('includes awe prompts in savour', () => {
    const savour = PROMPTS.filter((p) => p.lens === 'savour').map((p) => p.text)
    expect(savour).toEqual(
      expect.arrayContaining(['What did you see today that was beautiful?', 'What made you stop and look today?', 'What felt bigger than you today, in a good way?']),
    )
  })

  it('never asks a retired prompt, but still knows its lens', () => {
    const retired = PROMPTS.filter((p) => p.retired).map((p) => p.id)
    expect(retired).toContain('home')
    const asked = simulate(200, () => 4).map((e) => e.promptId)
    for (const id of retired) expect(asked).not.toContain(id)
    expect(lensOf('home')).toBe('ordinary')
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

describe('prompt packs', () => {
  const packIds = new Set(PROMPTS.filter((p) => p.pack).map((p) => p.id))

  it('never asks a pack question unless that pack is on', () => {
    for (let i = 0; i < 60; i++) {
      const date = addDays(START, i)
      for (const mood of [1, 2, 3, 5] as Mood[]) {
        for (const p of promptOptions(date, {}, mood)) expect(packIds.has(p.id)).toBe(false)
      }
    }
  })

  it('puts questions from a pack that is on first within their lens', () => {
    const date = '2026-10-05'
    const options = promptOptions(date, {}, 4, ['work'])
    const firstOfLens = new Map<string, (typeof options)[number]>()
    for (const p of options) if (!firstOfLens.has(p.lens)) firstOfLens.set(p.lens, p)
    expect(firstOfLens.get('selfCredit')?.pack).toBe('work')
    expect(options.some((p) => p.pack && p.pack !== 'work')).toBe(false)
  })

  it('keeps the very low night fixed even with packs on', () => {
    expect(promptOptions('2026-10-05', {}, 1, ['hardSeasons'])).toEqual([LET_GO])
  })

  it('lets hard seasons questions come up on low nights', () => {
    const options = promptOptions('2026-10-05', {}, 2, ['hardSeasons'])
    expect(options.some((p) => p.pack === 'hardSeasons')).toBe(true)
  })
})

describe('Hard seasons on ordinary nights', () => {
  const simulateWith = (nights: number, mood: Mood, packs: ('hardSeasons' | 'work')[]) => {
    const entries: Record<string, Entry> = {}
    for (let i = 0; i < nights; i++) {
      const date = addDays(START, i)
      const p = promptFor(date, entries, mood, 0, packs)
      entries[date] = entry(date, ['tea'], mood, { lens: p.lens, promptId: p.id, promptText: p.text })
    }
    return Object.values(entries)
  }

  it('brings its hard-day questions on Steady nights, now and then rather than every night', () => {
    const nights = simulateWith(40, 3, ['hardSeasons'])
    const hard = nights.filter((e) => e.lens === 'hardDay')
    expect(hard.length).toBeGreaterThanOrEqual(3)
    expect(hard.length).toBeLessThanOrEqual(8)
    for (const e of hard) expect(PROMPTS.find((p) => p.id === e.promptId)?.pack).toBe('hardSeasons')
  })

  it('never asks the hard-day lens on ordinary nights without the pack', () => {
    expect(simulateWith(40, 4, ['work']).some((e) => e.lens === 'hardDay')).toBe(false)
  })

  it('keeps the fixed question on Heavy nights', () => {
    expect(promptOptions('2026-10-05', {}, 1, ['hardSeasons'])).toEqual([LET_GO])
  })
})
