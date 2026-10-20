import { formatLongDate } from './dates'
import { migrate, STORE_VERSION } from './migrate'
import { DEFAULT_SETTINGS, MOODS, type BackupState, type Entry, type HelpCheck, type Settings } from './types'

export const BACKUP_APP = 'gleam'

export interface BackupFile {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  entries: Record<string, Entry>
  settings: Settings
  /** Answers to the monthly "Is Gleam helping?" check. */
  helpChecks: HelpCheck[]
}

export function backupJSON(entries: Record<string, Entry>, settings: Settings, helpChecks: HelpCheck[] = [], now = new Date()): string {
  const file: BackupFile = { app: BACKUP_APP, version: STORE_VERSION, exportedAt: now.toISOString(), entries, settings, helpChecks }
  return JSON.stringify(file, null, 2)
}

/** A plain-text copy to read or print, oldest night first. */
export function backupText(entries: Record<string, Entry>): string {
  const lines: string[] = ['Gleam reflections', '']
  for (const e of Object.values(entries).sort((a, b) => a.date.localeCompare(b.date))) {
    lines.push(formatLongDate(e.date) + (e.starred ? ' (kept from the week)' : ''))
    const mood = MOODS.find((m) => m.value === e.mood)
    if (mood) lines.push(`Felt ${mood.label.toLowerCase()}`)
    for (const g of e.gratitudes) lines.push(`- ${g.text}${g.because ? `, because ${g.because}` : ''}`)
    if (e.promptAnswer) lines.push(`${e.promptText}`, `  ${e.promptAnswer}`)
    if (e.letter) lines.push(`A letter to ${e.letter.to}:`, ...e.letter.text.split('\n').map((l) => `  ${l}`))
    if (e.thanks.length) lines.push(`Said thank you to ${[...new Set(e.thanks.map((t) => t.name))].join(' and ')}`)
    if (e.moodNote) lines.push(`"${e.moodNote}"`)
    lines.push('')
  }
  return lines.join('\n')
}

export class BackupError extends Error {}

/** Reads a backup file, bringing older versions up to date. Throws BackupError with a readable message. */
export function parseBackup(text: string): BackupFile {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new BackupError("That file couldn't be read. Choose a Gleam backup ending in .json.")
  }
  const file = data as Partial<BackupFile>
  if (!file || file.app !== BACKUP_APP || typeof file.entries !== 'object' || file.entries === null) {
    throw new BackupError("That doesn't look like a Gleam backup.")
  }
  const version = typeof file.version === 'number' ? file.version : 1
  if (version > STORE_VERSION) throw new BackupError('This backup is from a newer version of Gleam. Update the app and try again.')
  const migrated = migrate({ entries: file.entries, settings: file.settings, helpChecks: file.helpChecks }, version)
  for (const [date, e] of Object.entries(migrated.entries)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || e.date !== date) throw new BackupError('Some nights in this backup are damaged, so nothing was imported.')
  }
  return {
    app: BACKUP_APP,
    version: STORE_VERSION,
    exportedAt: file.exportedAt ?? '',
    entries: migrated.entries,
    settings: migrated.settings,
    helpChecks: migrated.helpChecks,
  }
}

export interface ImportPlan {
  /** Nights only in the backup, always added. */
  added: string[]
  /** Nights on both, with different words; replaced only if the user confirms. */
  conflicts: string[]
  /** Nights identical on both, nothing to do. */
  same: string[]
}

const comparable = (e: Entry) => JSON.stringify({ ...e, createdAt: 0, updatedAt: 0 })

export function planImport(existing: Record<string, Entry>, incoming: Record<string, Entry>): ImportPlan {
  const plan: ImportPlan = { added: [], conflicts: [], same: [] }
  for (const [date, e] of Object.entries(incoming)) {
    const mine = existing[date]
    if (!mine) plan.added.push(date)
    else if (comparable(mine) === comparable(e)) plan.same.push(date)
    else plan.conflicts.push(date)
  }
  for (const list of Object.values(plan)) list.sort()
  return plan
}

/** Merges by date. Nights on this phone are kept unless `replace` is true. */
export function applyImport(existing: Record<string, Entry>, incoming: Record<string, Entry>, replace: boolean): Record<string, Entry> {
  const plan = planImport(existing, incoming)
  const next = { ...existing }
  for (const d of plan.added) next[d] = incoming[d]
  if (replace) for (const d of plan.conflicts) next[d] = incoming[d]
  return next
}

/** The settings a backup can bring back. */
const RESTORABLE = ['name', 'theme', 'rhythm', 'reminderTime', 'light'] as const

/** True when this phone's settings were never changed, so a restore can bring the backup's in without asking. */
export function hasDefaultSettings(settings: Settings): boolean {
  return RESTORABLE.every((k) => JSON.stringify(settings[k]) === JSON.stringify(DEFAULT_SETTINGS[k]))
}

/** Whether restoring would change anything, so the question is only asked when it matters. */
export function settingsDiffer(current: Settings, backup: Settings): boolean {
  return RESTORABLE.some((k) => JSON.stringify(current[k]) !== JSON.stringify(backup[k]))
}

/** This phone's settings with name, theme, rhythm and reflection time taken from the backup. */
export function restoredSettings(current: Settings, backup: Settings): Settings {
  const next = { ...current }
  for (const k of RESTORABLE) (next as Record<string, unknown>)[k] = backup[k]
  return next
}

/** Merges the monthly check answers by date, keeping this phone's on a clash. */
export function mergeHelpChecks(existing: HelpCheck[], incoming: HelpCheck[]): HelpCheck[] {
  const byDate = new Map(incoming.map((c) => [c.date, c]))
  for (const c of existing) byDate.set(c.date, c)
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

/** Nights saved between gentle backup reminders. */
export const BACKUP_EVERY = 30
/** An export this recent counts as backed up, whatever the count. */
export const RECENT_EXPORT_DAYS = 14

/** Whether to show the gentle reminder: every 30 nights since the last backup or dismissal, unless one was saved recently. */
export function needsBackupReminder(count: number, backup: BackupState, now: number): boolean {
  if (count < BACKUP_EVERY) return false
  const recent = backup.lastExportAt !== null && now - backup.lastExportAt < RECENT_EXPORT_DAYS * 86_400_000
  if (recent) return false
  const since = count - Math.max(backup.entriesAtExport, backup.dismissedAtCount)
  return since >= BACKUP_EVERY
}

export function backupFileName(kind: 'json' | 'txt', now = new Date()): string {
  const d = now.toISOString().slice(0, 10)
  return kind === 'json' ? `gleam-backup-${d}.json` : `gleam-reflections-${d}.txt`
}
