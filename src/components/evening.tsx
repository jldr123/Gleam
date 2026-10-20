import { useState } from 'react'
import { reminderIcs } from '../lib/reminder'
import { toggleNight, WEEKDAYS } from '../lib/rhythm'
import type { Rhythm } from '../lib/types'
import { Button } from './ui'

const rhythms: { value: Rhythm['mode']; label: string }[] = [
  { value: 'nightly', label: 'Every night' },
  { value: 'some', label: 'A few nights a week' },
]

/** Every night, or a few chosen nights a week. */
export function RhythmPicker({ rhythm, onChange }: { rhythm: Rhythm; onChange: (rhythm: Rhythm) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1">
        {rhythms.map((r) => (
          <button
            key={r.value}
            onClick={() => onChange({ ...rhythm, mode: r.value })}
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
                onClick={() => onChange(toggleNight(rhythm, d.value))}
                aria-pressed={on}
                className={`h-10 flex-1 rounded-full text-xs transition ${on ? 'bg-accent font-semibold text-accent-ink' : 'bg-surface-2 text-muted'}`}
              >
                {d.short}
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

/** A native time picker, styled to match. */
export function TimeInput({ value, onChange, id }: { value: string; onChange: (time: string) => void; id?: string }) {
  return (
    <input
      id={id}
      type="time"
      value={value}
      onChange={(e) => e.target.value && onChange(e.target.value)}
      className="rounded-full bg-surface-2 px-4 py-2 text-[16px] text-ink tabular-nums outline-none"
    />
  )
}

/** The two steps to add Gleam to an iPhone home screen. */
export function InstallSteps() {
  return (
    <ol className="mt-3 flex flex-col gap-2 text-[15px] leading-snug">
      <li className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold">1</span>
        <span>
          Tap <ShareIcon /> <span className="font-semibold">Share</span> in Safari's toolbar.
        </span>
      </li>
      <li className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold">2</span>
        <span>
          Choose <span className="font-semibold">Add to Home Screen</span>.
        </span>
      </li>
    </ol>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="-mt-1 inline h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Downloads a calendar file with a repeating event at their reflection time.
 * On iPhone, opening it offers to add the event to Calendar.
 */
export function CalendarButton({ time, rhythm, className = '' }: { time: string; rhythm: Rhythm; className?: string }) {
  const [done, setDone] = useState(false)
  const add = () => {
    const ics = reminderIcs(time, rhythm, `${window.location.origin}/`)
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'gleam-reminder.ics'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setDone(true)
  }
  return (
    <div className={className}>
      <Button variant="quiet" className="w-full px-4 py-3 text-sm" onClick={add}>
        Add a daily reminder to my calendar
      </Button>
      <p className="mt-2 text-xs leading-relaxed text-faint">
        {done ? 'Open the downloaded file and choose Add to Calendar.' : 'A repeating calendar event at your time. Nothing is sent anywhere.'}
      </p>
    </div>
  )
}
