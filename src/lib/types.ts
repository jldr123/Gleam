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

export type Step = 'mood' | 'care' | 'gratitude' | 'prompt' | 'lookback' | 'letter' | 'thanks' | 'note'

/**
 * The gentle card after a heavy stretch: offered, then either a quick
 * check-in (mood and note only) or carrying on with the usual night.
 */
export type Care = 'none' | 'offer' | 'checkin' | 'carry'

export type Draft = Omit<Entry, 'starred' | 'createdAt' | 'updatedAt'> & {
  step: Step
  /** How many times "Ask me something else" was tapped. */
  promptSkip: number
  /** On a deeper night, whether the user chose the letter or tonight's question instead. */
  letterChoice: 'undecided' | 'write' | 'declined'
  care: Care
}

export type Theme = 'auto' | 'light' | 'dark'

/** Gleam Plus colour palettes. Ember is the free default. */
export type Palette = 'ember' | 'candlelight' | 'dusk' | 'paper' | 'sage'

/** Gleam Plus heading fonts. Fraunces is the free default. */
export type HeadingFont = 'fraunces' | 'classic' | 'modern'

export type PackId = 'relationships' | 'hardSeasons' | 'work' | 'travel'

/** Every night, or only on chosen weekdays (0 is Sunday). */
export interface Rhythm {
  mode: 'nightly' | 'some'
  nights: number[]
}

export interface Settings {
  name: string
  theme: Theme
  rhythm: Rhythm
  /** The evening reflection time, HH:MM in 24 hours. Kept for native reminders later. */
  reminderTime: string
  /** Lighter nights: one gratitude instead of up to three. */
  light: boolean
  /** Plus: only applied while Plus is unlocked, so it is kept if Plus lapses and returns. */
  palette: Palette
  font: HeadingFont
  /** Plus: prompt packs mixed into the nightly rotation. */
  packs: PackId[]
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  theme: 'auto',
  rhythm: { mode: 'nightly', nights: [0, 3] },
  reminderTime: '21:30',
  light: false,
  palette: 'ember',
  font: 'fraunces',
  packs: [],
}

export type HelpAnswer = 'yes' | 'sortOf' | 'notReally'

/** An answer to the monthly "Is Gleam helping you wind down?" check. Only ever shown in a backup. */
export interface HelpCheck {
  date: string
  answer: HelpAnswer
}

/** When the user last saved a backup, for the gentle reminder. */
export interface BackupState {
  lastExportAt: number | null
  entriesAtExport: number
  /** Entry count when the reminder was last dismissed. */
  dismissedAtCount: number
}

export const DEFAULT_BACKUP: BackupState = { lastExportAt: null, entriesAtExport: 0, dismissedAtCount: 0 }
