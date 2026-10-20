import { applyImport, backupJSON, backupText, BackupError, hasDefaultSettings, mergeHelpChecks, needsBackupReminder, parseBackup, planImport, restoredSettings, settingsDiffer } from './backup'
import { formatLongDate } from './dates'
import { STORE_VERSION } from './migrate'
import { DEFAULT_BACKUP, DEFAULT_SETTINGS } from './types'
import { entry } from '../test/fixtures'

const entries = {
  '2026-10-18': entry('2026-10-18', ['Sam made dinner'], 4, { promptText: 'Who made today easier?', promptAnswer: 'Priya', starred: true }),
  '2026-10-19': entry('2026-10-19', ['Tea'], 2, { letter: { to: 'Mum', text: 'Thank you\nfor everything', sent: true } }),
}

describe('backup files', () => {
  it('round-trips a backup', () => {
    const json = backupJSON(entries, DEFAULT_SETTINGS, [], new Date('2026-10-20T10:00:00Z'))
    const file = parseBackup(json)
    expect(file.version).toBe(STORE_VERSION)
    expect(file.exportedAt).toBe('2026-10-20T10:00:00.000Z')
    expect(file.entries).toEqual(entries)
    expect(file.settings).toEqual(DEFAULT_SETTINGS)
  })

  it('brings an older backup up to date', () => {
    const old = { app: 'gleam', version: 1, entries: { '2026-10-01': { date: '2026-10-01', gratitudes: ['Tea'], promptId: 'x', promptText: 'x', promptAnswer: '', mood: 3, moodNote: '', createdAt: 1, updatedAt: 1 } } }
    const file = parseBackup(JSON.stringify(old))
    expect(file.entries['2026-10-01']).toMatchObject({ gratitudes: [{ text: 'Tea', because: '' }], letter: null })
  })

  it.each([
    ['not JSON', 'hello', "couldn't be read"],
    ['another app', JSON.stringify({ app: 'other', entries: {} }), "doesn't look like"],
    ['a newer version', JSON.stringify({ app: 'gleam', version: STORE_VERSION + 1, entries: {} }), 'newer version'],
    ['a damaged date', JSON.stringify({ app: 'gleam', version: STORE_VERSION, entries: { nope: entry('nope') } }), 'damaged'],
  ])('rejects %s', (_, text, message) => {
    expect(() => parseBackup(text)).toThrow(BackupError)
    expect(() => parseBackup(text)).toThrow(message)
  })

  it('writes a readable copy, oldest first', () => {
    const text = backupText(entries)
    expect(text.indexOf(formatLongDate('2026-10-18'))).toBeGreaterThan(0)
    expect(text.indexOf(formatLongDate('2026-10-18'))).toBeLessThan(text.indexOf(formatLongDate('2026-10-19')))
    expect(text).toContain('- Sam made dinner')
    expect(text).toContain('Who made today easier?\n  Priya')
    expect(text).toContain('A letter to Mum:\n  Thank you\n  for everything')
    expect(text).toContain('(kept from the week)')
  })
})

describe('importing', () => {
  const incoming = {
    '2026-10-17': entry('2026-10-17', ['Rain']),
    '2026-10-18': { ...entries['2026-10-18'], updatedAt: 99 },
    '2026-10-19': entry('2026-10-19', ['Different words']),
  }

  it('plans by date, ignoring save times', () => {
    expect(planImport(entries, incoming)).toEqual({ added: ['2026-10-17'], conflicts: ['2026-10-19'], same: ['2026-10-18'] })
  })

  it('keeps nights on this phone unless asked to replace them', () => {
    const kept = applyImport(entries, incoming, false)
    expect(Object.keys(kept).sort()).toEqual(['2026-10-17', '2026-10-18', '2026-10-19'])
    expect(kept['2026-10-19'].gratitudes[0].text).toBe('Tea')
    expect(applyImport(entries, incoming, true)['2026-10-19'].gratitudes[0].text).toBe('Different words')
  })
})

describe('backup reminder', () => {
  const now = Date.parse('2026-10-20T12:00:00Z')
  const day = 86_400_000

  it('waits for 30 nights', () => {
    expect(needsBackupReminder(29, DEFAULT_BACKUP, now)).toBe(false)
    expect(needsBackupReminder(30, DEFAULT_BACKUP, now)).toBe(true)
  })

  it('stays quiet after a recent backup', () => {
    expect(needsBackupReminder(80, { ...DEFAULT_BACKUP, lastExportAt: now - 3 * day, entriesAtExport: 20 }, now)).toBe(false)
  })

  it('comes back 30 nights after the last backup or dismissal', () => {
    const old = { lastExportAt: now - 60 * day, entriesAtExport: 30, dismissedAtCount: 0 }
    expect(needsBackupReminder(59, old, now)).toBe(false)
    expect(needsBackupReminder(60, old, now)).toBe(true)
    expect(needsBackupReminder(60, { ...old, dismissedAtCount: 45 }, now)).toBe(false)
  })
})

describe('restoring settings', () => {
  const mine = { ...DEFAULT_SETTINGS, name: 'Joe', theme: 'dark' as const }
  const theirs = { ...DEFAULT_SETTINGS, name: 'Jo', rhythm: { mode: 'some' as const, nights: [1, 4] }, reminderTime: '22:00' }

  it('knows when this phone still has its default settings', () => {
    expect(hasDefaultSettings(DEFAULT_SETTINGS)).toBe(true)
    expect(hasDefaultSettings(mine)).toBe(false)
    expect(hasDefaultSettings({ ...DEFAULT_SETTINGS, reminderTime: '20:00' })).toBe(false)
  })

  it('brings back name, theme, rhythm and reflection time', () => {
    expect(restoredSettings(mine, theirs)).toEqual(theirs)
    expect(settingsDiffer(mine, theirs)).toBe(true)
    expect(settingsDiffer(theirs, { ...theirs })).toBe(false)
  })

  it('keeps settings and help checks in the backup file', () => {
    const json = backupJSON({}, theirs, [{ date: '2026-10-01', answer: 'yes' }])
    const file = parseBackup(json)
    expect(file.settings).toEqual(theirs)
    expect(file.helpChecks).toEqual([{ date: '2026-10-01', answer: 'yes' }])
  })

  it('merges help checks by date, keeping this phone on a clash', () => {
    expect(
      mergeHelpChecks([{ date: '2026-10-01', answer: 'yes' }], [
        { date: '2026-10-01', answer: 'notReally' },
        { date: '2026-09-01', answer: 'sortOf' },
      ]),
    ).toEqual([
      { date: '2026-09-01', answer: 'sortOf' },
      { date: '2026-10-01', answer: 'yes' },
    ])
  })
})
