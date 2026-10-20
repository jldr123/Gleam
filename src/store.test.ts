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

describe('after a heavy stretch', () => {
  const heavyWeek = () => {
    const today = s().today()
    useStore.setState({ entries: Object.fromEntries([1, 2, 4].map((i) => [addDays(today, -i), entry(addDays(today, -i), [], 1)])) })
  }

  it('offers the gentle card on a hard night and remembers it only locally', () => {
    heavyWeek()
    s().startReflection()
    s().setMood(2)
    expect(s().draft?.care).toBe('offer')
    expect(s().careShownOn).toBe(s().today())
    s().setMood(4)
    expect(s().draft?.care).toBe('none')
  })

  it('saves a quick check-in as mood and note only', () => {
    heavyWeek()
    s().startReflection()
    s().setGratitude(0, { text: 'Something' })
    s().setMood(1)
    s().updateDraft({ care: 'checkin', moodNote: 'Tired.', promptAnswer: 'x' })
    s().saveDraft()
    const saved = s().entries[s().today()]
    expect(saved).toMatchObject({ mood: 1, moodNote: 'Tired.', gratitudes: [], promptAnswer: '', promptId: 'checkin' })
    expect(JSON.stringify(saved)).not.toContain('care')
  })
})

describe('lighter nights', () => {
  it('keeps one gratitude on a normal night', () => {
    s().updateSettings({ light: true })
    s().startReflection()
    s().setMood(4)
    s().setGratitude(0, { text: 'Tea' })
    s().setGratitude(1, { text: 'Toast' })
    s().saveDraft()
    expect(s().entries[s().today()].gratitudes).toEqual([{ text: 'Tea', because: '' }])
  })
})

describe('monthly check answers', () => {
  it('are kept locally by date', () => {
    s().answerHelp('2026-10-20', 'sortOf')
    s().answerHelp('2026-10-20', 'yes')
    expect(s().helpChecks).toEqual([{ date: '2026-10-20', answer: 'sortOf' }])
  })
})
