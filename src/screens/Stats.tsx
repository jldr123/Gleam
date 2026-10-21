import { useState } from 'react'
import { PlusGate } from '../components/plus'
import { Card, TopBar } from '../components/ui'
import { insights, inRange, longestRun, RANGES, type Insights, type Range, type WeekdayMood } from '../lib/insights'
import { MOODS } from '../lib/types'
import { useStore } from '../store'
import { useUI } from '../ui'

/** Fewer nights than this and patterns would be guesses. */
const MIN_NIGHTS = 3

export function Stats() {
  const entries = useStore((s) => s.entries)
  const today = useStore((s) => s.today())
  const rhythm = useStore((s) => s.settings.rhythm)
  const go = useUI((s) => s.go)
  const prev = useUI((s) => s.prev)
  const [range, setRange] = useState<Range>(30)

  const list = inRange(entries, today, range)
  const data = insights(list)
  const longest = longestRun(entries, today, rhythm)

  return (
    <div className="flex min-h-full flex-col">
      <TopBar onBack={() => go(prev === 'stats' || prev === 'plus' ? 'bank' : prev)} title="Your stats" />
      <div className="safe-bottom flex flex-col gap-4 px-5 pt-2">
        <div className="grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1" role="tablist">
          {RANGES.map((r) => (
            <button
              key={r.value}
              role="tab"
              aria-selected={range === r.value}
              onClick={() => setRange(r.value)}
              className={`rounded-full py-2 text-sm transition ${range === r.value ? 'bg-surface font-semibold text-ink shadow-sm' : 'text-muted'}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <Card>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { value: data.nights, label: data.nights === 1 ? 'night reflected' : 'nights reflected' },
              { value: data.gratitudes, label: 'good things saved' },
              { value: longest, label: 'longest streak' },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-serif text-[28px] font-light tabular-nums">{s.value}</div>
                <div className="text-xs leading-tight text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {data.nights < MIN_NIGHTS ? (
          <p className="px-4 py-6 text-center text-[15px] leading-relaxed text-muted">
            A few more evenings and your patterns will start to show here.
          </p>
        ) : (
          <PlusGate title="See your patterns" text="Plus shows how your evenings feel through the week, and who and what keeps coming up.">
            <Details data={data} />
          </PlusGate>
        )}
      </div>
    </div>
  )
}

function Details({ data }: { data: Insights }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="text-[15px] font-semibold">How your evenings felt</div>
        <MoodBars counts={data.moods} />
      </Card>

      <Card>
        <div className="text-[15px] font-semibold">Through the week</div>
        <WeekBars days={data.weekdays} brightest={data.brightest} />
      </Card>

      {data.people.length > 0 && (
        <Card>
          <div className="text-[15px] font-semibold">People who keep coming up</div>
          <ul className="mt-3 flex flex-col divide-y divide-line">
            {data.people.map((p) => (
              <li key={p.name} className="flex items-baseline justify-between py-2">
                <span className="font-serif text-[17px]">{p.name}</span>
                <span className="text-sm text-muted tabular-nums">{p.count} evenings</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {data.things.length > 0 && (
        <Card>
          <div className="text-[15px] font-semibold">What keeps coming up</div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.things.map((t) => (
              <span key={t.word} className="rounded-full bg-surface-2 px-3 py-1 text-sm">
                {t.word} <span className="text-faint">{t.count}</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      {data.lenses.length > 0 && (
        <Card>
          <div className="text-[15px] font-semibold">Questions you answer most</div>
          <ul className="mt-3 flex flex-col gap-1.5 text-[15px]">
            {data.lenses.map((l) => (
              <li key={l.lens} className="flex justify-between">
                <span>{l.label}</span>
                <span className="text-sm text-muted tabular-nums">{l.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="text-sm leading-relaxed text-muted">
        <p>
          You said why something mattered {times(data.withReasons)}
          {data.thanks > 0 ? `, and said thank you ${times(data.thanks)}` : ''}.
        </p>
        {data.letters > 0 && <p className="mt-1">You wrote {data.letters === 1 ? 'one thank-you letter' : `${data.letters} thank-you letters`}.</p>}
      </Card>
    </div>
  )
}

const times = (n: number) => (n === 1 ? 'once' : `${n} times`)

function MoodBars({ counts }: { counts: number[] }) {
  const max = Math.max(1, ...counts)
  // Bright at the top, the way the mood picker reads.
  const rows = MOODS.map((m) => ({ ...m, count: counts[m.value - 1] })).reverse()
  return (
    <ul className="mt-3 flex flex-col gap-2" aria-label="Nights by mood">
      {rows.map((r) => (
        <li key={r.value} className="flex items-center gap-3 text-sm">
          <span className="w-14 shrink-0 text-muted">{r.label}</span>
          <span className="relative h-3 flex-1 rounded-full bg-surface-2">
            {r.count > 0 && (
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-accent"
                style={{ width: `${Math.max(4, (r.count / max) * 100)}%`, opacity: 0.45 + r.value * 0.11 }}
              />
            )}
          </span>
          <span className="w-6 shrink-0 text-right text-muted tabular-nums">{r.count}</span>
        </li>
      ))}
    </ul>
  )
}

function WeekBars({ days, brightest }: { days: WeekdayMood[]; brightest: WeekdayMood | null }) {
  const [picked, setPicked] = useState<number | null>(null)
  const shown = days.find((d) => d.day === picked) ?? null
  return (
    <>
      <div className="mt-4 flex h-28 items-end justify-between gap-2" role="list" aria-label="Average mood by weekday">
        {days.map((d) => {
          const height = d.average === null ? 0 : ((d.average - 1) / 4) * 82 + 18
          const active = picked === null ? d.day === brightest?.day : d.day === picked
          return (
            <button
              key={d.day}
              role="listitem"
              onClick={() => setPicked(picked === d.day ? null : d.day)}
              aria-label={d.average === null ? `${d.name}: no nights yet` : `${d.name}: average ${moodWord(d.average)}, ${d.count} nights`}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span className="flex w-full flex-1 items-end justify-center">
                {d.average === null ? (
                  <span className="block h-1.5 w-1.5 rounded-full bg-surface-2" />
                ) : (
                  <span
                    className={`block w-full max-w-7 rounded-t-[4px] bg-accent transition ${active ? '' : 'opacity-40'}`}
                    style={{ height: `${height}%` }}
                  />
                )}
              </span>
              <span className={`text-[11px] ${active ? 'font-semibold text-ink' : 'text-faint'}`}>{d.name.slice(0, 1)}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {shown
          ? shown.average === null
            ? `No ${shown.name} evenings yet.`
            : `${shown.name}s average ${moodWord(shown.average)}, over ${shown.count} ${shown.count === 1 ? 'night' : 'nights'}.`
          : brightest
            ? `Your evenings tend to feel lightest on ${brightest.name}s.`
            : 'Taller bars are lighter evenings. Tap a day to see it.'}
      </p>
    </>
  )
}

/** "Good", "between Steady and Good" and so on, rather than a decimal. */
function moodWord(average: number): string {
  const rounded = Math.round(average * 2) / 2
  const label = (v: number) => MOODS[v - 1].label.toLowerCase()
  return Number.isInteger(rounded) ? label(rounded) : `between ${label(Math.floor(rounded))} and ${label(Math.ceil(rounded))}`
}
