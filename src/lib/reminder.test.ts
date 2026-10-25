import { formatTime, isReflectionTime, reminderIcs } from './reminder'
import { reminderMessage } from './reminders'

const at = (h: number, m = 0) => new Date(2026, 9, 20, h, m)

describe('reflection time', () => {
  it('opens half an hour before and lasts until the day rolls over', () => {
    expect(isReflectionTime(at(20, 59), '21:30')).toBe(false)
    expect(isReflectionTime(at(21, 0), '21:30')).toBe(true)
    expect(isReflectionTime(at(23, 45), '21:30')).toBe(true)
    expect(isReflectionTime(at(2, 0), '21:30')).toBe(true)
    expect(isReflectionTime(at(4, 0), '21:30')).toBe(false)
    expect(isReflectionTime(at(12, 0), '21:30')).toBe(false)
  })

  it('handles a time after midnight', () => {
    expect(isReflectionTime(at(23, 0), '00:15')).toBe(false)
    expect(isReflectionTime(at(23, 50), '00:15')).toBe(true)
    expect(isReflectionTime(at(1, 0), '00:15')).toBe(true)
  })

  it('formats times', () => {
    expect(formatTime('21:30')).toBe('9:30pm')
    expect(formatTime('00:05')).toBe('12:05am')
    expect(formatTime('12:00')).toBe('12:00pm')
  })
})

describe('calendar reminder', () => {
  const now = new Date(Date.UTC(2026, 9, 20, 12, 0, 0))

  it('repeats daily at their time, linking back to Gleam', () => {
    const ics = reminderIcs('21:30', { mode: 'nightly', nights: [0, 3] }, 'https://gleam.example/', now)
    const lines = ics.split('\r\n')
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(lines).toContain('RRULE:FREQ=DAILY')
    expect(lines).toContain('URL:https://gleam.example/')
    expect(lines).toContain('TRIGGER:PT0M')
    expect(lines.find((l) => l.startsWith('DTSTART:'))).toMatch(/^DTSTART:\d{8}T213000$/)
    expect(lines.find((l) => l.startsWith('DTSTAMP:'))).toBe('DTSTAMP:20261020T120000Z')
    expect(lines.find((l) => l.startsWith('DESCRIPTION:A minute'))).toContain('Open Gleam: https://gleam.example/')
    expect(lines.at(-2)).toBe('END:VCALENDAR')
    expect(ics).not.toMatch(/[^\r]\n/)
  })

  it('only repeats on chosen nights, starting on the first one', () => {
    // 20 October 2026 is a Tuesday; the next chosen night is Wednesday the 21st.
    const ics = reminderIcs('21:30', { mode: 'some', nights: [3, 0] }, 'https://gleam.example/', now)
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=SU,WE')
    expect(ics).toContain('DTSTART:20261021T213000')
  })

  it('escapes commas and semicolons in text', () => {
    expect(reminderIcs('21:30', { mode: 'nightly', nights: [] }, 'https://a.b/?x=1;y=2', now)).toContain('Open Gleam: https://a.b/?x=1\\;y=2')
  })
})

describe('reminder messages', () => {
  it('says what happened, at their time', () => {
    expect(reminderMessage('scheduled', '21:30')).toBe('Done. Gleam will remind you at 9:30pm.')
    expect(reminderMessage('calendar', '22:00')).toContain('10:00pm')
    expect(reminderMessage('denied', '21:30')).toContain('later in Settings')
  })
})
