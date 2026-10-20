export type Mood = 1 | 2 | 3 | 4 | 5

export const MOODS: { value: Mood; label: string }[] = [
  { value: 1, label: 'Heavy' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Steady' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Bright' },
]

export const MAX_TEXT_LENGTH = 280

/** Each night's prompt comes from one of these proven exercise types. */
export type Lens = 'people' | 'subtraction' | 'savour' | 'selfCredit' | 'kindness' | 'hardDay' | 'ordinary' | 'lookAhead'

export interface Gratitude {
  text: string
  /** Optional: why it mattered. */
  because: string
}

export interface ThankYou {
  name: string
  at: number
}

export interface Entry {
  /** Logical date, YYYY-MM-DD. */
  date: string
  mood: Mood | null
  /** Zero to three; empty slots are dropped on save. */
  gratitudes: Gratitude[]
  /** Null for older entries and Sunday look-backs. */
  lens: Lens | null
  promptId: string
  promptText: string
  promptAnswer: string
  moodNote: string
  /** On a Sunday look-back, the date of the moment kept from the week. */
  weekPick: string | null
  /** Chosen as the moment to keep in a Sunday look-back. */
  starred: boolean
  /** Thank-yous shared from this night. Private to the device. */
  thanks: ThankYou[]
  createdAt: number
  updatedAt: number
}

export type Step = 'mood' | 'gratitude' | 'prompt' | 'lookback' | 'thanks' | 'note'

export type Draft = Omit<Entry, 'starred' | 'createdAt' | 'updatedAt'> & {
  step: Step
  /** How many times "Ask me something else" was tapped. */
  promptSkip: number
}

export type Theme = 'auto' | 'light' | 'dark'

export interface Settings {
  name: string
  theme: Theme
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  theme: 'auto',
}
