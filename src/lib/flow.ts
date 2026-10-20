import { addDays, daysBetween, weekday } from './dates'
import { findPerson, looksLikeName, type Person, type ThanksSource } from './people'
import { moodBranch, type Branch } from './prompts'
import { DEFAULT_SETTINGS, type Draft, type Entry, type Mood, type Rhythm, type Step } from './types'

export const SUPPORT_URL = 'https://findahelpline.com'

/** How many gratitude slots a night offers. Very low nights skip the ask entirely. */
export function maxGratitudes(branch: Branch): number {
  return branch === 'normal' ? 3 : branch === 'low' ? 1 : 0
}

/** The previous six nights' entries, oldest first. */
export function weekEntries(date: string, entries: Record<string, Entry>): Entry[] {
  return Array.from({ length: 6 }, (_, i) => entries[addDays(date, i - 6)]).filter((e): e is Entry => !!e)
}

/**
 * Sundays with enough of the week swap the lens for a look-back: two other
 * nights when reflecting nightly, one when reflecting a few nights a week.
 */
export function isLookbackNight(date: string, entries: Record<string, Entry>, mood: Mood | null, rhythm: Rhythm = DEFAULT_SETTINGS.rhythm): boolean {
  const needed = rhythm.mode === 'nightly' ? 2 : 1
  return weekday(date) === 0 && moodBranch(mood) !== 'veryLow' && weekEntries(date, entries).length >= needed
}

/** A deeper night comes round about once a month, after a few weeks of reflecting. */
export const LETTER_EVERY_DAYS = 28
export const LETTER_MIN_ENTRIES = 10

/**
 * Whether tonight offers the optional thank-you letter instead of the lens.
 * Only on normal-mood nights, never on a look-back night, and only once
 * a month has passed since the last offer, whether or not it was taken.
 * A date hash spreads the offer over a few nights rather than the same weekday.
 */
export function isLetterNight(date: string, entries: Record<string, Entry>, mood: Mood | null, rhythm: Rhythm = DEFAULT_SETTINGS.rhythm): boolean {
  if (mood === null || moodBranch(mood) !== 'normal' || isLookbackNight(date, entries, mood, rhythm)) return false
  if (entries[date]?.letterOffered) return true
  const past = Object.values(entries).filter((e) => e.date < date)
  if (past.length < LETTER_MIN_ENTRIES) return false
  const offers = past.filter((e) => e.letterOffered).map((e) => e.date)
  const since = offers.length ? daysBetween(offers.reduce((a, b) => (a > b ? a : b)), date) : Infinity
  if (since < LETTER_EVERY_DAYS) return false
  // Once due, the offer turns up within about a week; on a few-nights rhythm, the first chosen night.
  if (rhythm.mode === 'some' || since >= LETTER_EVERY_DAYS + 7) return true
  let h = 0
  for (const c of date) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % 3 === 0
}

type FlowDraft = Pick<Draft, 'date' | 'mood' | 'gratitudes' | 'promptAnswer'> & Partial<Pick<Draft, 'letterChoice'>>

/** The steps for tonight, in order. Recomputed as the draft changes, since mood and names reshape the flow. */
export function stepsFor(draft: FlowDraft, entries: Record<string, Entry>, rhythm: Rhythm = DEFAULT_SETTINGS.rhythm): Step[] {
  const branch = moodBranch(draft.mood)
  const steps: Step[] = ['mood']
  if (draft.mood === null) return steps
  if (maxGratitudes(branch) > 0) steps.push('gratitude')
  const letter = isLetterNight(draft.date, entries, draft.mood, rhythm) && draft.letterChoice !== 'declined'
  if (isLookbackNight(draft.date, entries, draft.mood, rhythm)) steps.push('lookback')
  else steps.push(letter ? 'letter' : 'prompt')
  // A letter night already thanks someone, so it skips the short thank-you.
  if (!letter && personFromDraft(draft)) steps.push('thanks')
  steps.push('note')
  return steps
}

/** The first person tonight's words name, with the words to build a thank-you from. */
export function personFromDraft(draft: Pick<Draft, 'gratitudes' | 'promptAnswer'>): (Person & { source: ThanksSource }) | null {
  for (const g of draft.gratitudes) {
    const p = findPerson(`${g.text}. ${g.because}`)
    if (p) return { ...p, source: { text: g.text, because: g.because } }
  }
  const p = findPerson(draft.promptAnswer)
  return p ? { ...p, source: { text: draft.promptAnswer } } : null
}

const GENERIC_PEOPLE = new Set([
  'family', 'friends', 'friend', 'kids', 'children', 'parents', 'people', 'partner', 'loved ones', 'my family',
  'my friends', 'my kids', 'my children', 'my parents', 'my partner', 'my loved ones', 'colleagues', 'team', 'my team',
])

const GENERIC_THINGS = new Set([
  'health', 'my health', 'food', 'home', 'my home', 'house', 'my house', 'life', 'my life', 'work', 'my work', 'job',
  'my job', 'money', 'love', 'everything', 'nothing', 'sleep', 'weather', 'god', 'coffee', 'tea', 'music', 'nature',
  'today', 'water', 'books', 'my bed', 'bed', 'pets', 'my dog', 'my cat', 'exercise', 'rest', 'peace', 'sunshine',
])

/**
 * A gentle placeholder asking for something specific when an entry is a
 * single word or very general, or null when it already reads specific. It
 * never blocks saving.
 */
export function specificityNudge(text: string): string | null {
  const t = text.trim().toLowerCase().replace(/[.!]+$/, '')
  if (!t) return null
  const single = !t.includes(' ')
  if (GENERIC_PEOPLE.has(t) || (single && (findPerson(text) || looksLikeName(text.trim())))) return 'What about them today?'
  if (GENERIC_THINGS.has(t) || (single && t.length <= 12)) return 'What made it good today?'
  return null
}

const CLOSING: Record<Branch, string[]> = {
  normal: [
    'Rest well. You noticed good things today.',
    'Let the day settle. The good parts are kept.',
    'That is today, held gently. Sleep well.',
    'Good things noticed. Time to rest.',
  ],
  low: [
    'Hard days count too. Rest now.',
    'You made room for today, even a hard one. Sleep gently.',
    'Not every day is easy. You still showed up.',
  ],
  veryLow: [
    'You showed up tonight. That is enough.',
    'Be gentle with yourself tonight. Tomorrow is a new day.',
    'Put it down for now. You can rest.',
  ],
}

/** One calm line to end the night, matched to the mood. */
export function closingLine(mood: Mood | null, date: string): string {
  const lines = CLOSING[moodBranch(mood)]
  let h = 0
  for (const c of date) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return lines[h % lines.length]
}
