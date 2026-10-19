import { useState } from 'react'
import { Button, Card, TopBar } from '../components/ui'
import type { Theme } from '../lib/types'
import { useStore } from '../store'
import { useUI } from '../ui'

const themes: { value: Theme; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Evening' },
]

const HOUR = 3_600_000

export function Settings() {
  const go = useUI((s) => s.go)
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const offset = useStore((s) => s.clockOffsetMs)
  const setClockOffset = useStore((s) => s.setClockOffset)
  const seedDemo = useStore((s) => s.seedDemo)
  const reset = useStore((s) => s.reset)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="flex min-h-full flex-col">
      <TopBar onBack={() => go('home')} title="Settings" />
      <div className="safe-bottom flex flex-col gap-4 px-5 pt-2">
        <Card>
          <label className="text-xs text-muted" htmlFor="name">
            Your first name
          </label>
          <input
            id="name"
            value={settings.name}
            onChange={(e) => updateSettings({ name: e.target.value.slice(0, 30) })}
            placeholder="Optional"
            className="mt-1 w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-faint"
          />
        </Card>

        <Card>
          <div className="text-xs text-muted">Appearance</div>
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => updateSettings({ theme: t.value })}
                className={`rounded-full py-2 text-sm transition ${settings.theme === t.value ? 'bg-surface font-semibold text-ink shadow-sm' : 'text-muted'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-faint">Auto switches to the evening palette from 6pm.</p>
        </Card>

        <Card>
          <div className="text-[15px] font-semibold">Your entries stay on this phone</div>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Nothing is uploaded or shared. Evening reminders are coming in a later version.
          </p>
        </Card>

        <Card>
          <div className="text-xs font-semibold tracking-wide text-faint uppercase">Prototype tools</div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted">Clock offset: {Math.round(offset / HOUR)}h</span>
            <div className="flex gap-2">
              <Button variant="quiet" className="px-4 py-2" onClick={() => setClockOffset(offset - 24 * HOUR)}>
                -1 day
              </Button>
              <Button variant="quiet" className="px-4 py-2" onClick={() => setClockOffset(offset + 24 * HOUR)}>
                +1 day
              </Button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="quiet" className="px-4 py-2 text-sm" onClick={() => setClockOffset(0)}>
              Reset clock
            </Button>
            <Button variant="quiet" className="px-4 py-2 text-sm" onClick={() => seedDemo(40)}>
              Add demo entries
            </Button>
            <Button variant="quiet" className="px-4 py-2 text-sm" onClick={() => (confirmReset ? (reset(), setConfirmReset(false)) : setConfirmReset(true))}>
              {confirmReset ? 'Tap again to erase everything' : 'Erase all data'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
