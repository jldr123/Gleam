import { AnimatePresence, motion } from 'framer-motion'
import { PlusBadge } from '../components/plus'
import { Card, Chevron, Star, TopBar } from '../components/ui'
import { formatLongDate, formatMonth, weekdayLetter } from '../lib/dates'
import { finishedMonths, monthKey, type MonthSummary } from '../lib/months'
import { moodWeek, thanksSent, topThemes, totalGratitudes } from '../lib/stats'
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
  const goBack = useUI((s) => s.back)
  const back = () => {
    setOpenEntry(null)
    goBack()
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
  const summaries = new Map(finishedMonths(list, today).map((m) => [m.month, m]))

  return (
    <div className="flex min-h-full flex-col">
      <TopBar onBack={back} title="Gratitude bank" />
      <div className="safe-bottom flex flex-col gap-4 px-5 pt-2">
        <Summary entries={entries} list={list} today={today} />
        <div className="grid grid-cols-2 gap-2">
          <MoreLink title="All your stats" onClick={() => go('stats')} />
          <MoreLink title="Your year in Gleam" onClick={() => go('year')} />
        </div>
        {months.map(([month, items]) => (
          <section key={month} className="mt-2">
            <h3 className="mb-2 px-1 text-xs font-semibold tracking-wide text-faint uppercase">{formatMonth(`${month}-01`)}</h3>
            <div className="flex flex-col gap-2">
              {summaries.has(month) && <MonthLookBack summary={summaries.get(month)!} />}
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
  const rhythm = useStore((s) => s.settings.rhythm)
  const streak = computeStreak(entries, today, rhythm)
  const week = moodWeek(entries, today)
  const themes = topThemes(list)
  const thanks = thanksSent(list)
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
      {thanks > 0 && (
        <div className="mt-4 border-t border-line pt-4 text-sm text-muted">
          You've said thank you {thanks === 1 ? 'once' : `${thanks} times`}.
        </div>
      )}
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

function MoreLink({ title, onClick }: { title: string; onClick: () => void }) {
  const plus = useStore((s) => s.plus)
  return (
    <button onClick={onClick} className="flex min-h-[4.5rem] flex-col justify-between rounded-3xl border border-line bg-surface px-4 py-3 text-left">
      <span className="flex w-full items-start justify-between gap-2">
        <span className="text-[15px] leading-snug font-semibold">{title}</span>
        <Chevron dir="right" className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
      </span>
      {!plus && <PlusBadge className="mt-2 self-start" />}
    </button>
  )
}

function EntryRow({ entry, open, onToggle }: { entry: Entry; open: boolean; onToggle: () => void }) {
  const mood = MOODS.find((m) => m.value === entry.mood)
  const [first, ...rest] = entry.gratitudes
  return (
    <div className="rounded-3xl border border-line bg-surface">
      <button onClick={onToggle} className="flex w-full items-start gap-3 px-5 py-4 text-left">
        <div className="flex-1">
          <div className="text-xs text-muted">{formatLongDate(entry.date)}</div>
          <div className="mt-1 font-serif text-[17px] leading-snug">
            {first?.text || (entry.letter && `A letter to ${entry.letter.to}`) || entry.moodNote || entry.promptAnswer || 'A quiet night'}
            {rest.length > 0 && !open && <span className="text-faint"> +{rest.length}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          {entry.starred && <Star className="h-4 w-4 text-accent" />}
          {entry.mood && <MoodDot mood={entry.mood} size="sm" />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-col gap-4 px-5 pb-5 text-[15px] leading-relaxed">
              {first?.because && <div className="text-muted italic">because {first.because}</div>}
              {rest.map((g, i) => (
                <div key={i}>
                  <div className="font-serif text-[17px]">{g.text}</div>
                  {g.because && <div className="text-muted italic">because {g.because}</div>}
                </div>
              ))}
              {entry.promptAnswer && (
                <div>
                  <div className="text-xs text-muted">{entry.promptText}</div>
                  <div className="mt-1">{entry.promptAnswer}</div>
                </div>
              )}
              {entry.letter && (
                <div className="rounded-2xl bg-surface-2 px-4 py-3">
                  <div className="text-xs text-muted">
                    A letter to {entry.letter.to}
                    {entry.letter.sent ? ', sent' : ', kept'}
                  </div>
                  <div className="mt-1 font-serif text-[16px] whitespace-pre-line">{entry.letter.text}</div>
                </div>
              )}
              {entry.weekPick && <div className="text-xs text-muted">Looked back on the week and kept {entry.weekPick === entry.date ? 'tonight' : formatLongDate(entry.weekPick)}.</div>}
              {entry.thanks.length > 0 && <div className="text-xs text-muted">Said thank you to {[...new Set(entry.thanks.map((t) => t.name))].join(' and ')}.</div>}
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

function MonthLookBack({ summary }: { summary: MonthSummary }) {
  const name = formatMonth(`${summary.month}-01`).split(' ')[0]
  const parts = [
    summary.people.length > 0 && { label: 'People who came up', value: summary.people.map((p) => p.name).join(', ') },
    summary.things.length > 0 && { label: 'And things', value: summary.things.map((t) => t.word).join(', ') },
  ].filter(Boolean) as { label: string; value: string }[]
  return (
    <div className="rounded-3xl border border-line bg-surface-2/60 px-5 py-4">
      <div className="font-serif text-[19px] leading-snug">
        {name}, looking back
      </div>
      <div className="mt-1 text-sm text-muted">
        {summary.evenings} {summary.evenings === 1 ? 'evening' : 'evenings'} reflected
        {summary.letters > 0 ? `, ${summary.letters === 1 ? 'one letter' : `${summary.letters} letters`} written` : ''}
      </div>
      {parts.map((p) => (
        <div key={p.label} className="mt-3">
          <div className="text-xs text-faint">{p.label}</div>
          <div className="mt-0.5 text-[15px]">{p.value}</div>
        </div>
      ))}
      {summary.starred.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-faint">Moments you kept</div>
          <ul className="mt-1 flex flex-col gap-1">
            {summary.starred.map((e) => (
              <li key={e.date} className="flex items-start gap-2 font-serif text-[16px] leading-snug">
                <Star className="mt-1 h-3.5 w-3.5 shrink-0 text-accent" />
                {e.gratitudes[0]?.text || e.promptAnswer || e.moodNote}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function groupByMonth(list: Entry[]): [string, Entry[]][] {
  const groups = new Map<string, Entry[]>()
  for (const e of list) {
    const key = monthKey(e.date)
    groups.set(key, [...(groups.get(key) ?? []), e])
  }
  return [...groups.entries()]
}
