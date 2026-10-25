import { entry } from '../test/fixtures'
import { addDays } from './dates'
import { brightestWeekday, insights, inRange, longestRun, moodByWeekday, reviewYearFor, yearReview } from './insights'
import { computeStreak } from './streak'
import type { Entry, Mood, Rhythm } from './types'

const byDate = (list: Entry[]) => Object.fromEntries(list.map((e) => [e.date, e]))

describe('inRange', () => {
  const entries = byDate([entry('2026-10-21'), entry('2026-09-22'), entry('2026-09-21'), entry('2025-01-01')])
  it('counts today as one of the days', () => {
    expect(inRange(entries, '2026-10-21', 30).map((e) => e.date)).toEqual(['2026-09-22', '2026-10-21'])
    expect(inRange(entries, '2026-10-21', 'all')).toHaveLength(4)
  })
})

describe('longestRun', () => {
  const nightly = { mode: 'nightly' as const, nights: [] }
  it('finds the longest streak, not the current one', () => {
    const dates = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-06', '2026-10-07', '2026-10-10', '2026-10-11']
    expect(longestRun(byDate(dates.map((d) => entry(d))), '2026-10-11', nightly)).toBe(6)
  })
  it('agrees with the current streak, forgiven night included', () => {
    const dates = ['2026-10-01', '2026-10-02', '2026-10-04', '2026-10-05']
    expect(longestRun(byDate(dates.map((d) => entry(d))), '2026-10-05', nightly)).toBe(4)
  })
  it('lets rest nights pass without breaking a run', () => {
    // Mondays and Wednesdays only: 5th and 7th October 2026, then the 12th.
    const some = { mode: 'some' as const, nights: [1, 3] }
    expect(longestRun(byDate(['2026-10-05', '2026-10-07', '2026-10-12'].map((d) => entry(d))), '2026-10-13', some)).toBe(3)
  })
  /** The first version: the streak walk from every entry date. Slow, but plainly right. */
  const reference = (entries: Record<string, Entry>, today: string, rhythm: Rhythm) =>
    Object.keys(entries)
      .filter((d) => d <= today)
      .reduce((best, d) => Math.max(best, computeStreak(entries, d, rhythm).nights), 0)

  it('matches the streak walk from every night, on varied data', () => {
    let seed = 7
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
    const rhythms: Rhythm[] = [nightly, { mode: 'some', nights: [1, 3] }, { mode: 'some', nights: [0, 2, 4, 6] }, { mode: 'some', nights: [5] }]
    for (let trial = 0; trial < 60; trial++) {
      const rhythm = rhythms[trial % rhythms.length]
      const keep = 0.5 + rand() * 0.5
      const list: Entry[] = []
      for (let i = 0; i < 120; i++) if (rand() < keep) list.push(entry(addDays('2026-01-01', i)))
      const today = addDays('2026-01-01', 110 + Math.floor(rand() * 20))
      const entries = byDate(list)
      expect(longestRun(entries, today, rhythm)).toBe(reference(entries, today, rhythm))
    }
  })

  it('handles three years of entries quickly', () => {
    const list: Entry[] = []
    for (let i = 0; i < 3 * 365; i++) if (i % 11 !== 0) list.push(entry(addDays('2024-01-01', i)))
    const entries = byDate(list)
    const started = performance.now()
    const best = longestRun(entries, '2026-12-31', nightly)
    expect(performance.now() - started).toBeLessThan(100)
    expect(best).toBeGreaterThan(30)
  })

  it("doesn't count tonight as missed", () => {
    expect(longestRun(byDate([entry('2026-10-20')]), '2026-10-21', nightly)).toBe(1)
  })
})

describe('moods', () => {
  // Fridays (2nd, 9th, 16th October 2026) are bright, Mondays heavy.
  const list = [
    ...['2026-10-02', '2026-10-09', '2026-10-16'].map((d) => entry(d, ['tea'], 5)),
    ...['2026-10-05', '2026-10-12', '2026-10-19'].map((d) => entry(d, ['tea'], 2)),
  ]
  it('averages by weekday, Monday first', () => {
    const days = moodByWeekday(list)
    expect(days[0]).toMatchObject({ name: 'Monday', average: 2, count: 3 })
    expect(days[4]).toMatchObject({ name: 'Friday', average: 5, count: 3 })
    expect(days[6]).toMatchObject({ name: 'Sunday', average: null, count: 0 })
  })
  it('names the lightest weekday only with enough nights and a real difference', () => {
    expect(brightestWeekday(moodByWeekday(list))?.name).toBe('Friday')
    expect(brightestWeekday(moodByWeekday(list.slice(0, 4)))).toBeNull()
    const flat = list.map((e) => ({ ...e, mood: 3 as Mood }))
    expect(brightestWeekday(moodByWeekday(flat))).toBeNull()
  })
})

describe('insights', () => {
  it('counts people across evenings and keeps names out of things', () => {
    const list = [
      entry('2026-10-01', ['Coffee with Sam', 'The garden after rain']),
      entry('2026-10-02', ['Sam cooked dinner', 'The garden in the sun']),
      entry('2026-10-03', ['A walk in the garden']),
    ]
    const data = insights(list)
    expect(data.people).toEqual([{ name: 'Sam', count: 2 }])
    expect(data.things.map((t) => t.word)).toContain('garden')
    expect(data.things.map((t) => t.word)).not.toContain('sam')
    expect(data.moods).toEqual([0, 0, 3, 0, 0])
  })
})

describe('year in review', () => {
  it('is offered through December and the first week of January', () => {
    expect(reviewYearFor('2026-11-30')).toBeNull()
    expect(reviewYearFor('2026-12-01')).toBe(2026)
    expect(reviewYearFor('2027-01-07')).toBe(2026)
    expect(reviewYearFor('2027-01-08')).toBeNull()
  })

  it('gathers the year: busiest and lightest months, favourites and kept moments', () => {
    const list: Entry[] = []
    for (let i = 0; i < 10; i++) list.push(entry(addDays('2026-03-01', i), ['tea'], 3))
    for (let i = 0; i < 5; i++) list.push(entry(addDays('2026-06-01', i), ['tea'], 5))
    list.push(
      entry('2026-06-20', [], 4, { gratitudes: [{ text: 'Sam made dinner', because: 'I was exhausted' }], starred: true }),
    )
    list.push(entry('2025-12-31', ['last year'], 3))
    const review = yearReview(byDate(list), 2026)
    expect(review.nights).toBe(16)
    expect(review.busiestMonth).toEqual({ month: '2026-03', nights: 10 })
    expect(review.brightestMonth?.month).toBe('2026-06')
    expect(review.favourites.map((f) => f.gratitude.text)).toEqual(['Sam made dinner'])
    expect(review.kept.map((e) => e.date)).toEqual(['2026-06-20'])
  })

  it('lists a favourite written on two nights only once', () => {
    const g = { text: 'A text from an old friend', because: 'just to say hi' }
    const review = yearReview(byDate([entry('2026-11-01', [], 4, { gratitudes: [g] }), entry('2026-11-09', [], 4, { gratitudes: [g] })]), 2026)
    expect(review.favourites).toHaveLength(1)
  })
})
