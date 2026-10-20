import { migrate } from './migrate'

const v1 = {
  entries: {
    '2026-10-18': {
      date: '2026-10-18',
      gratitudes: ['Morning coffee', 'Sam made dinner', ''],
      promptId: 'easier',
      promptText: 'Who made today a little easier?',
      promptAnswer: 'Priya',
      mood: 4,
      moodNote: 'Good day.',
      createdAt: 1,
      updatedAt: 2,
    },
    '2026-10-17': {
      date: '2026-10-17',
      gratitudes: [],
      promptId: 'retired-prompt',
      promptText: 'An old question',
      promptAnswer: '',
      mood: null,
      moodNote: '',
      createdAt: 1,
      updatedAt: 1,
    },
  },
  draft: { date: '2026-10-19', step: 3, gratitudes: ['half'], promptId: 'x', promptText: 'x', promptAnswer: '', mood: null, moodNote: '' },
  settings: { name: 'Joe', theme: 'dark' },
  clockOffsetMs: 0,
}

describe('migrate from version 1', () => {
  const out = migrate(v1, 1)

  it('keeps every entry and its words', () => {
    const e = out.entries['2026-10-18']
    expect(Object.keys(out.entries)).toHaveLength(2)
    expect(e.gratitudes).toEqual([
      { text: 'Morning coffee', because: '' },
      { text: 'Sam made dinner', because: '' },
    ])
    expect(e).toMatchObject({ promptAnswer: 'Priya', mood: 4, moodNote: 'Good day.', createdAt: 1, updatedAt: 2 })
  })

  it('fills the new fields', () => {
    expect(out.entries['2026-10-18']).toMatchObject({ lens: 'people', weekPick: null, starred: false, thanks: [] })
    expect(out.entries['2026-10-17'].lens).toBeNull()
  })

  it('keeps settings and drops the old draft', () => {
    expect(out.settings).toEqual({ name: 'Joe', theme: 'dark' })
    expect(out.draft).toBeNull()
  })

  it('copes with empty storage', () => {
    expect(migrate(undefined, 0).entries).toEqual({})
  })
})
