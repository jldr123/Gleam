import { useRef, useState } from 'react'
import { Button, Card, TopBar } from '../components/ui'
import {
  backupFileName,
  backupJSON,
  backupText,
  BackupError,
  hasDefaultSettings,
  parseBackup,
  planImport,
  restoredSettings,
  settingsDiffer,
  type BackupFile,
  type ImportPlan,
} from '../lib/backup'
import type { Settings } from '../lib/types'
import { useStore } from '../store'
import { useUI } from '../ui'

/** Saves a file through the share sheet where it can take files (iPhone), otherwise as a download. */
async function saveFile(name: string, type: string, content: string): Promise<boolean> {
  const file = new File([content], name, { type })
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] })
      return true
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return false
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}

type Pending = { file: BackupFile; plan: ImportPlan }

export function Backup() {
  const back = useUI((s) => s.back)
  const entries = useStore((s) => s.entries)
  const settings = useStore((s) => s.settings)
  const backup = useStore((s) => s.backup)
  const helpChecks = useStore((s) => s.helpChecks)
  const updateSettings = useStore((s) => s.updateSettings)
  const recordExport = useStore((s) => s.recordExport)
  const importEntries = useStore((s) => s.importEntries)
  const input = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [askSettings, setAskSettings] = useState<{ settings: Settings; restored: string } | null>(null)

  const count = Object.keys(entries).length
  const last = backup.lastExportAt ? new Date(backup.lastExportAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long' }) : null

  const exportJSON = async () => {
    if (await saveFile(backupFileName('json'), 'application/json', backupJSON(entries, settings, helpChecks))) {
      recordExport()
      setMessage('Backup saved. Keep it somewhere safe, like iCloud Drive or Files.')
    }
  }

  const exportText = async () => {
    if (await saveFile(backupFileName('txt'), 'text/plain', backupText(entries))) setMessage('Readable copy saved.')
  }

  const choose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setAskSettings(null)
    try {
      const file = parseBackup(await f.text())
      const plan = planImport(entries, file.entries)
      if (plan.conflicts.length === 0) finish(file, plan, false)
      else setPending({ file, plan })
    } catch (err) {
      setPending(null)
      setMessage(err instanceof BackupError ? err.message : "That file couldn't be read.")
    }
  }

  const finish = (file: BackupFile, plan: ImportPlan, replace: boolean) => {
    importEntries(file.entries, replace, file.helpChecks)
    setPending(null)
    const changed = plan.added.length + (replace ? plan.conflicts.length : 0)
    const restored = changed === 0 ? 'Everything in that backup is already here.' : `Restored ${changed} ${changed === 1 ? 'night' : 'nights'}.`
    const current = useStore.getState().settings
    if (!settingsDiffer(current, file.settings)) return setMessage(restored)
    // A phone that was never set up takes the backup's settings; otherwise ask first.
    if (hasDefaultSettings(current)) {
      updateSettings(restoredSettings(current, file.settings))
      return setMessage(`${restored} Your settings are back too.`)
    }
    setMessage(null)
    setAskSettings({ settings: file.settings, restored })
  }

  const answerSettings = (yes: boolean) => {
    if (!askSettings) return
    if (yes) updateSettings(restoredSettings(useStore.getState().settings, askSettings.settings))
    setMessage(`${askSettings.restored}${yes ? ' Your settings are back too.' : ''}`)
    setAskSettings(null)
  }

  return (
    <div className="flex min-h-full flex-col">
      <TopBar onBack={back} title="Backup and export" />
      <div className="safe-bottom flex flex-col gap-4 px-5 pt-2">
        <Card>
          <div className="font-serif text-[22px] leading-snug font-light">Your reflections live only on this phone.</div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Nothing is uploaded. Saving a backup now and then means a lost phone or cleared browser doesn't take them with it.
          </p>
          <p className="mt-3 text-xs text-faint">
            {count} {count === 1 ? 'night' : 'nights'} saved{last ? `. Last backup ${last}.` : '. No backup yet.'}
          </p>
        </Card>

        <Card>
          <div className="text-xs text-muted">Export</div>
          <div className="mt-3 flex flex-col gap-2">
            <Button onClick={exportJSON} disabled={count === 0}>
              Save a backup
            </Button>
            <Button variant="quiet" onClick={exportText} disabled={count === 0}>
              Save a readable copy
            </Button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-faint">The backup can be restored into Gleam. The readable copy is plain text to keep, read or print.</p>
        </Card>

        <Card>
          <div className="text-xs text-muted">Restore</div>
          {askSettings ? (
            <div className="mt-2">
              <p className="text-[15px] leading-relaxed">{askSettings.restored} Also restore your settings?</p>
              <p className="mt-1 text-sm text-muted">Your name, theme, rhythm and reflection time from the backup.</p>
              <div className="mt-3 flex flex-col gap-2">
                <Button variant="quiet" onClick={() => answerSettings(true)}>
                  Restore settings
                </Button>
                <Button variant="ghost" onClick={() => answerSettings(false)}>
                  Keep this phone's settings
                </Button>
              </div>
            </div>
          ) : pending ? (
            <div className="mt-2">
              <p className="text-[15px] leading-relaxed">
                {pending.plan.added.length > 0 && `${pending.plan.added.length} new ${pending.plan.added.length === 1 ? 'night' : 'nights'} will be added. `}
                {pending.plan.conflicts.length} {pending.plan.conflicts.length === 1 ? 'night is' : 'nights are'} on this phone and in the backup with different words.
                Replace {pending.plan.conflicts.length === 1 ? 'it' : 'them'} with the backup?
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Button variant="quiet" onClick={() => finish(pending.file, pending.plan, false)}>
                  Keep what's on this phone
                </Button>
                <Button variant="quiet" onClick={() => finish(pending.file, pending.plan, true)}>
                  Use the backup's version
                </Button>
                <Button variant="ghost" onClick={() => setPending(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button variant="quiet" className="mt-3 w-full" onClick={() => input.current?.click()}>
                Restore from a backup
              </Button>
              <p className="mt-3 text-xs leading-relaxed text-faint">Nights are merged by date. You'll be asked before anything on this phone is replaced.</p>
            </>
          )}
          <input ref={input} type="file" accept="application/json,.json" onChange={choose} className="hidden" />
        </Card>

        {message && (
          <div role="status" className="px-2 text-center text-sm text-muted">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
