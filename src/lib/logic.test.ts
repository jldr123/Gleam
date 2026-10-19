import { addDays, logicalDate } from './dates'
import { promptFor } from './prompts'
import { moodWeek, resurface, topThemes } from './stats'
import { computeStreak } from './streak'
import type { Entry } from './types'

const TODAY = '2026-10-19'

const entry = (date: string, gratitudes: string[] = ['tea'], mood: Entry['mood'] = 3): Entry => ({
  date,
  gratitudes,
  promptId: 'x',
  promptText: 'x',
  promptAnswer: '',
  mood,
  moodNote: '',
  createdAt: 0,
  updatedAt: 0,
})

const byDate = (...daysAgo: number[]) => Object.fromEntries(daysAgo.map((n) => [addDays(TODAY, -n), entry(addDays(TODAY, -n))]))

describe('logicalDate', () => {
  it('keeps just-after-midnight with the evening before', () => {
    expect(logicalDate(new Date(2026, 9, 20, 0, 30))).toBe('2026-10-19')
    expect(logicalDate(new Date(2026, 9, 20, 4, 0))).toBe('2026-10-20')
  })
})

describe('computeStreak', () => {
  it('is zero with no entries', () => {
    expect(computeStreak({}, TODAY)).toEqual({ nights: 0, restUsed: false })
  })

  it('does not break before tonight is done', () => {
    expect(computeStreak(byDate(1, 2, 3), TODAY)).toEqual({ nights: 3, restUsed: false })
    expect(computeStreak(byDate(0, 1, 2, 3), TODAY)).toEqual({ nights: 4, restUsed: false })
  })

  it('forgives one missed night', () => {
    expect(computeStreak(byDate(0, 1, 3, 4), TODAY)).toEqual({ nights: 4, restUsed: true })
  })

  it('ends on two missed nights within a week', () => {
    expect(computeStreak(byDate(0, 2, 4, 5), TODAY).nights).toBe(2)
    expect(computeStreak(byDate(0, 3, 4), TODAY).nights).toBe(1)
  })

  it('allows a rest night every week', () => {
    const run = byDate(0, 1, 2, 4, 5, 6, 7, 8, 9, 11, 12)
    expect(computeStreak(run, TODAY).nights).toBe(11)
  })
})

describe('topThemes', () => {
  it('counts words once per night and drops filler', () => {
    const list = [entry('a', ['Coffee with Sam', 'Sam made dinner']), entry('b', ['a walk with Sam']), entry('c', ['coffee'])]
    expect(topThemes(list)).toEqual([
      { word: 'sam', count: 2 },
      { word: 'coffee', count: 2 },
    ].sort((a, b) => b.count - a.count || a.word.localeCompare(b.word)))
  })
})

describe('moodWeek', () => {
  it('covers the last seven days, oldest first', () => {
    const week = moodWeek(byDate(0, 6), TODAY)
    expect(week).toHaveLength(7)
    expect(week[0]).toEqual({ date: addDays(TODAY, -6), mood: 3 })
    expect(week[3].mood).toBeNull()
    expect(week[6].date).toBe(TODAY)
  })
})

describe('resurface', () => {
  it('prefers an entry from exactly a week ago', () => {
    expect(resurface(byDate(7, 10), TODAY)?.label).toBe('A week ago')
  })
  it('ignores the last few days', () => {
    expect(resurface(byDate(0, 1, 2), TODAY)).toBeNull()
  })
})

describe('promptFor', () => {
  it('is stable for a date and changes with skip', () => {
    expect(promptFor(TODAY).id).toBe(promptFor(TODAY).id)
    expect(promptFor(TODAY, 1).id).not.toBe(promptFor(TODAY).id)
  })
})
