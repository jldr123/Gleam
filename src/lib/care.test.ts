import { heavyNights, isHelpCheckNight, needsCare } from './care'
import { addDays } from './dates'
import type { Entry, Mood } from './types'
import { entry } from '../test/fixtures'

const tonight = '2026-10-20'
const nights = (moods: Mood[]) => Object.fromEntries(moods.map((m, i) => [addDays(tonight, -1 - i), entry(addDays(tonight, -1 - i), [], m)]))

describe('care after a heavy stretch', () => {
  const heavy = nights([1, 3, 1, 2, 1])

  it('counts heavy nights in the last seven', () => {
    expect(heavyNights(tonight, heavy)).toBe(3)
    expect(heavyNights(tonight, { ...heavy, [addDays(tonight, -8)]: entry(addDays(tonight, -8), [], 1) })).toBe(3)
  })

  it('shows on a low or heavy night after three heavy nights', () => {
    expect(needsCare(tonight, heavy, 1, null)).toBe(true)
    expect(needsCare(tonight, heavy, 2, null)).toBe(true)
  })

  it('never shows on a good night', () => {
    expect(needsCare(tonight, heavy, 3, null)).toBe(false)
    expect(needsCare(tonight, heavy, 5, null)).toBe(false)
  })

  it('needs three heavy nights, not just low ones', () => {
    expect(needsCare(tonight, nights([1, 2, 2, 1, 2]), 1, null)).toBe(false)
  })

  it('shows at most once a week', () => {
    expect(needsCare(tonight, heavy, 1, addDays(tonight, -3))).toBe(false)
    expect(needsCare(tonight, heavy, 1, addDays(tonight, -7))).toBe(true)
    // Tonight still counts once it was offered, so changing mood back and forth keeps it.
    expect(needsCare(tonight, heavy, 1, tonight)).toBe(true)
  })
})

describe('monthly "Is this helping?" check', () => {
  const many = (n: number): Record<string, Entry> =>
    Object.fromEntries(Array.from({ length: n }, (_, i) => addDays(tonight, -i)).map((d) => [d, entry(d, ['tea'], 3, { letterOffered: d === addDays(tonight, -12) })]))

  it('waits for ten entries', () => {
    expect(isHelpCheckNight(tonight, many(9), 4, null)).toBe(false)
    expect(isHelpCheckNight(tonight, many(14), 4, null)).toBe(true)
  })

  it('only asks on normal-mood nights', () => {
    expect(isHelpCheckNight(tonight, many(14), 2, null)).toBe(false)
    expect(isHelpCheckNight(tonight, many(14), 1, null)).toBe(false)
  })

  it('asks once a month', () => {
    expect(isHelpCheckNight(tonight, many(40), 4, addDays(tonight, -20))).toBe(false)
    expect(isHelpCheckNight(tonight, many(40), 4, addDays(tonight, -30))).toBe(true)
    expect(isHelpCheckNight(tonight, many(40), 4, tonight)).toBe(true)
  })

  it('leaves a letter night alone', () => {
    const e = many(14)
    e[tonight] = { ...e[tonight], letterOffered: true }
    expect(isHelpCheckNight(tonight, e, 4, null)).toBe(false)
  })
})
