import { AnimatePresence, motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { ReminderButton, RhythmPicker, TimeInput } from '../components/evening'
import { Button, Card, Sparkle } from '../components/ui'
import { formatTime } from '../lib/reminder'
import { useStore } from '../store'

type Page = 'why' | 'privacy' | 'evening' | 'reminder'

/** A short first run, shown once: why it works, privacy, their evening and a reminder. Skippable at every step. */
export function Welcome() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const finish = useStore((s) => s.finishOnboarding)
  const pages: Page[] = ['why', 'privacy', 'evening', 'reminder']
  const [at, setAt] = useState(0)
  const page = pages[at]
  const next = () => (at < pages.length - 1 ? setAt(at + 1) : finish())

  return (
    <div className="glow flex min-h-full flex-col px-6">
      <div className="safe-top flex items-center justify-between pt-2">
        <div className="flex gap-1.5" aria-label={`Step ${at + 1} of ${pages.length}`}>
          {pages.map((p, i) => (
            <div key={p} className={`h-1 rounded-full transition-all duration-500 ${i <= at ? 'w-6 bg-accent' : 'w-3 bg-surface-2'}`} />
          ))}
        </div>
        <button onClick={finish} className="-mr-2 px-2 py-2 text-sm text-muted">
          Skip
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="flex flex-1 flex-col"
        >
          {page === 'why' && (
            <Centered>
              <Sparkle className="mb-6 h-12 w-12 text-accent" />
              <h1 className="font-serif text-[32px] leading-tight font-light">A few minutes noticing what went well, before you sleep.</h1>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                A couple of good things, one gentle question and how today felt. Never forced, and hard days count too.
              </p>
            </Centered>
          )}
          {page === 'privacy' && (
            <Centered>
              <LockIcon />
              <h1 className="font-serif text-[32px] leading-tight font-light">Everything stays on this phone.</h1>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">No account, nothing uploaded. You can save your own backup whenever you like.</p>
            </Centered>
          )}
          {page === 'evening' && (
            <div className="flex flex-col gap-4 pt-10">
              <h1 className="font-serif text-[28px] leading-tight font-light">Your evening</h1>
              <Card>
                <div className="mb-3 text-sm text-muted">How often?</div>
                <RhythmPicker rhythm={settings.rhythm} onChange={(rhythm) => updateSettings({ rhythm })} />
              </Card>
              <Card>
                <label className="text-sm text-muted" htmlFor="welcome-name">
                  Your first name
                </label>
                <input
                  id="welcome-name"
                  value={settings.name}
                  onChange={(e) => updateSettings({ name: e.target.value.slice(0, 30) })}
                  placeholder="Optional"
                  className="mt-1 w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-faint"
                />
              </Card>
            </div>
          )}
          {page === 'reminder' && (
            <div className="flex flex-col gap-4 pt-10">
              <h1 className="font-serif text-[28px] leading-tight font-light">Set your evening reminder</h1>
              <Card>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted" htmlFor="welcome-time">
                    When do you usually wind down?
                  </label>
                  <TimeInput id="welcome-time" value={settings.reminderTime} onChange={(reminderTime) => updateSettings({ reminderTime })} />
                </div>
              </Card>
              <p className="text-[15px] leading-relaxed text-muted">
                A gentle nudge is what keeps the habit going, so Gleam can remind you at {formatTime(settings.reminderTime)}. Just one a night, and
                never a guilt trip.
              </p>
              <ReminderButton variant="primary" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="safe-bottom pt-8 pb-2">
        <Button className="w-full" variant={page === 'reminder' ? 'quiet' : 'primary'} onClick={next}>
          {at === pages.length - 1 ? 'Start' : 'Next'}
        </Button>
      </div>
    </div>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center text-center">{children}</div>
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mb-6 h-11 w-11 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="10" rx="3" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" strokeLinecap="round" />
    </svg>
  )
}
