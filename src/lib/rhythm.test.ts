import { isReflectionNight, toggleNight } from './rhythm'
import { computeStreak } from './streak'
import type { Rhythm } from './types'
import { entry } from '../test/fixtures'

// 2026-10-18 is a Sunday, 2026-10-14 a Wednesday.
const sunWed: Rhythm = { mode: 'some', nights: [0, 3] }

describe('rhythm', () => {
  it('treats every night as a reflection night by default', () => {
    expect(isReflectionNight('2026-10-20', { mode: 'nightly', nights: [0] })).toBe(true)
  })

  it('only counts chosen nights on a few nights a week', () => {
    expect(isReflectionNight('2026-10-18', sunWed)).toBe(true)
    expect(isReflectionNight('2026-10-14', sunWed)).toBe(true)
    expect(isReflectionNight('2026-10-20', sunWed)).toBe(false)
  })

  it('toggles nights but always keeps one', () => {
    expect(toggleNight(sunWed, 5).nights).toEqual([0, 3, 5])
    expect(toggleNight(sunWed, 3).nights).toEqual([0])
    const one: Rhythm = { mode: 'some', nights: [2] }
    expect(toggleNight(one, 2)).toBe(one)
  })
})

describe('streak with a rhythm', () => {
  const entries = Object.fromEntries(['2026-10-18', '2026-10-14', '2026-10-11', '2026-10-07'].map((d) => [d, entry(d)]))

  it('ignores rest nights entirely', () => {
    // Tuesday 20th, last chosen night was Sunday 18th.
    expect(computeStreak(entries, '2026-10-20', sunWed)).toEqual({ nights: 4, restUsed: false })
  })

  it('breaks the same entries when every night counts', () => {
    expect(computeStreak(entries, '2026-10-20').nights).toBe(1)
  })

  it('forgives one missed chosen night', () => {
    const { '2026-10-14': _, ...missed } = entries
    expect(computeStreak(missed, '2026-10-20', sunWed)).toEqual({ nights: 3, restUsed: true })
  })

  it('ends after two missed chosen nights within a week', () => {
    const { '2026-10-14': _a, '2026-10-11': _b, ...missed } = entries
    expect(computeStreak(missed, '2026-10-20', sunWed).nights).toBe(1)
  })
})
