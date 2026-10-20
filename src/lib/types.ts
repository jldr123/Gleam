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

/** A longer thank-you written on an occasional deeper night. */
export interface Letter {
  to: string
  text: string
  /** True once shared through the share sheet or copied; otherwise it was kept. */
  sent: boolean
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
  /** The letter written on a deeper night, if one was. */
  letter: Letter | null
  /** True when this night offered a letter, whether or not one was written. */
  letterOffered: boolean
  createdAt: number
  updatedAt: number
}

export type Step = 'mood' | 'gratitude' | 'prompt' | 'lookback' | 'letter' | 'thanks' | 'note'

export type Draft = Omit<Entry, 'starred' | 'createdAt' | 'updatedAt'> & {
  step: Step
  /** How many times "Ask me something else" was tapped. */
  promptSkip: number
  /** On a deeper night, whether the user chose the letter or tonight's question instead. */
  letterChoice: 'undecided' | 'write' | 'declined'
}

export type Theme = 'auto' | 'light' | 'dark'

/** Every night, or only on chosen weekdays (0 is Sunday). */
export interface Rhythm {
  mode: 'nightly' | 'some'
  nights: number[]
}

export interface Settings {
  name: string
  theme: Theme
  rhythm: Rhythm
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  theme: 'auto',
  rhythm: { mode: 'nightly', nights: [0, 3] },
}

/** When the user last saved a backup, for the gentle reminder. */
export interface BackupState {
  lastExportAt: number | null
  entriesAtExport: number
  /** Entry count when the reminder was last dismissed. */
  dismissedAtCount: number
}

export const DEFAULT_BACKUP: BackupState = { lastExportAt: null, entriesAtExport: 0, dismissedAtCount: 0 }
