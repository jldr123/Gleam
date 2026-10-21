import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { addDays, logicalDate } from './lib/dates'
import { applyImport, mergeHelpChecks } from './lib/backup'
import { needsCare } from './lib/care'
import { isLetterNight, isLookbackNight, maxGratitudes } from './lib/flow'
import { migrate, STORE_VERSION } from './lib/migrate'
import { activePacks } from './lib/plus'
import { CHECKIN, LETTER, LOOKBACK, moodBranch, promptFor } from './lib/prompts'
import {
  DEFAULT_BACKUP,
  DEFAULT_SETTINGS,
  MAX_TEXT_LENGTH,
  type BackupState,
  type Draft,
  type Entry,
  type Gratitude,
  type HelpAnswer,
  type HelpCheck,
  type Letter,
  type Mood,
  type Settings,
} from './lib/types'

interface State {
  entries: Record<string, Entry>
  draft: Draft | null
  settings: Settings
  backup: BackupState
  /** Developer time travel: offset added to the real clock. */
  clockOffsetMs: number
  onboarded: boolean
  /** Kept on this phone only: the night the heavy-stretch card was last shown. */
  careShownOn: string | null
  helpChecks: HelpCheck[]
  helpAskedOn: string | null
  devTools: boolean
  plus: boolean
  yearSeen: number | null

  today: () => string
  startReflection: () => void
  updateDraft: (patch: Partial<Draft>) => void
  setGratitude: (index: number, patch: Partial<Gratitude>) => void
  setMood: (mood: Mood) => void
  shufflePrompt: () => void
  recordThanks: (name: string) => void
  setLetter: (patch: Partial<Letter>) => void
  saveDraft: () => void
  discardDraft: () => void

  updateSettings: (patch: Partial<Settings>) => void
  recordExport: () => void
  dismissBackupReminder: () => void
  importEntries: (incoming: Record<string, Entry>, replace: boolean, helpChecks?: HelpCheck[]) => void
  finishOnboarding: () => void
  setDevTools: (on: boolean) => void
  /** Prototype stand-in for the App Store purchase. */
  setPlus: (on: boolean) => void
  markYearSeen: (year: number) => void
  markHelpAsked: (date: string) => void
  answerHelp: (date: string, answer: HelpAnswer) => void
  setClockOffset: (ms: number) => void
  seedDemo: (nights: number) => void
  /** Prototype tool: makes three of the last six nights heavy, to try the care card. */
  seedHeavyWeek: () => void
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
        const { plus, settings } = get()
        const p = promptFor(d.date, get().entries, d.mood, d.promptSkip, activePacks(settings, plus))
        return { ...d, lens: p.lens, promptId: p.id, promptText: p.text }
      }

      return {
        entries: {},
        draft: null,
        settings: DEFAULT_SETTINGS,
        backup: DEFAULT_BACKUP,
        clockOffsetMs: 0,
        onboarded: false,
        careShownOn: null,
        helpChecks: [],
        helpAskedOn: null,
        devTools: false,
        plus: false,
        yearSeen: null,

        today: () => logicalDate(now()),

        startReflection: () => {
          const today = get().today()
          const { draft, entries } = get()
          if (draft?.date === today) return
          const existing = entries[today]
          if (existing) {
            const { starred: _s, createdAt: _c, updatedAt: _u, ...rest } = existing
            const gratitudes = [...existing.gratitudes, ...blankGratitudes()].slice(0, 3)
            const letterChoice = existing.letter ? 'write' : existing.letterOffered ? 'declined' : 'undecided'
            const care = existing.promptId === CHECKIN.id ? 'checkin' : 'none'
            set({ draft: { ...rest, gratitudes, step: 'mood', promptSkip: 0, letterChoice, care } })
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
              letter: null,
              letterOffered: false,
              letterChoice: 'undecided',
              care: 'none',
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
          // After a heavy stretch, a hard night opens with a gentle card. Only this phone remembers it was shown.
          const care = needsCare(d.date, get().entries, mood, get().careShownOn)
          if (care && d.care === 'none') set({ careShownOn: d.date })
          const next = { ...d, mood, care: care ? (d.care === 'none' ? 'offer' : d.care) : 'none' } as Draft
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

        setLetter: (patch) => {
          const d = get().draft
          if (!d) return
          const letter = { to: '', text: '', sent: false, ...d.letter, ...patch }
          set({ draft: { ...d, letter: { ...letter, to: letter.to.slice(0, 60), text: letter.text.slice(0, 4000) } } })
        },

        saveDraft: () => {
          const { draft, entries } = get()
          if (!draft) return
          const { step: _step, promptSkip: _skip, letterChoice, ...rest } = draft
          const t = Date.now()
          const previous = entries[draft.date]
          const { rhythm, light } = get().settings
          const checkin = draft.care === 'checkin'
          const lookback = isLookbackNight(draft.date, entries, draft.mood, rhythm)
          const letterNight = !lookback && isLetterNight(draft.date, entries, draft.mood, rhythm)
          const wroteLetter = letterNight && letterChoice !== 'declined' && !!draft.letter?.text.trim() && !!draft.letter.to.trim()
          const limit = checkin ? 0 : maxGratitudes(moodBranch(draft.mood), light)
          const { care: _care, ...fields } = rest
          const entry: Entry = {
            ...fields,
            gratitudes: rest.gratitudes
              .slice(0, limit)
              .map((g) => ({ text: g.text.trim(), because: g.because.trim() }))
              .filter((g) => g.text),
            ...(lookback ? { lens: null, promptId: LOOKBACK.id, promptText: LOOKBACK.text } : { weekPick: null }),
            ...(wroteLetter ? { lens: null, promptId: LETTER.id, promptText: LETTER.text } : {}),
            ...(checkin ? { lens: null, promptId: CHECKIN.id, promptText: CHECKIN.text, weekPick: null } : {}),
            promptAnswer: lookback || wroteLetter || checkin ? '' : rest.promptAnswer.trim(),
            letter: wroteLetter ? { ...draft.letter!, to: draft.letter!.to.trim(), text: draft.letter!.text.trim() } : null,
            letterOffered: letterNight,
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

        recordExport: () =>
          set({ backup: { ...get().backup, lastExportAt: Date.now(), entriesAtExport: Object.keys(get().entries).length } }),

        dismissBackupReminder: () => set({ backup: { ...get().backup, dismissedAtCount: Object.keys(get().entries).length } }),

        importEntries: (incoming, replace, helpChecks = []) =>
          set({ entries: applyImport(get().entries, incoming, replace), helpChecks: mergeHelpChecks(get().helpChecks, helpChecks) }),
        finishOnboarding: () => set({ onboarded: true }),
        setDevTools: (devTools) => set({ devTools }),
        setPlus: (plus) => set({ plus }),
        markYearSeen: (yearSeen) => set({ yearSeen }),
        markHelpAsked: (date) => set({ helpAskedOn: date }),
        answerHelp: (date, answer) => set({ helpChecks: mergeHelpChecks(get().helpChecks, [{ date, answer }]) }),
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
              letter: null,
              letterOffered: false,
              createdAt: t,
              updatedAt: t,
            }
          }
          set({ entries })
        },

        seedHeavyWeek: () => {
          const today = get().today()
          const entries = { ...get().entries }
          for (const i of [1, 3, 5]) {
            const date = addDays(today, -i)
            const t = Date.now() - i * 86_400_000
            entries[date] = {
              date,
              mood: 1,
              gratitudes: entries[date]?.gratitudes ?? [],
              lens: 'hardDay',
              promptId: 'letgo',
              promptText: 'What can you let go of before you sleep?',
              promptAnswer: '',
              moodNote: 'A heavy one.',
              weekPick: null,
              starred: false,
              thanks: [],
              letter: null,
              letterOffered: false,
              createdAt: t,
              updatedAt: t,
            }
          }
          set({ entries, careShownOn: null })
        },

        reset: () =>
          set({
            entries: {},
            draft: null,
            settings: DEFAULT_SETTINGS,
            backup: DEFAULT_BACKUP,
            clockOffsetMs: 0,
            onboarded: false,
            careShownOn: null,
            helpChecks: [],
            helpAskedOn: null,
            plus: false,
            yearSeen: null,
          }),
      }
    },
    {
      name: 'gleam',
      version: STORE_VERSION,
      migrate: (persisted, version) => migrate(persisted, version) as unknown as State,
      partialize: ({ entries, draft, settings, backup, clockOffsetMs, onboarded, careShownOn, helpChecks, helpAskedOn, devTools, plus, yearSeen }) => ({
        entries,
        draft,
        settings,
        backup,
        clockOffsetMs,
        onboarded,
        careShownOn,
        helpChecks,
        helpAskedOn,
        devTools,
        plus,
        yearSeen,
      }),
    },
  ),
)
