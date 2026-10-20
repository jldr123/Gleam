import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button, Sparkle, Star, TopBar } from '../components/ui'
import { formatShortDay } from '../lib/dates'
import { isHelpCheckNight } from '../lib/care'
import { closingLine, maxGratitudes, personFromDraft, specificityNudge, stepsFor, SUPPORT_URL, weekEntries } from '../lib/flow'
import { thankYouDraft } from '../lib/people'
import { LENS_LABELS, LOOKBACK, moodBranch } from '../lib/prompts'
import { MAX_TEXT_LENGTH, MOODS, type HelpAnswer, type Mood, type Step } from '../lib/types'
import { useStore } from '../store'
import { useUI } from '../ui'

export function Reflect() {
  const draft = useStore((s) => s.draft)
  const entries = useStore((s) => s.entries)
  const rhythm = useStore((s) => s.settings.rhythm)
  const updateDraft = useStore((s) => s.updateDraft)
  const saveDraft = useStore((s) => s.saveDraft)
  const go = useUI((s) => s.go)
  const [closed, setClosed] = useState<{ mood: Mood | null; date: string } | null>(null)

  useEffect(() => {
    if (!draft && !closed) go('home')
  }, [draft, closed, go])

  if (closed) return <Close mood={closed.mood} date={closed.date} />
  if (!draft) return null

  const steps = stepsFor(draft, entries, rhythm)
  // A step can drop out (e.g. "Tell them?" once a name is deleted); land on the next one that exists.
  const at = steps.includes(draft.step) ? steps.indexOf(draft.step) : steps.length - 1
  const step = steps[at]
  const goTo = (s: Step) => updateDraft({ step: s })
  const next = () => {
    if (at < steps.length - 1) goTo(steps[at + 1])
    else {
      setClosed({ mood: draft.mood, date: draft.date })
      saveDraft()
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <TopBar
        onBack={at > 0 ? () => goTo(steps[at - 1]) : () => go('home')}
        right={
          <button onClick={() => go('home')} className="px-1 py-2 text-sm text-muted">
            Later
          </button>
        }
      />
      <Progress at={at} count={step === 'mood' ? 4 : steps.length} />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="flex flex-1 flex-col px-6 pt-8"
        >
          {step === 'mood' && <MoodStep onNext={(s) => goTo(s)} />}
          {step === 'care' && <CareStep onNext={next} />}
          {step === 'gratitude' && <GratitudeStep onNext={next} />}
          {step === 'prompt' && <PromptStep onNext={next} />}
          {step === 'lookback' && <LookbackStep onNext={next} />}
          {step === 'letter' && <LetterStep onNext={next} />}
          {step === 'thanks' && <ThanksStep onNext={next} />}
          {step === 'note' && <NoteStep onSave={next} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Progress({ at, count }: { at: number; count: number }) {
  return (
    <div className="flex justify-center gap-1.5 px-6" aria-label={`Step ${at + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= at ? 'w-6 bg-accent' : 'w-3 bg-surface-2'}`} />
      ))}
    </div>
  )
}

function Question({ title, hint, eyebrow }: { title: string; hint?: string; eyebrow?: string }) {
  return (
    <>
      {eyebrow && <div className="mb-3 text-xs font-semibold tracking-wide text-faint uppercase">{eyebrow}</div>}
      <h2 className="font-serif text-[28px] leading-tight font-light">{title}</h2>
      {hint && <p className="mt-2 text-[15px] text-muted">{hint}</p>}
    </>
  )
}

function Footer({ children }: { children: ReactNode }) {
  return <div className="safe-bottom mt-auto flex flex-col items-center gap-1 pt-8">{children}</div>
}

const fieldClass =
  'w-full rounded-3xl border border-line bg-surface px-5 py-4 text-[17px] leading-relaxed text-ink outline-none placeholder:text-faint focus:border-accent/50'

function MoodStep({ onNext }: { onNext: (step: Step) => void }) {
  const draft = useStore((s) => s.draft)!
  const entries = useStore((s) => s.entries)
  const rhythm = useStore((s) => s.settings.rhythm)
  const setMood = useStore((s) => s.setMood)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const pick = (mood: Mood) => {
    setMood(mood)
    // Read the draft back: a new mood can add the care card.
    const steps = stepsFor(useStore.getState().draft ?? { ...draft, mood }, entries, rhythm)
    clearTimeout(timer.current)
    // A short pause so the tap registers before the screen moves on.
    timer.current = window.setTimeout(() => onNext(steps[1]), 320)
  }

  return (
    <>
      <Question title="How was today?" hint="One tap. There's no wrong answer." />
      <div className="mt-10 flex justify-between gap-2">
        {MOODS.map((m) => {
          const active = draft.mood === m.value
          return (
            <button key={m.value} onClick={() => pick(m.value)} className="flex flex-1 flex-col items-center gap-2" aria-pressed={active}>
              <MoodDot mood={m.value} active={active} />
              <span className={`text-xs ${active ? 'font-semibold text-ink' : 'text-muted'}`}>{m.label}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}

function CareStep({ onNext }: { onNext: () => void }) {
  const updateDraft = useStore((s) => s.updateDraft)
  return (
    <>
      <Question
        title="It sounds like it's been a heavy few days."
        hint="You don't have to do anything tonight. A quick check-in is enough, or carry on if writing helps."
      />
      <SupportLink />
      <Footer>
        <Button
          className="w-full"
          onClick={() => {
            updateDraft({ care: 'checkin', step: 'note' })
          }}
        >
          Just a quick check-in
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            updateDraft({ care: 'carry' })
            onNext()
          }}
        >
          Carry on
        </Button>
      </Footer>
    </>
  )
}

function GratitudeStep({ onNext }: { onNext: () => void }) {
  const draft = useStore((s) => s.draft)!
  const light = useStore((s) => s.settings.light)
  const setGratitude = useStore((s) => s.setGratitude)
  const branch = moodBranch(draft.mood)
  const max = maxGratitudes(branch, light)
  const filled = draft.gratitudes.slice(0, max).filter((g) => g.text.trim()).length
  const [shown, setShown] = useState(Math.max(1, filled))
  const lastFilled = !!draft.gratitudes[shown - 1]?.text.trim()

  const low = branch === 'low'
  return (
    <>
      <Question
        title={low ? 'Just one thing tonight, if anything.' : 'What was good today?'}
        hint={
          low ? 'It can be very small. Or nothing at all.' : max === 1 ? 'Just one thing. Anything real counts, however small.' : 'One to three things. Anything real counts, however small.'
        }
      />
      <div className="mt-7 flex flex-col gap-3">
        {draft.gratitudes.slice(0, shown).map((g, i) => (
          <div key={i} className="rounded-3xl border border-line bg-surface px-5 py-3.5 focus-within:border-accent/50">
            <textarea
              autoFocus={i === shown - 1}
              value={g.text}
              onChange={(e) => setGratitude(i, { text: e.target.value })}
              placeholder={i === 0 ? "I'm grateful for..." : 'Something else...'}
              maxLength={MAX_TEXT_LENGTH}
              rows={1}
              className="field-sizing-content w-full bg-transparent text-[17px] leading-relaxed text-ink outline-none placeholder:text-faint"
            />
            {g.text.trim() && (
              <input
                value={g.because}
                onChange={(e) => setGratitude(i, { because: e.target.value })}
                placeholder={specificityNudge(g.text) ?? '...because'}
                maxLength={MAX_TEXT_LENGTH}
                aria-label="Why it mattered (optional)"
                className="mt-1 w-full bg-transparent text-[15px] text-muted italic outline-none placeholder:text-faint"
              />
            )}
          </div>
        ))}
        {shown < max && lastFilled && (
          <button onClick={() => setShown(shown + 1)} className="self-start px-1 text-sm text-accent">
            + Add another
          </button>
        )}
      </div>
      <Footer>
        <Button className="w-full" onClick={onNext}>
          {filled ? 'Next' : low ? "Nothing tonight, and that's okay" : 'Nothing comes to mind tonight'}
        </Button>
      </Footer>
    </>
  )
}

function PromptStep({ onNext }: { onNext: () => void }) {
  const draft = useStore((s) => s.draft)!
  const updateDraft = useStore((s) => s.updateDraft)
  const shufflePrompt = useStore((s) => s.shufflePrompt)
  const veryLow = moodBranch(draft.mood) === 'veryLow'
  return (
    <>
      <Question
        eyebrow={veryLow ? 'Before you sleep' : draft.lens ? `Tonight's lens: ${LENS_LABELS[draft.lens]}` : "Tonight's question"}
        title={draft.promptText}
        hint={veryLow ? 'No need to find a bright side tonight.' : undefined}
      />
      {!veryLow && (
        <button onClick={shufflePrompt} className="mt-3 self-start text-sm text-accent">
          Ask me something else
        </button>
      )}
      <textarea
        key={draft.promptId}
        autoFocus
        value={draft.promptAnswer}
        onChange={(e) => updateDraft({ promptAnswer: e.target.value })}
        placeholder="Write a line or two..."
        maxLength={MAX_TEXT_LENGTH}
        rows={3}
        className={`mt-7 ${fieldClass}`}
      />
      {veryLow && <SupportLink />}
      <Footer>
        <Button className="w-full" onClick={onNext}>
          {draft.promptAnswer.trim() ? 'Next' : 'Skip'}
        </Button>
      </Footer>
    </>
  )
}

function LookbackStep({ onNext }: { onNext: () => void }) {
  const draft = useStore((s) => s.draft)!
  const entries = useStore((s) => s.entries)
  const updateDraft = useStore((s) => s.updateDraft)
  const tonight = draft.gratitudes.filter((g) => g.text.trim())
  const options = [
    ...weekEntries(draft.date, entries).map((e) => ({ date: e.date, label: formatShortDay(e.date), text: e.gratitudes[0]?.text || e.promptAnswer || e.moodNote })),
    ...(tonight.length ? [{ date: draft.date, label: 'Tonight', text: tonight[0].text }] : []),
  ].filter((o) => o.text)

  return (
    <>
      <Question eyebrow="Sunday look-back" title={LOOKBACK.text} hint="Tap one to keep it starred in your bank." />
      <div className="mt-6 flex flex-col gap-2">
        {options.map((o) => {
          const active = draft.weekPick === o.date
          return (
            <button
              key={o.date}
              onClick={() => updateDraft({ weekPick: active ? null : o.date })}
              aria-pressed={active}
              className={`flex items-start gap-3 rounded-3xl border px-5 py-3.5 text-left transition ${active ? 'border-accent/60 bg-surface' : 'border-line bg-surface'}`}
            >
              <div className="flex-1">
                <div className="text-xs text-muted">{o.label}</div>
                <div className="mt-0.5 font-serif text-[17px] leading-snug">{o.text}</div>
              </div>
              <Star filled={active} className={`mt-1 h-5 w-5 ${active ? 'text-accent' : 'text-faint'}`} />
            </button>
          )
        })}
      </div>
      <Footer>
        <Button className="w-full" onClick={onNext}>
          {draft.weekPick ? 'Keep this one' : 'Skip'}
        </Button>
      </Footer>
    </>
  )
}

function ThanksStep({ onNext }: { onNext: () => void }) {
  const draft = useStore((s) => s.draft)!
  const recordThanks = useStore((s) => s.recordThanks)
  const person = personFromDraft(draft)!
  const [text, setText] = useState(() => thankYouDraft(person, person.source))
  const [status, setStatus] = useState<'idle' | 'sent' | 'copied'>(draft.thanks.some((t) => t.name === person.name) ? 'sent' : 'idle')
  const who = person.relation ? person.name.replace(/^my /, 'your ') : person.name

  const send = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text })
        recordThanks(person.name)
        setStatus('sent')
        return
      }
    } catch (e) {
      // Closing the share sheet isn't an error worth showing.
      if ((e as Error).name === 'AbortError') return
    }
    try {
      await navigator.clipboard.writeText(text)
      recordThanks(person.name)
      setStatus('copied')
    } catch {
      setStatus('idle')
    }
  }

  return (
    <>
      <Question eyebrow="Optional" title={`Tell ${who}?`} hint="People often underestimate how much a thank-you means. Edit it however you like." />
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={4} className={`mt-7 ${fieldClass}`} />
      <p className="mt-3 text-xs text-faint">It goes straight from you to them. Gleam only remembers that you said thanks.</p>
      <Footer>
        {status === 'idle' ? (
          <>
            <Button className="w-full" onClick={send} disabled={!text.trim()}>
              Send thanks
            </Button>
            <Button variant="ghost" onClick={onNext}>
              Not tonight
            </Button>
          </>
        ) : (
          <>
            <div className="mb-3 text-sm text-muted">{status === 'copied' ? `Copied. Paste it into a message to ${who}.` : 'Sent. That will mean a lot.'}</div>
            <Button className="w-full" onClick={onNext}>
              Next
            </Button>
          </>
        )}
      </Footer>
    </>
  )
}

function LetterStep({ onNext }: { onNext: () => void }) {
  const draft = useStore((s) => s.draft)!
  const updateDraft = useStore((s) => s.updateDraft)
  const setLetter = useStore((s) => s.setLetter)
  const named = personFromDraft(draft)
  const letter = draft.letter ?? { to: '', text: '', sent: false }
  const [status, setStatus] = useState<'idle' | 'copied'>('idle')

  if (draft.letterChoice !== 'write') {
    return (
      <>
        <Question
          eyebrow="A deeper night"
          title="Write a thank-you letter tonight?"
          hint="Once in a while, a few lines to someone who mattered: what they did, and what it meant. You can send it or just keep it."
        />
        <Footer>
          <Button
            className="w-full"
            onClick={() => {
              updateDraft({ letterChoice: 'write' })
              if (!draft.letter && named) setLetter({ to: named.relation ? named.name.replace(/^my /, '') : named.name })
            }}
          >
            Write a letter
          </Button>
          <Button variant="ghost" onClick={() => updateDraft({ letterChoice: 'declined', step: 'prompt' })}>
            Just tonight's question
          </Button>
        </Footer>
      </>
    )
  }

  const to = letter.to.trim()
  const done = () => {
    if (!letter.text.trim() || !to) updateDraft({ letter: null })
    onNext()
  }
  const send = async () => {
    const message = letter.text.trim()
    try {
      if (navigator.share) {
        await navigator.share({ text: message })
        setLetter({ sent: true })
        onNext()
        return
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
    try {
      await navigator.clipboard.writeText(message)
      setLetter({ sent: true })
      setStatus('copied')
    } catch {
      setStatus('idle')
    }
  }

  return (
    <>
      <Question eyebrow="A deeper night" title="Who would you like to thank?" />
      <input
        value={letter.to}
        onChange={(e) => setLetter({ to: e.target.value })}
        placeholder="Their name"
        className="mt-5 w-full rounded-full border border-line bg-surface px-5 py-3.5 text-[16px] text-ink outline-none placeholder:text-faint focus:border-accent/50"
      />
      <textarea
        value={letter.text}
        onChange={(e) => setLetter({ text: e.target.value })}
        placeholder={`Dear ${to || '...'},\n\nWhat did they do, and what did it mean to you?`}
        rows={7}
        className={`mt-3 ${fieldClass}`}
      />
      {status === 'copied' && <p className="mt-3 text-sm text-muted">Copied. Paste it into a message to {to}.</p>}
      <Footer>
        <Button className="w-full" onClick={send} disabled={!letter.text.trim() || !to}>
          Send it
        </Button>
        <Button variant="ghost" onClick={done}>
          {letter.text.trim() && to ? 'Keep it in my bank' : 'Not tonight'}
        </Button>
      </Footer>
    </>
  )
}

function NoteStep({ onSave }: { onSave: () => void }) {
  const draft = useStore((s) => s.draft)!
  const updateDraft = useStore((s) => s.updateDraft)
  return (
    <>
      <Question title="Today in one sentence." hint="Optional, for future you." />
      <input
        autoFocus
        value={draft.moodNote}
        onChange={(e) => updateDraft({ moodNote: e.target.value })}
        placeholder="Today was..."
        maxLength={MAX_TEXT_LENGTH}
        className="mt-7 w-full rounded-full border border-line bg-surface px-5 py-3.5 text-[16px] text-ink outline-none placeholder:text-faint focus:border-accent/50"
      />
      <Footer>
        <Button className="w-full" onClick={onSave}>
          Save tonight
        </Button>
      </Footer>
    </>
  )
}

function SupportLink() {
  return (
    <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="mt-5 self-start text-sm text-muted underline decoration-faint underline-offset-4">
      If things feel heavy, talking to someone can help
    </a>
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

function Close({ mood, date }: { mood: Mood | null; date: string }) {
  const go = useUI((s) => s.go)
  const entries = useStore((s) => s.entries)
  const rhythm = useStore((s) => s.settings.rhythm)
  const markHelpAsked = useStore((s) => s.markHelpAsked)
  // Decided once as the screen opens, so it doesn't vanish once marked as asked.
  const [ask] = useState(() => isHelpCheckNight(date, entries, mood, useStore.getState().helpAskedOn, rhythm))
  useEffect(() => {
    if (ask) markHelpAsked(date)
  }, [ask, date, markHelpAsked])
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
      <h2 className="mt-6 max-w-[18rem] font-serif text-[28px] leading-snug font-light">{closingLine(mood, date)}</h2>
      {moodBranch(mood) === 'veryLow' && <SupportLink />}
      {ask && <HelpCheck date={date} />}
      <Button variant="quiet" className="mt-10" onClick={() => go('home')}>
        Goodnight
      </Button>
    </motion.div>
  )
}

const ANSWERS: { value: HelpAnswer; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'sortOf', label: 'Sort of' },
  { value: 'notReally', label: 'Not really' },
]

/** Once a month: is this actually helping? Answers stay on the phone and only appear in a backup. */
function HelpCheck({ date }: { date: string }) {
  const answerHelp = useStore((s) => s.answerHelp)
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const [answer, setAnswer] = useState<HelpAnswer | null>(null)
  const [changed, setChanged] = useState<string | null>(null)

  const pick = (a: HelpAnswer) => {
    answerHelp(date, a)
    setAnswer(a)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-10 w-full max-w-[20rem] rounded-3xl border border-line bg-surface p-5">
      {answer === null ? (
        <>
          <div className="text-[15px]">Is Gleam helping you wind down?</div>
          <div className="mt-4 flex flex-col gap-2">
            {ANSWERS.map((a) => (
              <Button key={a.value} variant="quiet" className="py-2.5 text-sm" onClick={() => pick(a.value)}>
                {a.label}
              </Button>
            ))}
          </div>
        </>
      ) : answer === 'yes' ? (
        <div className="text-[15px] text-muted">Thank you. That's good to hear.</div>
      ) : changed ? (
        <div className="text-[15px] text-muted">{changed} You can change it any time in Settings.</div>
      ) : (
        <>
          <div className="text-[15px]">Thanks for saying. Would a lighter rhythm suit you better?</div>
          <div className="mt-4 flex flex-col gap-2">
            {settings.rhythm.mode === 'nightly' && (
              <Button
                variant="quiet"
                className="py-2.5 text-sm"
                onClick={() => {
                  updateSettings({ rhythm: { ...settings.rhythm, mode: 'some' } })
                  setChanged('Done: a few nights a week.')
                }}
              >
                A few nights a week
              </Button>
            )}
            {!settings.light && (
              <Button
                variant="quiet"
                className="py-2.5 text-sm"
                onClick={() => {
                  updateSettings({ light: true })
                  setChanged('Done: just one good thing each night.')
                }}
              >
                Lighter nights, one thing each
              </Button>
            )}
            <Button variant="ghost" className="py-2 text-sm" onClick={() => setChanged('Keeping things as they are.')}>
              Keep things as they are
            </Button>
          </div>
        </>
      )}
    </motion.div>
  )
}
