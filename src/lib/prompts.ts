import { addDays, daysBetween } from './dates'
import type { Entry, Lens, Mood } from './types'

export interface Prompt {
  id: string
  lens: Lens
  text: string
}

/** Gentle, open questions, grouped by lens. Ids are stored on entries, so never rename one. */
export const PROMPTS: Prompt[] = [
  // People: gratitude towards others is the strongest kind.
  { id: 'easier', lens: 'people', text: 'Who made today a little easier? What did they do?' },
  { id: 'thank', lens: 'people', text: 'Who would you thank today, and what would you say?' },
  { id: 'friend', lens: 'people', text: 'Which person are you glad is in your life right now?' },
  { id: 'conversation', lens: 'people', text: 'Which conversation stayed with you today?' },
  { id: 'showedup', lens: 'people', text: 'Who showed up for you lately, in a big or small way?' },
  { id: 'taught', lens: 'people', text: 'Who taught you something today, even without meaning to?' },
  { id: 'message', lens: 'people', text: 'Whose voice or message were you glad to get today?' },

  // Subtraction: imagining something gone beats counting it.
  { id: 'without', lens: 'subtraction', text: 'Picture today without one thing you have. What would be missing?' },
  { id: 'nevermet', lens: 'subtraction', text: 'Imagine you had never met someone close to you. What would be different?' },
  { id: 'shelter', lens: 'subtraction', text: 'What would tonight feel like without your bed, your home or your warmth?' },
  { id: 'routine', lens: 'subtraction', text: 'Which part of your routine would you miss most if it vanished?' },
  { id: 'granted', lens: 'subtraction', text: 'What did you take for granted today that some people go without?' },
  { id: 'younger', lens: 'subtraction', text: 'What would your younger self be glad you have now?' },

  // Savour: replaying a moment strengthens it.
  { id: 'replay', lens: 'savour', text: 'Replay one moment. What did you see, hear or feel?' },
  { id: 'smile', lens: 'savour', text: 'What made you smile, even briefly?' },
  { id: 'again', lens: 'savour', text: 'Which moment from today would you happily live again?' },
  { id: 'taste', lens: 'savour', text: 'What did you eat, drink or smell that you enjoyed?' },
  { id: 'sound', lens: 'savour', text: 'What sound, song or voice did you enjoy today?' },
  { id: 'calm', lens: 'savour', text: 'When did you feel most at ease today?' },
  { id: 'place', lens: 'savour', text: 'Where were you when you felt good today?' },
  { id: 'surprise', lens: 'savour', text: 'What surprised you today, in a good way?' },

  // Self-credit: your own effort counts too.
  { id: 'proud', lens: 'selfCredit', text: 'What did you handle well today?' },
  { id: 'effort', lens: 'selfCredit', text: 'What did you do today that took effort, even if nobody saw?' },
  { id: 'selfkind', lens: 'selfCredit', text: 'Where were you kind to yourself today?' },
  { id: 'tried', lens: 'selfCredit', text: 'What did you try today, whatever the result?' },
  { id: 'learned', lens: 'selfCredit', text: 'What did you learn today, big or small?' },
  { id: 'growth', lens: 'selfCredit', text: 'Where did you grow a little today?' },
  { id: 'body', lens: 'selfCredit', text: 'What did your body do for you today?' },

  // Kindness given.
  { id: 'kindness', lens: 'kindness', text: 'What small kindness did you give today?' },
  { id: 'help', lens: 'kindness', text: 'Who did you help today, and how did it feel?' },
  { id: 'lighter', lens: 'kindness', text: "Did you make someone's day a little lighter? How?" },
  { id: 'listen', lens: 'kindness', text: 'When did you really listen to someone today?' },
  { id: 'gave', lens: 'kindness', text: 'What did you give today: time, attention or a hand?' },
  { id: 'nextkind', lens: 'kindness', text: 'Who could use a small kindness from you tomorrow?' },

  // Hard day: acknowledges pain without forcing a silver lining.
  { id: 'hard', lens: 'hardDay', text: 'What was hard today, and what got you through it?' },
  { id: 'letgo', lens: 'hardDay', text: 'What can you let go of before you sleep?' },
  { id: 'carried', lens: 'hardDay', text: 'What did you carry today that you can put down now?' },
  { id: 'helped', lens: 'hardDay', text: 'What helped, even a little, today?' },
  { id: 'counts', lens: 'hardDay', text: 'What did you get through today that counts?' },
  { id: 'lessheavy', lens: 'hardDay', text: 'Who or what made today feel a little less heavy?' },
  { id: 'gentler', lens: 'hardDay', text: 'What would you like tomorrow to be gentler about?' },

  // Ordinary: the everyday things.
  { id: 'simple', lens: 'ordinary', text: 'What simple thing would you miss if it were gone?' },
  { id: 'enough', lens: 'ordinary', text: 'What about today was enough, just as it was?' },
  { id: 'noticed', lens: 'ordinary', text: 'What did you notice today that you usually overlook?' },
  { id: 'worked', lens: 'ordinary', text: 'What everyday thing worked well today?' },
  { id: 'home', lens: 'ordinary', text: 'What do you like about the place you sleep tonight?' },
  { id: 'object', lens: 'ordinary', text: 'What object made your day a little easier?' },
  { id: 'gift', lens: 'ordinary', text: 'What did today give you that you did not expect?' },
  { id: 'outside', lens: 'ordinary', text: 'What did you see outside today?' },

  // Look ahead: positive thoughts before sleep.
  { id: 'tomorrow', lens: 'lookAhead', text: 'What are you quietly looking forward to?' },
  { id: 'remember', lens: 'lookAhead', text: 'What from today do you want to remember in a year?' },
  { id: 'smallplan', lens: 'lookAhead', text: 'What small thing could make tomorrow good?' },
  { id: 'seeing', lens: 'lookAhead', text: 'Who are you looking forward to seeing soon?' },
  { id: 'season', lens: 'lookAhead', text: 'What are you enjoying about this time of year?' },
  { id: 'morning', lens: 'lookAhead', text: 'What would make tomorrow morning a little easier?' },
]

export const LENS_LABELS: Record<Lens, string> = {
  people: 'People',
  subtraction: 'Without it',
  savour: 'Savour',
  selfCredit: 'Your part',
  kindness: 'Kindness given',
  hardDay: 'A hard day',
  ordinary: 'Ordinary things',
  lookAhead: 'Looking ahead',
}

/** The fixed prompt on a very low night. */
export const LET_GO = PROMPTS.find((p) => p.id === 'letgo')!

/** The Sunday look-back stands in for the lens. */
export const LOOKBACK = { id: 'lookback', text: 'Which moment from this week would you keep?' }

/** A deeper night's letter stands in for the lens. */
export const LETTER = { id: 'letter', text: 'A thank-you letter' }

/** A prompt is not repeated within this many days. */
export const PROMPT_REPEAT_DAYS = 21

export type Branch = 'normal' | 'low' | 'veryLow'

/** Heavy is very low, Low is low, and everything from Steady up is the normal flow. */
export function moodBranch(mood: Mood | null): Branch {
  if (mood === 1) return 'veryLow'
  if (mood === 2) return 'low'
  return 'normal'
}

const NORMAL_LENSES: Lens[] = ['people', 'subtraction', 'savour', 'selfCredit', 'kindness', 'ordinary', 'lookAhead']
const LOW_LENSES: Lens[] = ['hardDay', 'selfCredit']

export function lensesFor(branch: Branch): Lens[] {
  return branch === 'low' ? LOW_LENSES : branch === 'veryLow' ? ['hardDay'] : NORMAL_LENSES
}

export function lensOf(promptId: string): Lens | null {
  return PROMPTS.find((p) => p.id === promptId)?.lens ?? null
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Tonight's prompts in the order "Ask me something else" walks them. The
 * lens differs from last night's, favours the lens used least recently, and
 * skips prompts asked in the last three weeks. Later options rotate through
 * the other allowed lenses so a shuffle feels different.
 */
export function promptOptions(date: string, entries: Record<string, Entry>, mood: Mood | null): Prompt[] {
  const branch = moodBranch(mood)
  if (branch === 'veryLow') return [LET_GO]

  const past = Object.values(entries).filter((e) => e.date < date)
  const lastNight = entries[addDays(date, -1)]?.lens
  const allowed = lensesFor(branch)
  const lenses = allowed.length > 1 ? allowed.filter((l) => l !== lastNight) : allowed

  const daysSince = (lens: Lens) => {
    const used = past.filter((e) => e.lens === lens).map((e) => daysBetween(e.date, date))
    return used.length ? Math.min(...used) : Infinity
  }
  const ordered = [...lenses].sort((a, b) => daysSince(b) - daysSince(a) || hash(date + a) - hash(date + b))

  const recent = new Set(past.filter((e) => daysBetween(e.date, date) <= PROMPT_REPEAT_DAYS).map((e) => e.promptId))
  const perLens = ordered.map((lens) => {
    const all = PROMPTS.filter((p) => p.lens === lens)
    const fresh = all.filter((p) => !recent.has(p.id))
    return (fresh.length ? fresh : all).sort((a, b) => hash(date + a.id) - hash(date + b.id))
  })

  const out: Prompt[] = []
  for (let i = 0; out.length < perLens.reduce((n, l) => n + l.length, 0); i++) {
    for (const list of perLens) if (list[i]) out.push(list[i])
  }
  return out
}

export function promptFor(date: string, entries: Record<string, Entry>, mood: Mood | null, skip = 0): Prompt {
  const options = promptOptions(date, entries, mood)
  return options[skip % options.length]
}

/** Short reasons to reflect, shown on the home screen in the evening. */
export const WHY_LINES = [
  'Noticing what went well trains your attention to find it more often.',
  'Positive thoughts before sleep are linked to sleeping better.',
  'Gratitude tends to strengthen the relationships it is about.',
  'A few honest minutes now can make a hard day feel lighter.',
  'Small, specific moments count more than big general ones.',
  'You do not have to feel grateful for everything. Just notice what is there.',
]

export function whyLineFor(date: string): string {
  return WHY_LINES[hash(`why-${date}`) % WHY_LINES.length]
}
