import { finishedMonths, monthKey, summariseMonth } from './months'
import { entry } from '../test/fixtures'

const g = (text: string, because = '') => ({ text, because })

const sept = [
  entry('2026-09-02', [], 4, { gratitudes: [g('Sam made dinner'), g('Morning coffee')] }),
  entry('2026-09-05', [], 3, { gratitudes: [g('A walk with Sam'), g('Coffee with Priya')], starred: true }),
  entry('2026-09-09', [], 4, { gratitudes: [g('My mum called'), g('Coffee in the garden'), g('A text from an old friend')] }),
  entry('2026-09-12', [], 4, { gratitudes: [g('Lunch with a friend'), g('My sister rang')] }),
  entry('2026-09-14', [], 4, { gratitudes: [g('Walking with my sister')] }),
  entry('2026-09-20', [], 4, { gratitudes: [g('Quiet evening')], promptAnswer: 'Priya helped me move', letter: { to: 'Mum', text: 'Thank you', sent: false } }),
]
const oct = [entry('2026-10-01', ['Sam again'])]

describe('monthly look-back', () => {
  const s = summariseMonth('2026-09', [...sept, ...oct])

  it('counts evenings in the month only', () => {
    expect(s.month).toBe('2026-09')
    expect(s.evenings).toBe(6)
  })

  it('finds the people who came up more than once, once per evening', () => {
    expect(s.people).toEqual([
      { name: 'Mum', count: 2 },
      { name: 'my sister', count: 2 },
      { name: 'Priya', count: 2 },
    ])
    // A friend is often a different friend each time, so it isn't counted.
    expect(s.people.some((p) => p.name.includes('friend'))).toBe(false)
  })

  it('lists things without people in them', () => {
    expect(s.things.map((t) => t.word)).toEqual(['coffee'])
  })

  it('keeps the starred moments and letters', () => {
    expect(s.starred.map((e) => e.date)).toEqual(['2026-09-05'])
    expect(s.letters).toBe(1)
  })

  it('only summarises months that have finished, newest first', () => {
    const aug = entry('2026-08-30')
    expect(finishedMonths([...sept, ...oct, aug], '2026-10-20').map((m) => m.month)).toEqual(['2026-09', '2026-08'])
    expect(finishedMonths(oct, '2026-10-20')).toEqual([])
  })

  it('keys by year and month', () => {
    expect(monthKey('2026-09-30')).toBe('2026-09')
  })
})
