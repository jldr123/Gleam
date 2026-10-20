import type { Entry } from '../lib/types'

/** A minimal saved entry for tests. */
export const entry = (date: string, gratitudes: string[] = ['tea'], mood: Entry['mood'] = 3, extra: Partial<Entry> = {}): Entry => ({
  date,
  mood,
  gratitudes: gratitudes.map((text) => ({ text, because: '' })),
  lens: null,
  promptId: 'x',
  promptText: 'x',
  promptAnswer: '',
  moodNote: '',
  weekPick: null,
  starred: false,
  thanks: [],
  letter: null,
  letterOffered: false,
  createdAt: 0,
  updatedAt: 0,
  ...extra,
})
