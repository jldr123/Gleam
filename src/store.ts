import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { addDays, logicalDate } from './lib/dates'
import { isLookbackNight, maxGratitudes } from './lib/flow'
import { migrate, STORE_VERSION } from './lib/migrate'
import { LOOKBACK, moodBranch, promptFor } from './lib/prompts'
import { DEFAULT_SETTINGS, MAX_TEXT_LENGTH, type Draft, type Entry, type Gratitude, type Mood, type Settings } from './lib/types'

interface State {
  entries: Record<string, Entry>
  draft: Draft | null
  settings: Settings
  /** Developer time travel: offset added to the real clock. */
  clockOffsetMs: number

  today: () => string
  startReflection: () => void
  updateDraft: (patch: Partial<Draft>) => void
  setGratitude: (index: number, patch: Partial<Gratitude>) => void
  setMood: (mood: Mood) => void
  shufflePrompt: () => void
  recordThanks: (name: string) => void
  saveDraft: () => void
  discardDraft: () => void

  updateSettings: (patch: Partial<Settings>) => void
  setClockOffset: (ms: number) => void
  seedDemo: (nights: number) => void
  reset: () => void
}

const clip = (s: string) => s.slice(0, MAX_TEXT_LENGTH)
const blankGratitudes = (): Gratitude[] => [0, 1, 2].map(() => ({ text: '', because: '' }))

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const now = () => new Date(Date.now() + get().clockOffsetMs)

      /** Re-picks tonight's prompt for the draft's mood, keeping any shuffle. */
      const withPrompt = (d: Draft): Draft => {
        const p = promptFor(d.date, get().entries, d.mood, d.promptSkip)
        return { ...d, lens: p.lens, promptId: p.id, promptText: p.text }
      }

      return {
        entries: {},
        draft: null,
        settings: DEFAULT_SETTINGS,
        clockOffsetMs: 0,

        today: () => logicalDate(now()),

        startReflection: () => {
          const today = get().today()
          const { draft, entries } = get()
          if (draft?.date === today) return
          const existing = entries[today]
          if (existing) {
            const { starred: _s, createdAt: _c, updatedAt: _u, ...rest } = existing
            const gratitudes = [...existing.gratitudes, ...blankGratitudes()].slice(0, 3)
            set({ draft: { ...rest, gratitudes, step: 'mood', promptSkip: 0 } })
            return
          }
          set({
            draft: withPrompt({
              date: today,
              step: 'mood',
              mood: null,
              gratitudes: blankGratitudes(),
              lens: null,
              promptId: '',
              promptText: '',
              promptAnswer: '',
              promptSkip: 0,
              moodNote: '',
              weekPick: null,
              thanks: [],
            }),
          })
        },

        updateDraft: (patch) => {
          const d = get().draft
          if (!d) return
          set({
            draft: {
              ...d,
              ...patch,
              promptAnswer: clip(patch.promptAnswer ?? d.promptAnswer),
              moodNote: clip(patch.moodNote ?? d.moodNote),
            },
          })
        },

        setGratitude: (index, patch) => {
          const d = get().draft
          if (!d) return
          const gratitudes = [...d.gratitudes]
          const g = { ...gratitudes[index], ...patch }
          gratitudes[index] = { text: clip(g.text), because: clip(g.because) }
          set({ draft: { ...d, gratitudes } })
        },

        setMood: (mood) => {
          const d = get().draft
          if (!d) return
          const changedBranch = moodBranch(d.mood) !== moodBranch(mood) || d.mood === null
          const next = { ...d, mood }
          // A different kind of night gets a prompt suited to it, unless one was already answered.
          set({ draft: changedBranch && !d.promptAnswer.trim() ? withPrompt({ ...next, promptSkip: 0 }) : next })
        },

        shufflePrompt: () => {
          const d = get().draft
          if (!d) return
          set({ draft: withPrompt({ ...d, promptSkip: d.promptSkip + 1 }) })
        },

        recordThanks: (name) => {
          const d = get().draft
          if (!d) return
          set({ draft: { ...d, thanks: [...d.thanks, { name, at: Date.now() }] } })
        },

        saveDraft: () => {
          const { draft, entries } = get()
          if (!draft) return
          const { step: _step, promptSkip: _skip, ...rest } = draft
          const t = Date.now()
          const previous = entries[draft.date]
          const lookback = isLookbackNight(draft.date, entries, draft.mood)
          const limit = maxGratitudes(moodBranch(draft.mood))
          const entry: Entry = {
            ...rest,
            gratitudes: rest.gratitudes
              .slice(0, limit)
              .map((g) => ({ text: g.text.trim(), because: g.because.trim() }))
              .filter((g) => g.text),
            ...(lookback ? { lens: null, promptId: LOOKBACK.id, promptText: LOOKBACK.text } : { weekPick: null }),
            promptAnswer: lookback ? '' : rest.promptAnswer.trim(),
            moodNote: rest.moodNote.trim(),
            starred: previous?.starred ?? false,
            createdAt: previous?.createdAt ?? t,
            updatedAt: t,
          }
          const next = { ...entries, [draft.date]: entry }
          // Move the star if tonight's look-back changed its pick.
          const oldPick = previous?.weekPick
          if (oldPick && oldPick !== entry.weekPick && next[oldPick]) next[oldPick] = { ...next[oldPick], starred: false }
          if (entry.weekPick && next[entry.weekPick]) next[entry.weekPick] = { ...next[entry.weekPick], starred: true }
          set({ entries: next, draft: null })
        },

        discardDraft: () => set({ draft: null }),

        updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
        setClockOffset: (clockOffsetMs) => set({ clockOffsetMs }),

        seedDemo: (nights) => {
          const today = get().today()
          const samples: Gratitude[] = [
            { text: 'Morning coffee on the balcony', because: 'ten quiet minutes before the day started' },
            { text: 'A long call with Mum', because: 'she always knows what to say' },
            { text: 'Finishing the report early', because: '' },
            { text: 'Sam made dinner', because: 'I was exhausted and didn’t have to think' },
            { text: 'The walk home in the sun', because: '' },
            { text: 'A quiet hour with a book', because: '' },
            { text: 'Laughing with Sam about nothing', because: 'it reminded me how easy we are together' },
            { text: 'My legs carrying me up the hill', because: '' },
            { text: 'Coffee with Priya', because: 'she listened properly' },
            { text: 'The dog being ridiculous', because: '' },
            { text: 'A text from an old friend', because: 'out of nowhere, just to say hi' },
            { text: 'Clean sheets', because: '' },
          ]
          const answers = ['Priya, who covered for me.', 'That I can say no kindly.', 'The rain on the window.', 'I stayed calm in the meeting.']
          const entries = { ...get().entries }
          for (let i = nights; i >= 1; i--) {
            if (i % 9 === 0) continue // leave a few rest nights
            const date = addDays(today, -i)
            const mood = (((i * 3) % 5) + 1) as Mood
            const p = promptFor(date, entries, mood)
            const count = maxGratitudes(moodBranch(mood))
            const t = Date.now() - i * 86_400_000
            entries[date] = {
              date,
              mood,
              gratitudes: [samples[i % samples.length], samples[(i * 5 + 3) % samples.length], samples[(i * 7 + 1) % samples.length]].slice(0, count),
              lens: p.lens,
              promptId: p.id,
              promptText: p.text,
              promptAnswer: answers[i % answers.length],
              moodNote: 'A steady sort of day.',
              weekPick: null,
              starred: i % 11 === 0,
              thanks: i % 13 === 0 ? [{ name: 'Sam', at: t }] : [],
              createdAt: t,
              updatedAt: t,
            }
          }
          set({ entries })
        },

        reset: () => set({ entries: {}, draft: null, settings: DEFAULT_SETTINGS, clockOffsetMs: 0 }),
      }
    },
    {
      name: 'gleam',
      version: STORE_VERSION,
      migrate: (persisted, version) => migrate(persisted, version) as unknown as State,
      partialize: ({ entries, draft, settings, clockOffsetMs }) => ({ entries, draft, settings, clockOffsetMs }),
    },
  ),
)
