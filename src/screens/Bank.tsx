import { AnimatePresence, motion } from 'framer-motion'
import { Card, TopBar } from '../components/ui'
import { formatLongDate, formatMonth, weekdayLetter } from '../lib/dates'
import { moodWeek, topThemes, totalGratitudes } from '../lib/stats'
import { computeStreak } from '../lib/streak'
import { MOODS, type Entry } from '../lib/types'
import { useStore } from '../store'
import { useUI } from '../ui'
import { MoodDot } from './Reflect'

export function Bank() {
  const entries = useStore((s) => s.entries)
  const today = useStore((s) => s.today())
  const go = useUI((s) => s.go)
  const openEntry = useUI((s) => s.openEntry)
  const setOpenEntry = useUI((s) => s.setOpenEntry)

  const list = Object.values(entries).sort((a, b) => b.date.localeCompare(a.date))
  const back = () => {
    setOpenEntry(null)
    go('home')
  }

  if (list.length === 0) {
    return (
      <div className="flex min-h-full flex-col">
        <TopBar onBack={back} title="Gratitude bank" />
        <div className="flex flex-1 items-center justify-center px-10 text-center text-[15px] leading-relaxed text-muted">
          Your first reflection will appear here. Over time this becomes a quiet record of what has been good.
        </div>
      </div>
    )
  }

  const months = groupByMonth(list)

  return (
    <div className="flex min-h-full flex-col">
      <TopBar onBack={back} title="Gratitude bank" />
      <div className="safe-bottom flex flex-col gap-4 px-5 pt-2">
        <Summary entries={entries} list={list} today={today} />
        {months.map(([month, items]) => (
          <section key={month} className="mt-2">
            <h3 className="mb-2 px-1 text-xs font-semibold tracking-wide text-faint uppercase">{month}</h3>
            <div className="flex flex-col gap-2">
              {items.map((e) => (
                <EntryRow key={e.date} entry={e} open={openEntry === e.date} onToggle={() => setOpenEntry(openEntry === e.date ? null : e.date)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function Summary({ entries, list, today }: { entries: Record<string, Entry>; list: Entry[]; today: string }) {
  const streak = computeStreak(entries, today)
  const week = moodWeek(entries, today)
  const themes = topThemes(list)
  const stats = [
    { value: totalGratitudes(list), label: 'good things saved' },
    { value: list.length, label: list.length === 1 ? 'night reflected' : 'nights reflected' },
    { value: streak.nights, label: 'night streak' },
  ]
  return (
    <Card>
      <div className="grid grid-cols-3 gap-2 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="font-serif text-[28px] font-light tabular-nums">{s.value}</div>
            <div className="text-xs leading-tight text-muted">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 border-t border-line pt-4">
        <div className="mb-2 text-xs text-muted">Your week</div>
        <div className="flex justify-between">
          {week.map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-1.5">
              <span className="flex h-6 items-center">
                {d.mood ? <MoodDot mood={d.mood} size="sm" /> : <span className="block h-1.5 w-1.5 rounded-full bg-surface-2" />}
              </span>
              <span className="text-[11px] text-faint">{weekdayLetter(d.date)}</span>
            </div>
          ))}
        </div>
      </div>
      {themes.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="mb-2 text-xs text-muted">What keeps coming up</div>
          <div className="flex flex-wrap gap-1.5">
            {themes.map((t) => (
              <span key={t.word} className="rounded-full bg-surface-2 px-3 py-1 text-sm">
                {t.word} <span className="text-faint">{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function EntryRow({ entry, open, onToggle }: { entry: Entry; open: boolean; onToggle: () => void }) {
  const mood = MOODS.find((m) => m.value === entry.mood)
  return (
    <div className="rounded-3xl border border-line bg-surface">
      <button onClick={onToggle} className="flex w-full items-start gap-3 px-5 py-4 text-left">
        <div className="flex-1">
          <div className="text-xs text-muted">{formatLongDate(entry.date)}</div>
          <div className="mt-1 font-serif text-[17px] leading-snug">
            {entry.gratitudes[0] ?? entry.moodNote ?? 'A quiet night'}
            {entry.gratitudes.length > 1 && !open && <span className="text-faint"> +{entry.gratitudes.length - 1}</span>}
          </div>
        </div>
        {entry.mood && <MoodDot mood={entry.mood} size="sm" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-col gap-4 px-5 pb-5 text-[15px] leading-relaxed">
              {entry.gratitudes.length > 1 && (
                <ul className="flex flex-col gap-1 font-serif text-[17px]">
                  {entry.gratitudes.slice(1).map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              )}
              {entry.promptAnswer && (
                <div>
                  <div className="text-xs text-muted">{entry.promptText}</div>
                  <div className="mt-1">{entry.promptAnswer}</div>
                </div>
              )}
              {(mood || entry.moodNote) && (
                <div>
                  <div className="text-xs text-muted">{mood ? `Felt ${mood.label.toLowerCase()}` : 'The day'}</div>
                  {entry.moodNote && <div className="mt-1">{entry.moodNote}</div>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function groupByMonth(list: Entry[]): [string, Entry[]][] {
  const groups = new Map<string, Entry[]>()
  for (const e of list) {
    const key = formatMonth(e.date)
    groups.set(key, [...(groups.get(key) ?? []), e])
  }
  return [...groups.entries()]
}
