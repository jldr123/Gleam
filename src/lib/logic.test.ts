import { addDays, logicalDate } from './dates'
import { moodWeek, resurface, topThemes } from './stats'
import { computeStreak } from './streak'
import { entry } from '../test/fixtures'

const TODAY = '2026-10-19'

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
    const list = [
      entry('a', ['Coffee with Sam', 'Sam made dinner']),
      entry('b', ['a walk with Sam']),
      entry('c', ['coffee', 'Sam again']),
      entry('d', ['coffee in the garden']),
    ]
    expect(topThemes(list)).toEqual([
      { word: 'coffee', count: 3 },
      { word: 'sam', count: 3 },
    ])
  })

  it('needs three evenings before a theme shows', () => {
    const list = [entry('a', ['the garden']), entry('b', ['the garden again'])]
    expect(topThemes(list)).toEqual([])
    expect(topThemes([...list, entry('c', ['garden'])])).toEqual([{ word: 'garden', count: 3 }])
  })

  it('leaves out common verbs like call, clean and book', () => {
    const texts = ['A long call with Mum', 'Finishing the report early', 'Clean sheets', 'A quiet hour with a book', 'Called Dad']
    const list = ['a', 'b', 'c'].map((d) => entry(d, texts))
    const words = topThemes(list, 20).map((t) => t.word)
    for (const w of ['call', 'called', 'clean', 'book', 'finishing', 'quiet', 'hour', 'early']) expect(words).not.toContain(w)
    expect(words).toEqual(expect.arrayContaining(['report', 'sheets', 'mum', 'dad']))
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
  it('waits for enough history', () => {
    expect(resurface(byDate(30, 31, 32), TODAY)).toBeNull()
  })
  it('prefers an entry from exactly a month ago', () => {
    expect(resurface(byDate(1, 2, 3, 4, 5, 10, 30), TODAY)?.lead).toBe('A month ago you were grateful for')
  })
  it('otherwise picks a starred or detailed entry older than a week', () => {
    const entries = byDate(1, 2, 3, 4, 5, 6, 12, 15)
    const starred = addDays(TODAY, -15)
    entries[starred] = entry(starred, ['the sea'], 4, { starred: true })
    expect(resurface(entries, TODAY)?.entry.date).toBe(starred)
  })
  it('ignores the last week', () => {
    expect(resurface(byDate(0, 1, 2, 3, 4, 5, 6), TODAY)).toBeNull()
  })
})
