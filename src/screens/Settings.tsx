import { useRef, useState } from 'react'
import { CalendarButton, RhythmPicker, TimeInput } from '../components/evening'
import { PlusBadge } from '../components/plus'
import { Button, Card, Chevron, Sparkle, TopBar } from '../components/ui'
import { SUPPORT_URL } from '../lib/flow'
import { FONTS, PALETTES } from '../lib/plus'
import { PACKS } from '../lib/prompts'
import type { PackId, Theme } from '../lib/types'
import { useStore } from '../store'
import { useUI } from '../ui'

const themes: { value: Theme; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Evening' },
]

const HOUR = 3_600_000
/** Taps on the version number that unlock the prototype tools. */
const UNLOCK_TAPS = 7

export function Settings() {
  const go = useUI((s) => s.go)
  const settings = useStore((s) => s.settings)
  const rhythm = settings.rhythm
  const updateSettings = useStore((s) => s.updateSettings)
  const devTools = useStore((s) => s.devTools)
  const setDevTools = useStore((s) => s.setDevTools)
  const reset = useStore((s) => s.reset)
  const plus = useStore((s) => s.plus)
  const [confirmReset, setConfirmReset] = useState(false)
  const taps = useRef(0)
  const showTools = import.meta.env.DEV || devTools

  const tapVersion = () => {
    taps.current += 1
    if (taps.current >= UNLOCK_TAPS) {
      taps.current = 0
      setDevTools(!devTools)
    }
  }

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
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted" htmlFor="time">
              Reflection time
            </label>
            <TimeInput id="time" value={settings.reminderTime} onChange={(reminderTime) => updateSettings({ reminderTime })} />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-faint">From half an hour before, Gleam's home screen gently lets you know it's time.</p>
          <CalendarButton time={settings.reminderTime} rhythm={rhythm} className="mt-4" />
        </Card>

        <Card>
          <div className="mb-3 text-xs text-muted">Rhythm</div>
          <RhythmPicker rhythm={rhythm} onChange={(r) => updateSettings({ rhythm: r })} />
          <p className="mt-3 text-xs leading-relaxed text-faint">
            {rhythm.mode === 'nightly'
              ? 'A few minutes every evening.'
              : 'Other nights are rest nights: no prompt, and they never break your streak. For some people, less often keeps it feeling fresh.'}
          </p>
          <label className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4">
            <span>
              <span className="block text-[15px]">Lighter nights</span>
              <span className="block text-xs text-faint">Just one good thing each night.</span>
            </span>
            <input
              type="checkbox"
              checked={settings.light}
              onChange={(e) => updateSettings({ light: e.target.checked })}
              className="h-5 w-5 accent-[var(--accent)]"
            />
          </label>
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
          <Looks />
        </Card>

        <PromptPacks />

        <button onClick={() => go('plus')} className="flex items-center justify-between rounded-3xl border border-line bg-surface px-5 py-4 text-left">
          <div>
            <div className="flex items-center gap-2 text-[15px] font-semibold">
              <Sparkle className="h-4 w-4 text-accent" />
              Gleam Plus
            </div>
            <div className="mt-0.5 text-sm text-muted">{plus ? 'Unlocked. Thank you.' : 'Stats, your year in review, themes and prompt packs.'}</div>
          </div>
          <Chevron dir="right" className="h-5 w-5 text-faint" />
        </button>

        <button onClick={() => go('backup')} className="flex items-center justify-between rounded-3xl border border-line bg-surface px-5 py-4 text-left">
          <div>
            <div className="text-[15px] font-semibold">Backup and export</div>
            <div className="mt-0.5 text-sm text-muted">Your entries stay on this phone unless you save a copy.</div>
          </div>
          <Chevron dir="right" className="h-5 w-5 text-faint" />
        </button>

        <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-3xl border border-line bg-surface px-5 py-4">
          <div>
            <div className="text-[15px] font-semibold">If things feel heavy</div>
            <div className="mt-0.5 text-sm text-muted">Free, confidential helplines near you, at findahelpline.com.</div>
          </div>
          <Chevron dir="right" className="h-5 w-5 text-faint" />
        </a>

        {showTools && <PrototypeTools />}

        <div className="flex flex-col items-center gap-1 pt-2 pb-2">
          <Button variant="ghost" className="text-sm" onClick={() => (confirmReset ? (reset(), setConfirmReset(false)) : setConfirmReset(true))}>
            {confirmReset ? 'Tap again to erase everything' : 'Erase all data'}
          </Button>
          <button onClick={tapVersion} className="px-4 py-2 text-xs text-faint select-none">
            Gleam {__APP_VERSION__}
          </button>
        </div>
      </div>
    </div>
  )
}

function PrototypeTools() {
  const offset = useStore((s) => s.clockOffsetMs)
  const setClockOffset = useStore((s) => s.setClockOffset)
  const seedDemo = useStore((s) => s.seedDemo)
  const seedHeavyWeek = useStore((s) => s.seedHeavyWeek)
  const setDevTools = useStore((s) => s.setDevTools)
  const plus = useStore((s) => s.plus)
  const setPlus = useStore((s) => s.setPlus)
  return (
    <Card>
      <div className="text-xs font-semibold tracking-wide text-faint uppercase">Prototype tools</div>
      <label className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted">Gleam Plus unlocked</span>
        <input type="checkbox" checked={plus} onChange={(e) => setPlus(e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
      </label>
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
        <Button variant="quiet" className="px-4 py-2 text-sm" onClick={seedHeavyWeek}>
          Add a heavy week
        </Button>
        <Button variant="ghost" className="px-4 py-2 text-sm" onClick={() => setDevTools(false)}>
          Hide tools
        </Button>
      </div>
    </Card>
  )
}

/** Plus palettes and heading fonts. Free users see them and are taken to Plus when they tap one. */
function Looks() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const plus = useStore((s) => s.plus)
  const go = useUI((s) => s.go)
  const palette = plus ? settings.palette : 'ember'
  const font = plus ? settings.font : 'fraunces'
  const choose = (patch: Partial<typeof settings>) => (plus ? updateSettings(patch) : go('plus'))
  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted">Palette</div>
        {!plus && <PlusBadge />}
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {PALETTES.map((p) => (
          <button key={p.id} onClick={() => choose({ palette: p.id })} className="flex flex-col items-center gap-1.5" aria-pressed={palette === p.id}>
            <span
              className={`relative flex h-11 w-11 items-center justify-center rounded-full border transition ${palette === p.id ? 'border-ink' : 'border-line'}`}
              style={{ background: `linear-gradient(135deg, ${p.day.bg} 50%, ${p.evening.bg} 50%)` }}
            >
              <span className="h-4 w-4 rounded-full" style={{ background: p.day.accent, boxShadow: `0 0 0 2px ${p.evening.accent}` }} />
            </span>
            <span className={`text-[11px] ${palette === p.id ? 'font-semibold text-ink' : 'text-muted'}`}>{p.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 text-xs text-muted">Heading font</div>
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1">
        {FONTS.map((f) => (
          <button
            key={f.id}
            onClick={() => choose({ font: f.id })}
            style={{ fontFamily: f.stack }}
            className={`rounded-full py-2 text-[15px] transition ${font === f.id ? 'bg-surface font-semibold text-ink shadow-sm' : 'text-muted'}`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function PromptPacks() {
  const packs = useStore((s) => s.settings.packs)
  const updateSettings = useStore((s) => s.updateSettings)
  const plus = useStore((s) => s.plus)
  const go = useUI((s) => s.go)
  const toggle = (id: PackId) => {
    if (!plus) return go('plus')
    updateSettings({ packs: packs.includes(id) ? packs.filter((p) => p !== id) : [...packs, id] })
  }
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted">Prompt packs</div>
        {!plus && <PlusBadge />}
      </div>
      <ul className="mt-1 flex flex-col divide-y divide-line">
        {PACKS.map((p) => (
          <li key={p.id}>
            <label className="flex items-center justify-between gap-4 py-3">
              <span>
                <span className="block text-[15px]">{p.label}</span>
                <span className="block text-xs text-faint">{p.text}</span>
              </span>
              <input
                type="checkbox"
                checked={plus && packs.includes(p.id)}
                onChange={() => toggle(p.id)}
                className="h-5 w-5 shrink-0 accent-[var(--accent)]"
              />
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs leading-relaxed text-faint">Questions from the packs you turn on come up first, mixed in with the usual ones.</p>
    </Card>
  )
}
