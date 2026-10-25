import { useUI } from './ui'

const path = (...steps: (string | 'back')[]) => {
  useUI.setState({ screen: 'home', history: [] })
  for (const s of steps) {
    if (s === 'back') useUI.getState().back()
    else useUI.getState().go(s as never)
  }
  return useUI.getState().screen
}

describe('back navigation', () => {
  it('returns through Plus to Settings', () => {
    expect(path('settings', 'plus', 'stats', 'back')).toBe('plus')
    expect(path('settings', 'plus', 'stats', 'back', 'back')).toBe('settings')
    expect(path('settings', 'plus', 'stats', 'back', 'back', 'back')).toBe('home')
  })

  it('returns from the year review to home, not the bank', () => {
    expect(path('year', 'plus', 'back', 'back')).toBe('home')
  })

  it('goes home when there is nowhere to go back to', () => {
    expect(path('back')).toBe('home')
  })

  it('starts afresh from home', () => {
    useUI.setState({ screen: 'home', history: [] })
    for (const s of ['bank', 'stats', 'home', 'settings'] as const) useUI.getState().go(s)
    expect(useUI.getState().history).toEqual(['home'])
  })
})
