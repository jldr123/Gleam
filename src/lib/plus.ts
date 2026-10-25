import type { HeadingFont, PackId, Palette, Settings } from './types'

/** Prompt packs anyone can turn on. Gentler questions for a hard stretch are never behind a payment. */
export const FREE_PACKS: PackId[] = ['hardSeasons']

export const PLUS_FEATURES = [
  { title: 'Your stats', text: 'Moods by weekday, the people and things that keep coming up, and your longest streak.' },
  { title: 'Your year in Gleam', text: 'A warm look back at your year, ready each December, to keep or share.' },
  { title: 'Themes', text: 'Four more palettes and two heading fonts for your evenings.' },
  { title: 'Prompt packs', text: 'Questions for relationships, work and travel.' },
]

type Tokens = Record<'bg' | 'surface' | 'surface-2' | 'line' | 'text' | 'muted' | 'faint' | 'accent' | 'accent-ink' | 'glow', string>

export interface PaletteDef {
  id: Palette
  label: string
  day: Tokens
  evening: Tokens
}

/** Ember mirrors index.css, which stays the source for the free look. */
export const PALETTES: PaletteDef[] = [
  {
    id: 'ember',
    label: 'Ember',
    day: {
      bg: '#f7f1e8', surface: '#fffaf3', 'surface-2': '#efe5d7', line: 'rgb(80 50 20 / 0.1)', text: '#2b211a',
      muted: '#7d6b5c', faint: '#b3a291', accent: '#c8743a', 'accent-ink': '#fff8ef', glow: 'rgb(232 160 92 / 0.35)',
    },
    evening: {
      bg: '#1a1410', surface: '#241c16', 'surface-2': '#2f251d', line: 'rgb(255 220 180 / 0.08)', text: '#f5ebde',
      muted: '#a8968a', faint: '#66574b', accent: '#eaa25e', 'accent-ink': '#2a1703', glow: 'rgb(234 162 94 / 0.28)',
    },
  },
  {
    id: 'candlelight',
    label: 'Candlelight',
    day: {
      bg: '#f8efdc', surface: '#fff8ea', 'surface-2': '#f0e1c4', line: 'rgb(90 60 10 / 0.1)', text: '#2e2213',
      muted: '#806a4a', faint: '#b8a27e', accent: '#b67d14', 'accent-ink': '#fff9ec', glow: 'rgb(230 180 80 / 0.35)',
    },
    evening: {
      bg: '#17120a', surface: '#221a0f', 'surface-2': '#2e2414', line: 'rgb(255 225 160 / 0.08)', text: '#f7ecd6',
      muted: '#ab9a7c', faint: '#6a5a40', accent: '#f0b548', 'accent-ink': '#2a1c02', glow: 'rgb(240 181 72 / 0.26)',
    },
  },
  {
    id: 'dusk',
    label: 'Dusk',
    day: {
      bg: '#f1eff6', surface: '#fbfaff', 'surface-2': '#e4e0ef', line: 'rgb(40 30 90 / 0.1)', text: '#24213a',
      muted: '#6e6a86', faint: '#a8a4bf', accent: '#6f5cc0', 'accent-ink': '#faf8ff', glow: 'rgb(140 120 220 / 0.3)',
    },
    evening: {
      bg: '#14131f', surface: '#1d1b2c', 'surface-2': '#27243a', line: 'rgb(210 200 255 / 0.08)', text: '#ecebf7',
      muted: '#9d99b6', faint: '#5c5875', accent: '#a99bf0', 'accent-ink': '#1b1533', glow: 'rgb(150 130 240 / 0.25)',
    },
  },
  {
    id: 'paper',
    label: 'Paper',
    day: {
      bg: '#f5f3ee', surface: '#fdfcf9', 'surface-2': '#e9e6de', line: 'rgb(30 30 20 / 0.1)', text: '#1f1f1c',
      muted: '#6b6a63', faint: '#a9a79e', accent: '#3f4a3c', 'accent-ink': '#f7f6f0', glow: 'rgb(120 120 100 / 0.18)',
    },
    evening: {
      bg: '#161614', surface: '#1f1f1c', 'surface-2': '#2a2a26', line: 'rgb(240 240 220 / 0.08)', text: '#ecebe5',
      muted: '#9c9b93', faint: '#5d5c55', accent: '#d2cebd', 'accent-ink': '#1b1b18', glow: 'rgb(200 200 180 / 0.12)',
    },
  },
  {
    id: 'sage',
    label: 'Sage',
    day: {
      bg: '#eff3ec', surface: '#fafcf7', 'surface-2': '#e0e8da', line: 'rgb(30 60 20 / 0.1)', text: '#1f2a1d',
      muted: '#66745f', faint: '#a2ae9b', accent: '#557f45', 'accent-ink': '#f6fbf2', glow: 'rgb(120 170 100 / 0.28)',
    },
    evening: {
      bg: '#121610', surface: '#1a2017', 'surface-2': '#242c20', line: 'rgb(220 255 200 / 0.08)', text: '#e9efe4',
      muted: '#97a58f', faint: '#57634f', accent: '#9cc882', 'accent-ink': '#14210c', glow: 'rgb(150 200 120 / 0.22)',
    },
  },
]

export const FONTS: { id: HeadingFont; label: string; stack: string }[] = [
  { id: 'fraunces', label: 'Soft serif', stack: "'Fraunces', ui-serif, Georgia, serif" },
  { id: 'classic', label: 'Classic', stack: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif" },
  { id: 'modern', label: 'Modern', stack: "'Manrope', ui-sans-serif, system-ui, -apple-system, sans-serif" },
]

export function paletteDef(id: Palette): PaletteDef {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]
}

/** "Dusk", "Modern" or "Dusk and Modern", for a previewed look. */
export function lookName(look: { palette?: Palette; font?: HeadingFont }): string {
  return [look.palette && paletteDef(look.palette).label, look.font && FONTS.find((f) => f.id === look.font)?.label].filter(Boolean).join(' and ')
}

/** The look actually shown: Plus choices only apply while Plus is unlocked, and a free preview shows over either. */
export function activeLook(
  settings: Settings,
  plus: boolean,
  preview: { palette?: Palette; font?: HeadingFont } | null = null,
): { palette: Palette; font: HeadingFont } {
  const base = plus ? { palette: settings.palette, font: settings.font } : { palette: 'ember' as Palette, font: 'fraunces' as HeadingFont }
  return { ...base, ...preview }
}

/** The packs that count tonight: all chosen ones with Plus, only the free ones without. */
export function activePacks(settings: Settings, plus: boolean): PackId[] {
  return plus ? settings.packs : settings.packs.filter((p) => FREE_PACKS.includes(p))
}
