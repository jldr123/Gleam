import { lensOf } from './prompts'
import { DEFAULT_SETTINGS, type Entry, type Gratitude, type Mood, type Settings } from './types'

export const STORE_VERSION = 2

export interface Persisted {
  entries: Record<string, Entry>
  draft: null
  settings: Settings
  clockOffsetMs: number
}

/** Version 1 stored gratitudes as plain strings and had no lens, stars or thank-yous. */
interface EntryV1 {
  date: string
  gratitudes: string[]
  promptId: string
  promptText: string
  promptAnswer: string
  mood: Mood | null
  moodNote: string
  createdAt: number
  updatedAt: number
}

function entryFromV1(e: EntryV1): Entry {
  return {
    date: e.date,
    mood: e.mood ?? null,
    gratitudes: (e.gratitudes ?? []).filter((g) => typeof g === 'string' && g.trim()).map((text): Gratitude => ({ text, because: '' })),
    lens: lensOf(e.promptId),
    promptId: e.promptId ?? '',
    promptText: e.promptText ?? '',
    promptAnswer: e.promptAnswer ?? '',
    moodNote: e.moodNote ?? '',
    weekPick: null,
    starred: false,
    thanks: [],
    createdAt: e.createdAt ?? 0,
    updatedAt: e.updatedAt ?? 0,
  }
}

/**
 * Brings stored data from any older version up to date. Entries are kept;
 * an unfinished draft from an older version is dropped since its steps no
 * longer exist.
 */
export function migrate(persisted: unknown, version: number): Persisted {
  const old = (persisted ?? {}) as Partial<{ entries: Record<string, unknown>; settings: Settings; clockOffsetMs: number }>
  const entries: Record<string, Entry> = {}
  for (const [date, raw] of Object.entries(old.entries ?? {})) {
    entries[date] = version < 2 ? entryFromV1(raw as EntryV1) : (raw as Entry)
  }
  return {
    entries,
    draft: null,
    settings: { ...DEFAULT_SETTINGS, ...old.settings },
    clockOffsetMs: old.clockOffsetMs ?? 0,
  }
}
