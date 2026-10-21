import { entry } from '../test/fixtures'
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
    expect(out.settings).toEqual({ name: 'Joe', theme: 'dark', rhythm: { mode: 'nightly', nights: [0, 3] }, reminderTime: '21:30', reminder: 'off', light: false, palette: 'ember', font: 'fraunces', packs: [] })
    expect(out.draft).toBeNull()
  })

  it('adds letters and backup state', () => {
    expect(out.entries['2026-10-18']).toMatchObject({ letter: null, letterOffered: false })
    expect(out.backup).toEqual({ lastExportAt: null, entriesAtExport: 0, dismissedAtCount: 0 })
  })

  it('copes with empty storage', () => {
    expect(migrate(undefined, 0).entries).toEqual({})
  })

  it('skips the first-run screens for people who already reflected', () => {
    expect(out.onboarded).toBe(true)
    expect(migrate({ entries: {} }, 3).onboarded).toBe(false)
  })
})

describe('migrate from version 2', () => {
  const v2entry = {
    date: '2026-10-19',
    mood: 2,
    gratitudes: [{ text: 'Tea', because: 'it was warm' }],
    lens: 'hardDay',
    promptId: 'hard',
    promptText: 'What was hard today, and what got you through it?',
    promptAnswer: 'Work',
    moodNote: '',
    weekPick: null,
    starred: true,
    thanks: [{ name: 'Sam', at: 5 }],
    createdAt: 1,
    updatedAt: 2,
  }
  const out = migrate({ entries: { '2026-10-19': v2entry }, settings: { name: '', theme: 'auto' }, clockOffsetMs: 0 }, 2)

  it('keeps everything and adds the new fields', () => {
    expect(out.entries['2026-10-19']).toEqual({ ...v2entry, letter: null, letterOffered: false })
    expect(out.settings.rhythm).toEqual({ mode: 'nightly', nights: [0, 3] })
  })

  it('keeps a stored rhythm', () => {
    const v3 = migrate({ entries: {}, settings: { rhythm: { mode: 'some', nights: [2] } } }, 3)
    expect(v3.settings.rhythm).toEqual({ mode: 'some', nights: [2] })
  })
})

describe('migrate from version 3', () => {
  const v3 = { entries: { '2026-10-19': entry('2026-10-19') }, settings: { name: 'Joe', theme: 'auto', rhythm: { mode: 'some', nights: [1] } }, backup: { lastExportAt: 5, entriesAtExport: 1, dismissedAtCount: 0 } }
  const out = migrate(v3, 3)

  it('keeps entries, settings and backup state', () => {
    expect(out.entries['2026-10-19']).toEqual(v3.entries['2026-10-19'])
    expect(out.settings).toEqual({ name: 'Joe', theme: 'auto', rhythm: { mode: 'some', nights: [1] }, reminderTime: '21:30', reminder: 'off', light: false, palette: 'ember', font: 'fraunces', packs: [] })
    expect(out.backup.lastExportAt).toBe(5)
  })

  it('adds the new local-only state', () => {
    expect(out).toMatchObject({ onboarded: true, careShownOn: null, helpChecks: [], helpAskedOn: null, devTools: false })
  })

  it('keeps a stored reflection time', () => {
    expect(migrate({ entries: {}, settings: { reminderTime: '22:15' }, onboarded: true }, 4).settings.reminderTime).toBe('22:15')
  })
})

describe('migrate from version 4', () => {
  const out = migrate({ entries: { '2026-10-19': entry('2026-10-19') }, settings: { name: 'Joe' }, onboarded: true }, 4)

  it('starts without Plus, with the free look and no packs', () => {
    expect(out.plus).toBe(false)
    expect(out.yearSeen).toBeNull()
    expect(out.settings).toMatchObject({ name: 'Joe', palette: 'ember', font: 'fraunces', packs: [] })
  })

  it('keeps Plus choices already stored', () => {
    const v5 = migrate({ entries: {}, settings: { palette: 'dusk', packs: ['work'] }, plus: true, yearSeen: 2026 }, 5)
    expect(v5).toMatchObject({ plus: true, yearSeen: 2026, settings: { palette: 'dusk', packs: ['work'] } })
  })
})

describe('migrate from version 5', () => {
  const v5 = {
    entries: { '2026-10-19': entry('2026-10-19') },
    settings: { name: 'Joe', reminderTime: '22:00', palette: 'dusk', packs: ['hardSeasons'] },
    installDismissed: true,
    plus: true,
    yearSeen: null,
    onboarded: true,
  }
  const out = migrate(v5, 5)

  it('keeps everything and starts with no reminder set', () => {
    expect(out.entries['2026-10-19']).toEqual(v5.entries['2026-10-19'])
    expect(out.settings).toMatchObject({ name: 'Joe', reminderTime: '22:00', reminder: 'off', palette: 'dusk', packs: ['hardSeasons'] })
    expect(out.plus).toBe(true)
  })

  it('drops the old Home Screen card state', () => {
    expect(out).not.toHaveProperty('installDismissed')
  })

  it('keeps a reminder that was already set', () => {
    expect(migrate({ entries: {}, settings: { reminder: 'calendar' } }, 6).settings.reminder).toBe('calendar')
  })
})
