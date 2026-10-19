export type Mood = 1 | 2 | 3 | 4 | 5

export const MOODS: { value: Mood; label: string }[] = [
  { value: 1, label: 'Heavy' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Steady' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Bright' },
]

export const MAX_TEXT_LENGTH = 280

export interface Entry {
  /** Logical date, YYYY-MM-DD. */
  date: string
  /** Up to three; empty slots are dropped on save. */
  gratitudes: string[]
  promptId: string
  promptText: string
  promptAnswer: string
  mood: Mood | null
  moodNote: string
  createdAt: number
  updatedAt: number
}

export type Draft = Omit<Entry, 'createdAt' | 'updatedAt'> & { step: number }

export type Theme = 'auto' | 'light' | 'dark'

export interface Settings {
  name: string
  theme: Theme
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  theme: 'auto',
}
