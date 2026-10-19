import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Button, Sparkle, TopBar } from '../components/ui'
import { computeStreak } from '../lib/streak'
import { MAX_TEXT_LENGTH, MOODS } from '../lib/types'
import { useStore } from '../store'
import { useUI } from '../ui'

const GRATITUDE_STEPS = 3
const PROMPT_STEP = 3
const MOOD_STEP = 4
const STEP_COUNT = 5

const gratitudeCopy = [
  { title: 'What is one thing you are grateful for today?', hint: 'Anything real counts, however small.' },
  { title: 'And another?', hint: 'A person, a moment, something you have.' },
  { title: 'One more, if it is there.', hint: 'Only if you mean it. Two is plenty.' },
]

export function Reflect() {
  const draft = useStore((s) => s.draft)
  const updateDraft = useStore((s) => s.updateDraft)
  const go = useUI((s) => s.go)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!draft && !saved) go('home')
  }, [draft, saved, go])

  if (saved) return <Done />
  if (!draft) return null

  const step = draft.step
  const setStep = (n: number) => updateDraft({ step: Math.max(0, Math.min(STEP_COUNT - 1, n)) })

  return (
    <div className="flex min-h-full flex-col">
      <TopBar
        onBack={step > 0 ? () => setStep(step - 1) : () => go('home')}
        right={
          <button onClick={() => go('home')} className="px-1 py-2 text-sm text-muted">
            Later
          </button>
        }
      />
      <Progress step={step} />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="flex flex-1 flex-col px-6 pt-10"
        >
          {step < GRATITUDE_STEPS && <GratitudeStep index={step} onNext={() => setStep(step + 1)} onEnough={() => setStep(PROMPT_STEP)} />}
          {step === PROMPT_STEP && <PromptStep onNext={() => setStep(MOOD_STEP)} />}
          {step === MOOD_STEP && <MoodStep onSaved={() => setSaved(true)} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Progress({ step }: { step: number }) {
  return (
    <div className="flex justify-center gap-1.5 px-6" aria-label={`Step ${step + 1} of ${STEP_COUNT}`}>
      {Array.from({ length: STEP_COUNT }, (_, i) => (
        <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= step ? 'w-6 bg-accent' : 'w-3 bg-surface-2'}`} />
      ))}
    </div>
  )
}

function Question({ title, hint }: { title: string; hint?: string }) {
  return (
    <>
      <h2 className="font-serif text-[28px] leading-tight font-light">{title}</h2>
      {hint && <p className="mt-2 text-[15px] text-muted">{hint}</p>}
    </>
  )
}

function Field({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={MAX_TEXT_LENGTH}
      rows={3}
      className="mt-8 w-full rounded-3xl border border-line bg-surface px-5 py-4 text-[17px] leading-relaxed text-ink outline-none placeholder:text-faint focus:border-accent/50"
    />
  )
}

function Footer({ children }: { children: React.ReactNode }) {
  return <div className="safe-bottom mt-auto flex flex-col items-center gap-1 pt-8">{children}</div>
}

function GratitudeStep({ index, onNext, onEnough }: { index: number; onNext: () => void; onEnough: () => void }) {
  const value = useStore((s) => s.draft?.gratitudes[index] ?? '')
  const setGratitude = useStore((s) => s.setGratitude)
  const filled = value.trim().length > 0
  const copy = gratitudeCopy[index]
  return (
    <>
      <Question title={copy.title} hint={copy.hint} />
      <Field value={value} onChange={(v) => setGratitude(index, v)} placeholder="I'm grateful for..." />
      <Footer>
        <Button className="w-full" onClick={onNext} disabled={!filled}>
          {index === GRATITUDE_STEPS - 1 ? 'Next' : 'Add another'}
        </Button>
        <Button variant="ghost" onClick={index === GRATITUDE_STEPS - 1 ? onNext : onEnough}>
          {index === 0 ? 'Nothing comes to mind tonight' : index === GRATITUDE_STEPS - 1 ? 'Skip' : "That's enough for tonight"}
        </Button>
      </Footer>
    </>
  )
}

function PromptStep({ onNext }: { onNext: () => void }) {
  const draft = useStore((s) => s.draft)!
  const updateDraft = useStore((s) => s.updateDraft)
  const shufflePrompt = useStore((s) => s.shufflePrompt)
  return (
    <>
      <div className="mb-3 text-xs font-semibold tracking-wide text-faint uppercase">Tonight's question</div>
      <Question title={draft.promptText} />
      <button onClick={shufflePrompt} className="mt-3 self-start text-sm text-accent">
        Ask me something else
      </button>
      <Field key={draft.promptId} value={draft.promptAnswer} onChange={(v) => updateDraft({ promptAnswer: v })} placeholder="Write a line or two..." />
      <Footer>
        <Button className="w-full" onClick={onNext}>
          {draft.promptAnswer.trim() ? 'Next' : 'Skip'}
        </Button>
      </Footer>
    </>
  )
}

function MoodStep({ onSaved }: { onSaved: () => void }) {
  const draft = useStore((s) => s.draft)!
  const setMood = useStore((s) => s.setMood)
  const updateDraft = useStore((s) => s.updateDraft)
  const saveDraft = useStore((s) => s.saveDraft)
  const save = () => {
    saveDraft()
    onSaved()
  }
  return (
    <>
      <Question title="How was today, overall?" hint="There's no wrong answer." />
      <div className="mt-8 flex justify-between gap-2">
        {MOODS.map((m) => {
          const active = draft.mood === m.value
          return (
            <button key={m.value} onClick={() => setMood(m.value)} className="flex flex-1 flex-col items-center gap-2" aria-pressed={active}>
              <MoodDot mood={m.value} active={active} />
              <span className={`text-xs ${active ? 'font-semibold text-ink' : 'text-muted'}`}>{m.label}</span>
            </button>
          )
        })}
      </div>
      <input
        value={draft.moodNote}
        onChange={(e) => updateDraft({ moodNote: e.target.value })}
        placeholder="Today in one sentence..."
        maxLength={MAX_TEXT_LENGTH}
        className="mt-8 w-full rounded-full border border-line bg-surface px-5 py-3.5 text-[16px] text-ink outline-none placeholder:text-faint focus:border-accent/50"
      />
      <Footer>
        <Button className="w-full" onClick={save}>
          Save tonight's reflection
        </Button>
      </Footer>
    </>
  )
}

export function MoodDot({ mood, active = true, size = 'lg' }: { mood: number; active?: boolean; size?: 'lg' | 'sm' }) {
  // Brighter and larger as the day gets better; never red for a hard day.
  const scale = 0.55 + mood * 0.09
  const dim = size === 'lg' ? 'h-12 w-12' : 'h-3.5 w-3.5'
  return (
    <span className={`flex ${dim} items-center justify-center rounded-full transition ${active ? 'bg-surface-2' : ''}`}>
      <span
        className="block rounded-full bg-accent transition"
        style={{ width: `${scale * 100}%`, height: `${scale * 100}%`, opacity: active ? 0.35 + mood * 0.13 : 0.25 }}
      />
    </span>
  )
}

function Done() {
  const go = useUI((s) => s.go)
  const entries = useStore((s) => s.entries)
  const today = useStore((s) => s.today())
  const streak = computeStreak(entries, today)
  const count = entries[today]?.gratitudes.length ?? 0
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="glow safe-top safe-bottom flex min-h-full flex-col items-center justify-center px-8 text-center"
    >
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.9 }}>
        <Sparkle className="h-14 w-14 text-accent" />
      </motion.div>
      <h2 className="mt-6 font-serif text-[30px] leading-tight font-light">Saved for tonight.</h2>
      <p className="mt-3 max-w-[18rem] text-[15px] leading-relaxed text-muted">
        {count > 0 ? `${count} good ${count === 1 ? 'thing' : 'things'} added to your bank. ` : ''}
        {streak.nights > 1 ? `That's ${streak.nights} nights in a row. ` : ''}
        Now put the phone down and let the day settle.
      </p>
      <Button variant="quiet" className="mt-10" onClick={() => go('home')}>
        Goodnight
      </Button>
    </motion.div>
  )
}
