import { motion } from 'framer-motion'
import { InstallSteps } from '../components/evening'
import { Button, Card, Chevron, Sparkle } from '../components/ui'
import { useNow } from '../hooks'
import { needsBackupReminder } from '../lib/backup'
import { formatLongDate, greeting, isEvening } from '../lib/dates'
import { whyLineFor } from '../lib/prompts'
import { resurface } from '../lib/stats'
import { isReflectionTime, isStandalone } from '../lib/reminder'
import { isReflectionNight } from '../lib/rhythm'
import { computeStreak } from '../lib/streak'
import { useStore } from '../store'
import { useUI } from '../ui'

export function Home() {
  const now = useNow()
  const today = useStore((s) => s.today())
  const entries = useStore((s) => s.entries)
  const draft = useStore((s) => s.draft)
  const name = useStore((s) => s.settings.name)
  const rhythm = useStore((s) => s.settings.rhythm)
  const reminderTime = useStore((s) => s.settings.reminderTime)
  const backup = useStore((s) => s.backup)
  const installDismissed = useStore((s) => s.installDismissed)
  const dismissInstall = useStore((s) => s.dismissInstall)
  const dismissBackupReminder = useStore((s) => s.dismissBackupReminder)
  const startReflection = useStore((s) => s.startReflection)
  const go = useUI((s) => s.go)
  const setOpenEntry = useUI((s) => s.setOpenEntry)

  const done = entries[today]
  const inProgress = draft?.date === today && !done
  const streak = computeStreak(entries, today, rhythm)
  const restNight = !done && !inProgress && !isReflectionNight(today, rhythm)
  // One card at a time: installing matters most on iPhone, since Safari can clear a site's data.
  const suggestInstall = !installDismissed && !isStandalone()
  const remindBackup = !suggestInstall && needsBackupReminder(Object.keys(entries).length, backup, now.getTime())
  const memory = resurface(entries, today)
  const evening = isEvening(now)
  const reflectionTime = !done && !restNight && isReflectionTime(now, reminderTime)

  const begin = () => {
    startReflection()
    go('reflect')
  }

  return (
    <div className="glow flex min-h-full flex-col px-6">
      <div className="safe-top flex items-center justify-between pt-2">
        <div className="text-sm text-muted">{formatLongDate(today)}</div>
        <button onClick={() => go('settings')} className="-mr-2 px-2 py-2 text-sm text-muted" aria-label="Settings">
          Settings
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-1 flex-col items-center justify-center text-center"
      >
        <Sparkle className={`mb-6 h-10 w-10 text-accent ${reflectionTime ? 'animate-pulse [animation-duration:3s]' : ''}`} />
        {reflectionTime && <div className="mb-3 text-xs font-semibold tracking-wide text-accent uppercase">It's your reflection time</div>}
        <h1 className="font-serif text-[34px] leading-tight font-light">
          {greeting(now)}
          {name ? `, ${name}` : ''}.
        </h1>

        {done ? (
          <>
            <p className="mt-4 max-w-[19rem] text-[15px] leading-relaxed text-muted">
              Tonight's reflection is saved. Time to put the phone down and rest.
            </p>
            <div className="mt-8 flex flex-col items-center gap-2">
              <Button
                variant="quiet"
                onClick={() => {
                  setOpenEntry(today)
                  go('bank')
                }}
              >
                See tonight's entry
              </Button>
              <Button variant="ghost" onClick={begin}>
                Edit it
              </Button>
            </div>
          </>
        ) : restNight ? (
          <>
            <p className="mt-4 max-w-[19rem] text-[15px] leading-relaxed text-muted">
              Tonight is a rest night. Nothing to do but wind down and let the day be what it was.
            </p>
            <Button variant="ghost" className="mt-8" onClick={begin}>
              Reflect anyway
            </Button>
          </>
        ) : (
          <>
            <p className="mt-4 max-w-[19rem] text-[15px] leading-relaxed text-muted">
              {reflectionTime
                ? 'A few quiet minutes on your day, then rest.'
                : evening
                  ? whyLineFor(today)
                  : 'Come back this evening for a few quiet minutes on your day.'}
            </p>
            <Button className="mt-8 px-9" onClick={begin}>
              {inProgress ? 'Carry on reflecting' : 'Reflect on today'}
            </Button>
            <div className="mt-3 text-xs text-faint">About 3 minutes</div>
          </>
        )}
      </motion.div>

      <div className="safe-bottom flex flex-col gap-3 pb-2">
        {suggestInstall && (
          <Card className="text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="text-[15px] font-semibold">Keep Gleam on your Home Screen</div>
              <button onClick={dismissInstall} className="-mt-1 -mr-2 shrink-0 px-2 py-1 text-sm whitespace-nowrap text-faint" aria-label="Dismiss">
                Not now
              </button>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted">It keeps your reflections safer on iPhone and gets Gleam ready for reminders.</p>
            <InstallSteps />
          </Card>
        )}
        {remindBackup && (
          <Card className="text-left">
            <div className="text-[15px] font-semibold">{Object.keys(entries).length} evenings saved</div>
            <p className="mt-1 text-sm leading-relaxed text-muted">They only live on this phone. Keep a copy somewhere safe?</p>
            <div className="mt-3 flex gap-2">
              <Button variant="quiet" className="px-4 py-2 text-sm" onClick={() => go('backup')}>
                Back up now
              </Button>
              <Button variant="ghost" className="px-3 py-2 text-sm" onClick={dismissBackupReminder}>
                Not now
              </Button>
            </div>
          </Card>
        )}
        {!remindBackup && !suggestInstall && memory && (
          <Card className="text-left">
            <div className="text-xs text-faint">{memory.lead}</div>
            <div className="mt-1.5 font-serif text-lg leading-snug">{memory.gratitude.text}</div>
            {memory.gratitude.because && <div className="mt-1 text-sm text-muted italic">because {memory.gratitude.because}</div>}
          </Card>
        )}
        <button onClick={() => go('bank')} className="flex items-center justify-between rounded-3xl border border-line bg-surface px-5 py-4 text-left">
          <div>
            <div className="text-[15px] font-semibold">Your gratitude bank</div>
            <div className="mt-0.5 text-sm text-muted">
              {streak.nights > 0
                ? `${streak.nights} ${streak.nights === 1 ? 'night' : 'nights'} ${rhythm.mode === 'some' ? 'on your rhythm' : 'in a row'}${streak.restUsed ? ', with a night off' : ''}`
                : 'Everything you save lives here'}
            </div>
          </div>
          <Chevron dir="right" className="h-5 w-5 text-faint" />
        </button>
      </div>
    </div>
  )
}
