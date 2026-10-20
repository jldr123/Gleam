import { addDays } from './dates'
import { closingLine, isGeneric, isLookbackNight, maxGratitudes, stepsFor } from './flow'
import { entry } from '../test/fixtures'
import { findPerson, thankYouDraft } from './people'
import { moodBranch } from './prompts'
import type { Gratitude, Mood } from './types'

const MONDAY = '2026-10-19'
const SUNDAY = '2026-10-25'
const none: Gratitude[] = []
const draft = (mood: Mood | null, gratitudes: Gratitude[] = none, promptAnswer = '', date = MONDAY) => ({ date, mood, gratitudes, promptAnswer })

describe('mood branching', () => {
  it('maps moods to branches', () => {
    expect([1, 2, 3, 4, 5].map((m) => moodBranch(m as Mood))).toEqual(['veryLow', 'low', 'normal', 'normal', 'normal'])
    expect(moodBranch(null)).toBe('normal')
  })

  it('offers fewer gratitude slots on harder days', () => {
    expect([maxGratitudes('normal'), maxGratitudes('low'), maxGratitudes('veryLow')]).toEqual([3, 1, 0])
  })

  it('starts with mood alone until one is picked', () => {
    expect(stepsFor(draft(null), {})).toEqual(['mood'])
  })

  it('runs the normal flow on a good day', () => {
    expect(stepsFor(draft(4), {})).toEqual(['mood', 'gratitude', 'prompt', 'note'])
  })

  it('keeps one gratitude slot on a low day', () => {
    expect(stepsFor(draft(2), {})).toEqual(['mood', 'gratitude', 'prompt', 'note'])
  })

  it('skips the gratitude ask on a very low day', () => {
    expect(stepsFor(draft(1), {})).toEqual(['mood', 'prompt', 'note'])
  })

  it('offers "Tell them?" only when a person is named', () => {
    expect(stepsFor(draft(4, [{ text: 'Sam made dinner', because: '' }]), {})).toContain('thanks')
    expect(stepsFor(draft(4, [{ text: 'a hot shower', because: '' }]), {})).not.toContain('thanks')
    expect(stepsFor(draft(4, none, 'My sister called'), {})).toContain('thanks')
  })

  it('closes with a line matched to the mood', () => {
    expect(closingLine(1, MONDAY)).not.toBe(closingLine(4, MONDAY))
    expect(['Hard days count too. Rest now.', 'You made room for today, even a hard one. Sleep gently.', 'Not every day is easy. You still showed up.']).toContain(closingLine(2, MONDAY))
  })
})

describe('Sunday look-back', () => {
  const week = Object.fromEntries([1, 3, 5].map((n) => [addDays(SUNDAY, -n), entry(addDays(SUNDAY, -n))]))

  it('replaces the lens on Sundays with enough of the week', () => {
    expect(isLookbackNight(SUNDAY, week, 4)).toBe(true)
    expect(stepsFor(draft(4, none, '', SUNDAY), week)).toEqual(['mood', 'gratitude', 'lookback', 'note'])
  })

  it('needs at least two other nights and is skipped on very low nights', () => {
    expect(isLookbackNight(SUNDAY, { [addDays(SUNDAY, -1)]: entry(addDays(SUNDAY, -1)) }, 4)).toBe(false)
    expect(isLookbackNight(SUNDAY, week, 1)).toBe(false)
    expect(isLookbackNight(addDays(SUNDAY, 1), week, 4)).toBe(false)
  })
})

describe('specificity nudge', () => {
  it('spots generic entries', () => {
    expect(isGeneric('family')).toBe(true)
    expect(isGeneric('My health.')).toBe(true)
    expect(isGeneric('Sam making dinner when I was tired')).toBe(false)
    expect(isGeneric('')).toBe(false)
  })
})

describe('findPerson', () => {
  it('finds names and relations', () => {
    expect(findPerson('Coffee with Priya')).toEqual({ name: 'Priya', relation: false })
    expect(findPerson('Sam made dinner')).toEqual({ name: 'Sam', relation: false })
    expect(findPerson('a long call with mum')).toEqual({ name: 'Mum', relation: false })
    expect(findPerson('my sister checking in')).toEqual({ name: 'my sister', relation: true })
  })

  it('leaves out things that are not people', () => {
    expect(findPerson('Coffee on the balcony')).toBeNull()
    expect(findPerson('Sunshine on Saturday')).toBeNull()
    expect(findPerson('I finished early')).toBeNull()
  })

  it('drafts a thank-you that greets by name', () => {
    expect(thankYouDraft({ name: 'Sam', relation: false })).toMatch(/^Hi Sam, /)
    expect(thankYouDraft({ name: 'my sister', relation: true })).toMatch(/^Hi, /)
  })
})
