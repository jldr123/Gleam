import { formatTime, reminderIcs } from './reminder'
import type { Rhythm } from './types'

/**
 * Turning the evening reminder on. The web prototype can only offer a
 * calendar event; the App Store build swaps in a provider that asks iOS for
 * permission and schedules local notifications.
 */

export type ReminderOutcome =
  /** Notifications are scheduled on the phone. */
  | 'scheduled'
  /** A calendar file was handed over; the person still adds it. */
  | 'calendar'
  /** The person said no to notifications. */
  | 'denied'

export interface ReminderProvider {
  /** "notifications" asks the system for permission first, so the screen can explain why before it does. */
  kind: 'notifications' | 'calendar'
  enable: (time: string, rhythm: Rhythm) => Promise<ReminderOutcome>
}

/** Downloads a repeating calendar event at their reflection time. On iPhone, opening it offers to add it to Calendar. */
export const calendarProvider: ReminderProvider = {
  kind: 'calendar',
  enable: async (time, rhythm) => {
    const ics = reminderIcs(time, rhythm, `${window.location.origin}/`)
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'gleam-reminder.ics'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return 'calendar'
  },
}

let provider: ReminderProvider = calendarProvider

/** The native build calls this at start-up with its notifications provider. */
export function setReminderProvider(next: ReminderProvider): void {
  provider = next
}

export const reminderKind = () => provider.kind
export const enableReminder = (time: string, rhythm: Rhythm) => provider.enable(time, rhythm)

/** What to say once they've tapped, in their own time. */
export function reminderMessage(outcome: ReminderOutcome, time: string): string {
  const at = formatTime(time)
  if (outcome === 'scheduled') return `Done. Gleam will remind you at ${at}.`
  if (outcome === 'denied') return 'No reminders for now. You can turn them on later in Settings.'
  return `Open the downloaded file and choose Add to Calendar. It will remind you at ${at}.`
}
