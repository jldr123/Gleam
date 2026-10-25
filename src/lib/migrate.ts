import { lensOf } from './prompts'
import { DEFAULT_BACKUP, DEFAULT_SETTINGS, type BackupState, type Entry, type Gratitude, type HelpCheck, type Mood, type Settings } from './types'

export const STORE_VERSION = 6

export interface Persisted {
  entries: Record<string, Entry>
  draft: null
  settings: Settings
  backup: BackupState
  clockOffsetMs: number
  /** True once the first-run screens were seen or skipped. */
  onboarded: boolean
  /** The night the heavy-stretch card was last shown. Kept on this phone only, never in a backup. */
  careShownOn: string | null
  /** Answers to the monthly "Is Gleam helping?" check. Only shown in a backup. */
  helpChecks: HelpCheck[]
  /** The night that check was last asked. */
  helpAskedOn: string | null
  /** Prototype tools unlocked by tapping the version number seven times. */
  devTools: boolean
  /** Gleam Plus unlocked. The App Store version will restore this from Apple; it is never in a backup. */
  plus: boolean
  /** The year whose review was last opened, so the home card stops showing once seen. */
  yearSeen: number | null
}

/** Fields older versions didn't have. */
type Later = Pick<Persisted, 'onboarded' | 'careShownOn' | 'helpChecks' | 'helpAskedOn' | 'devTools' | 'plus' | 'yearSeen'>

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

/** Version 2 had no letters or rhythm. */
type EntryV2 = Omit<Entry, 'letter' | 'letterOffered'>

function entryFromV2(e: EntryV2): Entry {
  return { ...e, letter: null, letterOffered: false }
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
    letter: null,
    letterOffered: false,
    createdAt: e.createdAt ?? 0,
    updatedAt: e.updatedAt ?? 0,
  }
}

/**
 * Brings stored data (or a backup file) from any older version up to date. Entries are kept;
 * an unfinished draft from an older version is dropped since its steps no
 * longer exist.
 */
export function migrate(persisted: unknown, version: number): Persisted {
  const old = (persisted ?? {}) as Partial<
    { entries: Record<string, unknown>; settings: Partial<Settings>; backup: BackupState; clockOffsetMs: number } & Later
  >
  const entries: Record<string, Entry> = {}
  for (const [date, raw] of Object.entries(old.entries ?? {})) {
    if (version < 2) entries[date] = entryFromV1(raw as EntryV1)
    else if (version < 3) entries[date] = entryFromV2(raw as EntryV2)
    else entries[date] = raw as Entry
  }
  return {
    entries,
    draft: null,
    settings: {
      ...DEFAULT_SETTINGS,
      ...old.settings,
      rhythm: { ...DEFAULT_SETTINGS.rhythm, ...old.settings?.rhythm },
      packs: Array.isArray(old.settings?.packs) ? old.settings.packs : [],
    },
    backup: { ...DEFAULT_BACKUP, ...old.backup },
    clockOffsetMs: old.clockOffsetMs ?? 0,
    // People who already reflected before the first-run screens existed skip them.
    onboarded: old.onboarded ?? Object.keys(entries).length > 0,
    careShownOn: old.careShownOn ?? null,
    helpChecks: Array.isArray(old.helpChecks) ? old.helpChecks : [],
    helpAskedOn: old.helpAskedOn ?? null,
    devTools: old.devTools ?? false,
    plus: old.plus ?? false,
    yearSeen: old.yearSeen ?? null,
  }
}
