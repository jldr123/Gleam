import { motion } from 'framer-motion'
import { Button, Card, Chevron, Sparkle } from '../components/ui'
import { useNow } from '../hooks'
import { formatLongDate, greeting, isEvening } from '../lib/dates'
import { whyLineFor } from '../lib/prompts'
import { resurface } from '../lib/stats'
import { computeStreak } from '../lib/streak'
import { useStore } from '../store'
import { useUI } from '../ui'

export function Home() {
  const now = useNow()
  const today = useStore((s) => s.today())
  const entries = useStore((s) => s.entries)
  const draft = useStore((s) => s.draft)
  const name = useStore((s) => s.settings.name)
  const startReflection = useStore((s) => s.startReflection)
  const go = useUI((s) => s.go)
  const setOpenEntry = useUI((s) => s.setOpenEntry)

  const done = entries[today]
  const inProgress = draft?.date === today && !done
  const streak = computeStreak(entries, today)
  const memory = resurface(entries, today)
  const evening = isEvening(now)

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
        <Sparkle className="mb-6 h-10 w-10 text-accent" />
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
        ) : (
          <>
            <p className="mt-4 max-w-[19rem] text-[15px] leading-relaxed text-muted">
              {evening ? whyLineFor(today) : 'Come back this evening for a few quiet minutes on your day.'}
            </p>
            <Button className="mt-8 px-9" onClick={begin}>
              {inProgress ? 'Carry on reflecting' : 'Reflect on today'}
            </Button>
            <div className="mt-3 text-xs text-faint">About 3 minutes</div>
          </>
        )}
      </motion.div>

      <div className="safe-bottom flex flex-col gap-3 pb-2">
        {memory && (
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
                ? `${streak.nights} ${streak.nights === 1 ? 'night' : 'nights'} in a row${streak.restUsed ? ', with a rest night' : ''}`
                : 'Everything you save lives here'}
            </div>
          </div>
          <Chevron dir="right" className="h-5 w-5 text-faint" />
        </button>
      </div>
    </div>
  )
}
