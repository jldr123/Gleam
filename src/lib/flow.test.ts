import { addDays } from './dates'
import { closingLine, isLetterNight, isLookbackNight, LETTER_EVERY_DAYS, maxGratitudes, specificityNudge, stepsFor } from './flow'
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
  it('asks about people for people', () => {
    for (const t of ['family', 'friends', 'kids', 'My parents', 'Sam', 'mum']) expect(specificityNudge(t)).toBe('What about them today?')
  })
  it('asks about it for things', () => {
    for (const t of ['coffee', 'music', 'home', 'My health.', 'sunshine', 'pizza']) expect(specificityNudge(t)).toBe('What made it good today?')
  })
  it('leaves specific entries alone', () => {
    expect(specificityNudge('Sam making dinner when I was tired')).toBeNull()
    expect(specificityNudge('')).toBeNull()
  })
})

describe('deeper letter night', () => {
  const history = (days: number[], extra = {}) =>
    Object.fromEntries(days.map((n) => [addDays(MONDAY, -n), entry(addDays(MONDAY, -n), ['tea'], 4, extra)]))
  const month = Array.from({ length: 40 }, (_, i) => i + 1)

  it('waits for a few weeks of history', () => {
    expect(isLetterNight(MONDAY, history([1, 2, 3]), 4)).toBe(false)
  })

  it('never comes on a low or very low night', () => {
    expect(isLetterNight(MONDAY, history(month), 2)).toBe(false)
    expect(isLetterNight(MONDAY, history(month), 1)).toBe(false)
  })

  it('is offered within a week once a month has passed, then not again for a month', () => {
    const entries = history(month)
    const offered = Array.from({ length: 7 }, (_, i) => addDays(MONDAY, i)).filter((d) => isLetterNight(d, entries, 4))
    expect(offered.length).toBeGreaterThan(0)
    const first = offered[0]
    entries[first] = entry(first, ['tea'], 4, { letterOffered: true })
    for (let i = 1; i < LETTER_EVERY_DAYS; i++) expect(isLetterNight(addDays(first, i), entries, 4)).toBe(false)
  })

  it('replaces the lens and skips the short thank-you, unless declined', () => {
    const entries = history(month)
    const night = Array.from({ length: 7 }, (_, i) => addDays(MONDAY, i)).find((d) => isLetterNight(d, entries, 4))!
    const named = [{ text: 'Sam made dinner', because: '' }]
    expect(stepsFor({ ...draft(4, named, '', night), letterChoice: 'undecided' }, entries)).toEqual(['mood', 'gratitude', 'letter', 'note'])
    expect(stepsFor({ ...draft(4, named, '', night), letterChoice: 'declined' }, entries)).toEqual(['mood', 'gratitude', 'prompt', 'thanks', 'note'])
  })
})

describe('findPerson', () => {
  it('finds names and relations', () => {
    expect(findPerson('Coffee with Priya')).toMatchObject({ name: 'Priya', relation: false })
    expect(findPerson('Sam made dinner')).toMatchObject({ name: 'Sam', relation: false })
    expect(findPerson('a long call with mum')).toMatchObject({ name: 'Mum', relation: false })
    expect(findPerson('my sister checking in')).toMatchObject({ name: 'my sister', relation: true })
    expect(findPerson('Lunch was nice. Priya called after')).toMatchObject({ name: 'Priya' })
  })

  it('leaves out things that are not people', () => {
    expect(findPerson('Coffee on the balcony')).toBeNull()
    expect(findPerson('Sunshine on Saturday')).toBeNull()
    expect(findPerson('I finished early')).toBeNull()
  })

  it('skips places and brands', () => {
    expect(findPerson('a walk in Hyde Park')).toBeNull()
    expect(findPerson('a walk in Regent Park')).toBeNull()
    expect(findPerson('dinner at Nando’s with the team')).toBeNull()
    expect(findPerson('the train to Brighton')).toBeNull()
    expect(findPerson('a postcard from Lisbon')).toBeNull()
    expect(findPerson('pancakes at Pizza Express')).toBeNull()
    expect(findPerson('watching Netflix')).toBeNull()
    expect(findPerson('the view on Arthur Seat')).toBeNull()
  })

  it('accepts a bare name as the whole entry', () => {
    expect(findPerson('Jess')).toMatchObject({ name: 'Jess', relation: false })
    expect(findPerson('Jess.')).toMatchObject({ name: 'Jess' })
    expect(findPerson('Pizza')).toBeNull()
    expect(findPerson('Toast')).toBeNull()
    expect(findPerson('Sunset')).toBeNull()
    expect(findPerson('Sunday')).toBeNull()
    expect(findPerson('Netflix')).toBeNull()
  })

  it('still finds a person alongside a place', () => {
    expect(findPerson('a walk in Hyde Park with Sam')).toMatchObject({ name: 'Sam' })
  })
})

describe('thankYouDraft', () => {
  const sam = { name: 'Sam', relation: false, match: 'Sam' }
  const hi = (p: { name: string; relation: boolean; match: string }, text: string, because = '') => thankYouDraft(p, { text, because })

  it('builds the message from their own words', () => {
    expect(hi(sam, 'Sam covered my shift', 'I could make it to Mum’s')).toBe(
      'Hi Sam, I was thinking back on today. You covered my shift, and it meant I could make it to Mum’s. Thank you, it really helped.',
    )
    expect(hi(sam, 'Sam made dinner', 'I was exhausted and he just took over')).toBe(
      'Hi Sam, I was thinking back on today. You made dinner. I was exhausted and you just took over. Thank you, it really helped.',
    )
  })

  it('thanks them for a shared moment', () => {
    expect(hi({ name: 'Priya', relation: false, match: 'Priya' }, 'Coffee with Priya', 'she listened properly')).toBe(
      'Hi Priya, I was thinking back on today. Thank you for the coffee. You listened properly. It meant a lot.',
    )
    expect(hi({ name: 'Mum', relation: false, match: 'Mum' }, 'A long call with Mum', 'she always knows what to say')).toBe(
      'Hi Mum, I was thinking back on today. Thank you for the long call. You always know what to say. It meant a lot.',
    )
    expect(hi(sam, 'Laughing with Sam about nothing')).toBe('Hi Sam, I was thinking back on today. Thank you for laughing with me about nothing. It meant a lot.')
  })

  it('handles relations and prompt answers', () => {
    expect(hi({ name: 'my sister', relation: true, match: 'sister' }, 'my sister checking in')).toBe('Hi, I was thinking back on today. Thank you for checking in. It meant a lot.')
    expect(thankYouDraft({ name: 'Priya', relation: false, match: 'Priya' }, { text: 'Priya, who covered for me.' })).toBe(
      'Hi Priya, I was thinking back on today. You covered for me. Thank you, it really helped.',
    )
  })

  it('falls back to a general line when there is nothing to build from', () => {
    expect(hi(sam, 'Sam')).toBe('Hi Sam, I was thinking back on today. Thank you for today. It meant more than you know.')
    expect(thankYouDraft(sam)).toMatch(/^Hi Sam, .*more than you know\.$/)
  })

  it('reads smoothly for the review cases', () => {
    const sarah = { name: 'Sarah', relation: false, match: 'Sarah' }
    const alex = { name: 'Alex', relation: false, match: 'Alex' }
    const dad = { name: 'Dad', relation: false, match: 'Dad' }
    const boss = { name: 'my boss', relation: true, match: 'boss' }
    expect(hi(sarah, 'Lunch with Sarah from work')).toBe('Hi Sarah, I was thinking back on today. Thank you for lunch. It meant a lot.')
    expect(hi(alex, 'Coffee with Alex')).toBe('Hi Alex, I was thinking back on today. Thank you for the coffee. It meant a lot.')
    expect(hi(dad, 'Talked to Dad')).toBe('Hi Dad, I was thinking back on today. Thank you for the chat. It meant a lot.')
    expect(hi(boss, 'my boss said well done')).toBe('Hi, I was thinking back on today. Thank you for saying well done. It meant a lot.')
    expect(hi(sam, 'Sam covered my shift')).toBe('Hi Sam, I was thinking back on today. You covered my shift. Thank you, it really helped.')
  })

  it('drops trailing context and keeps the because-line', () => {
    expect(hi(sam, 'Sam made dinner tonight')).toBe('Hi Sam, I was thinking back on today. You made dinner. Thank you, it really helped.')
    expect(hi({ name: 'Priya', relation: false, match: 'Priya' }, 'A walk with Priya after work', 'I needed the air')).toBe(
      'Hi Priya, I was thinking back on today. Thank you for the walk. I needed the air. It meant a lot.',
    )
  })

  it('falls back to "Thank you for today" when unsure', () => {
    expect(hi(sam, 'Sam and I went to the beach', 'we laughed the whole way')).toBe(
      'Hi Sam, I was thinking back on today. Thank you for today. We laughed the whole way.',
    )
    expect(hi(sam, 'Finally got to see a film with Sam')).toBe('Hi Sam, I was thinking back on today. Thank you for today. It meant more than you know.')
    expect(hi(sam, 'Sam')).toContain('Thank you for today.')
  })
})
