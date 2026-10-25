import css from '../index.css?raw'
import { PALETTES } from './plus'

const channel = (v: number) => {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('palette contrast', () => {
  for (const p of PALETTES) {
    for (const mode of ['day', 'evening'] as const) {
      const t = p[mode]
      it(`${p.label} ${mode}: small text passes WCAG AA`, () => {
        for (const tok of ['muted', 'faint'] as const) {
          for (const bg of [t.bg, t.surface]) expect(contrast(t[tok], bg)).toBeGreaterThanOrEqual(4.5)
        }
        expect(contrast(t.muted, t['surface-2'])).toBeGreaterThanOrEqual(4.5)
      })
    }
    it(`${p.label} evening: the button is dimmer than the accent and still readable`, () => {
      const t = p.evening
      expect(luminance(t.button)).toBeLessThan(luminance(t.accent))
      expect(contrast(t['button-ink'], t.button)).toBeGreaterThanOrEqual(4.5)
    })
  }

  it('keeps index.css in step with Ember', () => {
    const block = (selector: string) => css.slice(css.indexOf(selector), css.indexOf('}', css.indexOf(selector)))
    const ember = PALETTES[0]
    for (const [mode, selector] of [
      ['day', ':root {'],
      ['evening', ':root.evening {'],
    ] as const) {
      for (const tok of ['muted', 'faint', 'button', 'button-ink'] as const) expect(block(selector)).toContain(`--${tok}: ${ember[mode][tok]};`)
    }
  })
})
