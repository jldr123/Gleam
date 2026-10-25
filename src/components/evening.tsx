import { useState } from 'react'
import { formatTime } from '../lib/reminder'
import { enableReminder, reminderKind, reminderMessage } from '../lib/reminders'
import { toggleNight, WEEKDAYS } from '../lib/rhythm'
import type { Rhythm } from '../lib/types'
import { useStore } from '../store'
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
                className={`h-10 flex-1 rounded-full text-xs transition ${on ? 'bg-button font-semibold text-button-ink' : 'bg-surface-2 text-muted'}`}
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

/**
 * Turns on the evening reminder at their reflection time, saying why first:
 * a calendar event on the web, notifications (after the iOS prompt) in the App Store build.
 */
export function ReminderButton({ className = '', variant = 'quiet' }: { className?: string; variant?: 'primary' | 'quiet' }) {
  const time = useStore((s) => s.settings.reminderTime)
  const rhythm = useStore((s) => s.settings.rhythm)
  const reminder = useStore((s) => s.settings.reminder)
  const updateSettings = useStore((s) => s.updateSettings)
  const [message, setMessage] = useState<string | null>(null)
  const turnOn = async () => {
    const outcome = await enableReminder(time, rhythm)
    if (outcome !== 'denied') updateSettings({ reminder: outcome === 'scheduled' ? 'notifications' : 'calendar' })
    setMessage(reminderMessage(outcome, time))
  }
  const calendar = reminderKind() === 'calendar'
  return (
    <div className={className}>
      <Button variant={variant} className="w-full px-4 py-3 text-[15px]" onClick={turnOn}>
        {reminder !== 'off' && !message ? `Update my reminder to ${formatTime(time)}` : `Remind me at ${formatTime(time)}`}
      </Button>
      <p role="status" className="mt-2 text-xs leading-relaxed text-faint">
        {message ??
          (calendar
            ? 'Adds a repeating event to your calendar. Nothing is sent anywhere.'
            : 'Your phone will ask if Gleam can send notifications. One a night, nothing else.')}
      </p>
    </div>
  )
}
