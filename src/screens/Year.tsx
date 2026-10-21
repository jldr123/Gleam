import { useEffect, useState } from 'react'
import { PlusGate } from '../components/plus'
import { Button, Card, Sparkle, Star, TopBar } from '../components/ui'
import { formatLongDate, formatMonth } from '../lib/dates'
import { reviewYearFor, YEAR_MIN_ENTRIES, yearReview, yearsWithEntries, type YearReview } from '../lib/insights'
import { useStore } from '../store'
import { useUI } from '../ui'

export function Year() {
  const entries = useStore((s) => s.entries)
  const today = useStore((s) => s.today())
  const go = useUI((s) => s.go)
  const prev = useUI((s) => s.prev)
  const years = yearsWithEntries(entries)
  const fallback = reviewYearFor(today) ?? Number(today.slice(0, 4))
  const [year, setYear] = useState(years.includes(fallback) ? fallback : (years[0] ?? fallback))
  const review = yearReview(entries, year)
  const markYearSeen = useStore((s) => s.markYearSeen)
  const season = reviewYearFor(today)
  useEffect(() => {
    if (season !== null && year === season) markYearSeen(season)
  }, [season, year, markYearSeen])

  return (
    <div className="glow flex min-h-full flex-col">
      <TopBar onBack={() => go(prev === 'year' || prev === 'plus' ? 'bank' : prev)} title="Your year in Gleam" />
      <div className="safe-bottom flex flex-col gap-4 px-5 pt-2">
        {years.length > 1 && (
          <div className="flex justify-center gap-1 rounded-full bg-surface-2 p-1">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`flex-1 rounded-full py-2 text-sm transition ${y === year ? 'bg-surface font-semibold text-ink shadow-sm' : 'text-muted'}`}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        <div className="px-2 pt-4 pb-2 text-center">
          <Sparkle className="mx-auto h-8 w-8 text-accent" />
          <h1 className="mt-4 font-serif text-[34px] leading-tight font-light">{year}, looking back</h1>
          <p className="mx-auto mt-3 max-w-[19rem] text-[15px] leading-relaxed text-muted">
            {review.nights === 0
              ? 'No evenings yet this year.'
              : `${review.nights} ${review.nights === 1 ? 'evening' : 'evenings'} reflected and ${review.gratitudes} good ${review.gratitudes === 1 ? 'thing' : 'things'} saved.`}
          </p>
        </div>

        {review.nights < YEAR_MIN_ENTRIES ? (
          <p className="px-4 pb-6 text-center text-[15px] leading-relaxed text-muted">
            Your year fills in as you reflect. After {YEAR_MIN_ENTRIES} evenings there will be enough here to look back on.
          </p>
        ) : (
          <PlusGate title="Your year, gathered up" text="Plus brings together the people, moments and months that made your year, ready to keep or share.">
            <Details review={review} />
          </PlusGate>
        )}
      </div>
    </div>
  )
}

function Details({ review }: { review: YearReview }) {
  const [sharing, setSharing] = useState<'idle' | 'busy' | 'saved' | 'failed'>('idle')
  const monthName = (m: string) => formatMonth(`${m}-01`).split(' ')[0]

  const share = async () => {
    setSharing('busy')
    try {
      const result = await shareYearImage(review)
      setSharing(result === 'saved' ? 'saved' : 'idle')
    } catch {
      setSharing('failed')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {review.people.length > 0 && (
        <Card>
          <div className="text-xs text-faint">The people who kept coming up</div>
          <div className="mt-1.5 font-serif text-[22px] leading-snug">{listOf(review.people.map((p) => p.name))}</div>
        </Card>
      )}

      {review.things.length > 0 && (
        <Card>
          <div className="text-xs text-faint">And the things</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {review.things.map((t) => (
              <span key={t.word} className="rounded-full bg-surface-2 px-3 py-1 text-[15px]">
                {t.word}
              </span>
            ))}
          </div>
        </Card>
      )}

      {(review.busiestMonth || review.brightestMonth) && (
        <Card className="flex flex-col gap-3">
          {review.busiestMonth && (
            <div>
              <div className="text-xs text-faint">Most evenings</div>
              <div className="mt-0.5 text-[15px]">
                {monthName(review.busiestMonth.month)}, with {review.busiestMonth.nights}
              </div>
            </div>
          )}
          {review.brightestMonth && (
            <div>
              <div className="text-xs text-faint">Your lightest month</div>
              <div className="mt-0.5 text-[15px]">{monthName(review.brightestMonth.month)}</div>
            </div>
          )}
        </Card>
      )}

      {review.favourites.length > 0 && (
        <Card>
          <div className="text-xs text-faint">A few you might like to reread</div>
          <ul className="mt-2 flex flex-col gap-4">
            {review.favourites.map((f) => (
              <li key={f.date + f.gratitude.text}>
                <div className="font-serif text-[18px] leading-snug">{f.gratitude.text}</div>
                {f.gratitude.because && <div className="mt-0.5 text-sm text-muted italic">because {f.gratitude.because}</div>}
                <div className="mt-1 text-xs text-faint">{formatLongDate(f.date)}</div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {review.kept.length > 0 && (
        <Card>
          <div className="text-xs text-faint">Moments you kept</div>
          <ul className="mt-2 flex flex-col gap-1.5">
            {review.kept.map((e) => (
              <li key={e.date} className="flex items-start gap-2 font-serif text-[16px] leading-snug">
                <Star className="mt-1 h-3.5 w-3.5 shrink-0 text-accent" />
                {e.gratitudes[0]?.text || e.promptAnswer || e.moodNote}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {(review.thanks > 0 || review.letters > 0) && (
        <p className="px-2 text-center text-sm leading-relaxed text-muted">
          {review.thanks > 0 && `You said thank you ${review.thanks === 1 ? 'once' : `${review.thanks} times`}`}
          {review.thanks > 0 && review.letters > 0 ? ' and ' : ''}
          {review.letters > 0 && `${review.thanks > 0 ? 'wrote' : 'You wrote'} ${review.letters === 1 ? 'one letter' : `${review.letters} letters`}`}.
        </p>
      )}

      <div className="flex flex-col items-center gap-2 pt-2 pb-4">
        <Button onClick={share} disabled={sharing === 'busy'}>
          {sharing === 'saved' ? 'Image saved' : 'Share your year'}
        </Button>
        <p className="max-w-[18rem] text-center text-xs leading-relaxed text-faint">
          {sharing === 'failed'
            ? "That didn't work on this phone. Try a screenshot instead."
            : 'The image shows your numbers and themes, never names or entries.'}
        </p>
      </div>
    </div>
  )
}

function listOf(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/** Draws a share card from the current palette and opens the share sheet, or downloads it where sharing files isn't supported. */
async function shareYearImage(review: YearReview): Promise<'shared' | 'saved'> {
  const W = 1080
  const H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No canvas')
  const css = getComputedStyle(document.documentElement)
  const v = (name: string) => css.getPropertyValue(`--${name}`).trim()
  const serif = v('serif') || 'Georgia, serif'
  const sans = "'Manrope', system-ui, sans-serif"
  await document.fonts?.ready

  ctx.fillStyle = v('bg')
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W / 2, 380, 0, W / 2, 380, 620)
  glow.addColorStop(0, v('glow'))
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'center'
  ctx.fillStyle = v('accent')
  ctx.font = `600 34px ${sans}`
  ctx.fillText('MY YEAR IN GLEAM', W / 2, 200)
  ctx.fillStyle = v('text')
  ctx.font = `300 190px ${serif}`
  ctx.fillText(String(review.year), W / 2, 400)

  const stats: [number, string][] = [
    [review.nights, review.nights === 1 ? 'evening reflected' : 'evenings reflected'],
    [review.gratitudes, review.gratitudes === 1 ? 'good thing saved' : 'good things saved'],
  ]
  stats.forEach(([n, label], i) => {
    const x = W / 2 + (i === 0 ? -230 : 230)
    ctx.fillStyle = v('text')
    ctx.font = `300 120px ${serif}`
    ctx.fillText(String(n), x, 640)
    ctx.fillStyle = v('muted')
    ctx.font = `500 34px ${sans}`
    ctx.fillText(label, x, 700)
  })

  let y = 860
  if (review.things.length) {
    ctx.fillStyle = v('muted')
    ctx.font = `500 32px ${sans}`
    ctx.fillText('What kept coming up', W / 2, y)
    ctx.fillStyle = v('text')
    ctx.font = `400 54px ${serif}`
    ctx.fillText(review.things.slice(0, 3).map((t) => t.word).join(' · '), W / 2, y + 80)
    y += 200
  }
  if (review.busiestMonth) {
    ctx.fillStyle = v('muted')
    ctx.font = `500 32px ${sans}`
    ctx.fillText(`Most evenings in ${formatMonth(`${review.busiestMonth.month}-01`).split(' ')[0]}`, W / 2, y)
  }
  ctx.fillStyle = v('faint')
  ctx.font = `600 30px ${sans}`
  ctx.fillText('Gleam', W / 2, H - 90)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('No image')
  const file = new File([blob], `gleam-${review.year}.png`, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `My year in Gleam, ${review.year}` })
      return 'shared'
    } catch (err) {
      // Closing the share sheet isn't a failure.
      if ((err as Error).name === 'AbortError') return 'shared'
      throw err
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'saved'
}
