import { addDays } from './lib/dates'
import { useStore } from './store'
import { entry } from './test/fixtures'

const s = () => useStore.getState()

beforeEach(() => s().reset())

describe('saving a reflection', () => {
  it('drops gratitude slots a low day did not offer', () => {
    s().startReflection()
    s().setGratitude(0, { text: 'Tea', because: 'it was warm' })
    s().setGratitude(1, { text: 'Left over from a good mood' })
    s().setMood(2)
    s().saveDraft()
    const saved = s().entries[s().today()]
    expect(saved.gratitudes).toEqual([{ text: 'Tea', because: 'it was warm' }])
    expect(['hardDay', 'selfCredit']).toContain(saved.lens)
  })

  it('saves no gratitudes on a very low night', () => {
    s().startReflection()
    s().setMood(1)
    s().setGratitude(0, { text: 'Something' })
    s().saveDraft()
    const saved = s().entries[s().today()]
    expect(saved.gratitudes).toEqual([])
    expect(saved.promptId).toBe('letgo')
  })

  it('records a thank-you privately on the entry', () => {
    s().startReflection()
    s().setMood(4)
    s().setGratitude(0, { text: 'Sam made dinner' })
    s().recordThanks('Sam')
    s().saveDraft()
    expect(s().entries[s().today()].thanks.map((t) => t.name)).toEqual(['Sam'])
  })

  it('stars the moment kept in a Sunday look-back, and moves the star if changed', () => {
    // Move the clock to the coming Sunday evening.
    const now = new Date()
    const toSunday = ((7 - now.getDay()) % 7) * 86_400_000
    s().setClockOffset(toSunday + (now.getHours() < 4 ? -86_400_000 : 0))
    const sunday = s().today()
    const tue = addDays(sunday, -5)
    const thu = addDays(sunday, -3)
    useStore.setState({ entries: { [tue]: entry(tue), [thu]: entry(thu) } })

    s().startReflection()
    s().setMood(4)
    s().updateDraft({ weekPick: tue })
    s().saveDraft()
    expect(s().entries[tue].starred).toBe(true)
    expect(s().entries[sunday]).toMatchObject({ weekPick: tue, promptId: 'lookback', lens: null })

    s().startReflection()
    s().updateDraft({ weekPick: thu })
    s().saveDraft()
    expect(s().entries[tue].starred).toBe(false)
    expect(s().entries[thu].starred).toBe(true)
  })
})
