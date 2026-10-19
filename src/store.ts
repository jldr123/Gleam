import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { addDays, logicalDate } from './lib/dates'
import { promptFor, PROMPTS } from './lib/prompts'
import { DEFAULT_SETTINGS, MAX_TEXT_LENGTH, type Draft, type Entry, type Mood, type Settings } from './lib/types'

interface State {
  entries: Record<string, Entry>
  draft: Draft | null
  settings: Settings
  /** Developer time travel: offset added to the real clock. */
  clockOffsetMs: number

  today: () => string
  startReflection: () => void
  updateDraft: (patch: Partial<Draft>) => void
  setGratitude: (index: number, text: string) => void
  setMood: (mood: Mood) => void
  shufflePrompt: () => void
  saveDraft: () => void
  discardDraft: () => void
  deleteEntry: (date: string) => void

  updateSettings: (patch: Partial<Settings>) => void
  setClockOffset: (ms: number) => void
  seedDemo: (nights: number) => void
  reset: () => void
}

const clip = (s: string) => s.slice(0, MAX_TEXT_LENGTH)

const emptyDraft = (date: string): Draft => {
  const prompt = promptFor(date)
  return {
    date,
    step: 0,
    gratitudes: ['', '', ''],
    promptId: prompt.id,
    promptText: prompt.text,
    promptAnswer: '',
    mood: null,
    moodNote: '',
  }
}

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const now = () => new Date(Date.now() + get().clockOffsetMs)

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
            const gratitudes = [...existing.gratitudes, '', '', ''].slice(0, 3)
            set({ draft: { ...existing, gratitudes, step: 0 } })
          } else {
            set({ draft: emptyDraft(today) })
          }
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

        setGratitude: (index, text) => {
          const d = get().draft
          if (!d) return
          const gratitudes = [...d.gratitudes]
          gratitudes[index] = clip(text)
          set({ draft: { ...d, gratitudes } })
        },

        setMood: (mood) => get().updateDraft({ mood }),

        shufflePrompt: () => {
          const d = get().draft
          if (!d) return
          const at = PROMPTS.findIndex((p) => p.id === d.promptId)
          const next = PROMPTS[(at + 1) % PROMPTS.length]
          set({ draft: { ...d, promptId: next.id, promptText: next.text } })
        },

        saveDraft: () => {
          const { draft, entries } = get()
          if (!draft) return
          const { step: _step, ...rest } = draft
          const t = Date.now()
          const entry: Entry = {
            ...rest,
            gratitudes: rest.gratitudes.map((g) => g.trim()).filter(Boolean),
            promptAnswer: rest.promptAnswer.trim(),
            moodNote: rest.moodNote.trim(),
            createdAt: entries[draft.date]?.createdAt ?? t,
            updatedAt: t,
          }
          set({ entries: { ...entries, [draft.date]: entry }, draft: null })
        },

        discardDraft: () => set({ draft: null }),

        deleteEntry: (date) => {
          const entries = { ...get().entries }
          delete entries[date]
          set({ entries })
        },

        updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
        setClockOffset: (clockOffsetMs) => set({ clockOffsetMs }),

        seedDemo: (nights) => {
          const today = get().today()
          const samples = [
            'Morning coffee on the balcony',
            'A long call with Mum',
            'Finishing the report early',
            'Sam made dinner',
            'The walk home in the sun',
            'A quiet hour with a book',
            'Laughing with Sam about nothing',
            'My legs carrying me up the hill',
            'Coffee with Priya',
            'The dog being ridiculous',
            'A text from an old friend',
            'Clean sheets',
          ]
          const answers = ['Priya, who covered for me.', 'That I can say no kindly.', 'The rain on the window.', 'I stayed calm in the meeting.']
          const entries = { ...get().entries }
          for (let i = 1; i <= nights; i++) {
            if (i % 9 === 0) continue // leave a few rest nights
            const date = addDays(today, -i)
            const prompt = promptFor(date)
            const t = Date.now() - i * 86_400_000
            entries[date] = {
              date,
              gratitudes: [samples[i % samples.length], samples[(i * 5 + 3) % samples.length], samples[(i * 7 + 1) % samples.length]],
              promptId: prompt.id,
              promptText: prompt.text,
              promptAnswer: answers[i % answers.length],
              mood: ((i * 3) % 5 + 1) as Mood,
              moodNote: 'A steady sort of day.',
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
      version: 1,
      partialize: ({ entries, draft, settings, clockOffsetMs }) => ({ entries, draft, settings, clockOffsetMs }),
    },
  ),
)
