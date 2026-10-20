import { useState } from 'react'
import { Button, Card, Chevron, TopBar } from '../components/ui'
import { toggleNight, WEEKDAYS } from '../lib/rhythm'
import type { Rhythm, Theme } from '../lib/types'
import { useStore } from '../store'
import { useUI } from '../ui'

const themes: { value: Theme; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Evening' },
]

const rhythms: { value: Rhythm['mode']; label: string }[] = [
  { value: 'nightly', label: 'Every night' },
  { value: 'some', label: 'A few nights a week' },
]

const HOUR = 3_600_000

export function Settings() {
  const go = useUI((s) => s.go)
  const settings = useStore((s) => s.settings)
  const rhythm = settings.rhythm
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
          <div className="text-xs text-muted">Rhythm</div>
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1">
            {rhythms.map((r) => (
              <button
                key={r.value}
                onClick={() => updateSettings({ rhythm: { ...rhythm, mode: r.value } })}
                className={`rounded-full py-2 text-sm transition ${rhythm.mode === r.value ? 'bg-surface font-semibold text-ink shadow-sm' : 'text-muted'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {rhythm.mode === 'some' && (
            <div className="mt-4 flex justify-between gap-1" role="group" aria-label="Nights to reflect">
              {WEEKDAYS.map((d) => {
                const on = rhythm.nights.includes(d.value)
                return (
                  <button
                    key={d.value}
                    onClick={() => updateSettings({ rhythm: toggleNight(rhythm, d.value) })}
                    aria-pressed={on}
                    className={`h-10 flex-1 rounded-full text-xs transition ${on ? 'bg-accent font-semibold text-accent-ink' : 'bg-surface-2 text-muted'}`}
                  >
                    {d.short}
                  </button>
                )
              })}
            </div>
          )}
          <p className="mt-3 text-xs leading-relaxed text-faint">
            {rhythm.mode === 'nightly'
              ? 'A few minutes every evening.'
              : 'Other nights are rest nights: no prompt, and your streak only counts the nights you chose. For some people, less often keeps it feeling fresh.'}
          </p>
        </Card>

        <button onClick={() => go('backup')} className="flex items-center justify-between rounded-3xl border border-line bg-surface px-5 py-4 text-left">
          <div>
            <div className="text-[15px] font-semibold">Backup and export</div>
            <div className="mt-0.5 text-sm text-muted">Your entries stay on this phone unless you save a copy.</div>
          </div>
          <Chevron dir="right" className="h-5 w-5 text-faint" />
        </button>

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
