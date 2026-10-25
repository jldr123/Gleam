import { act, fireEvent, render, screen } from '@testing-library/react'
import { activeLook } from './lib/plus'
import { prototypeProvider, setPurchaseProvider } from './lib/purchase'
import { Plus } from './screens/Plus'
import { useStore } from './store'
import { useUI } from './ui'
import { carryPreviewToPlus, unlockPlus } from './unlock'

const ui = () => useUI.getState()
const shown = () => activeLook(useStore.getState().settings, useStore.getState().plus, ui().preview ?? ui().pendingLook)

beforeEach(() => {
  useStore.getState().reset()
  useUI.setState({ screen: 'home', history: [], preview: null, pendingLook: null })
})

/** A free user opens Settings, tries a look and taps "Unlock with Plus". Settings then clears its own preview, as it does on unmount. */
function previewThenOpenPlus(look: { palette?: 'dusk'; font?: 'modern' }) {
  ui().go('settings')
  ui().setPreview(look)
  carryPreviewToPlus()
  ui().setPreview(null)
}

describe('unlocking from a theme preview', () => {
  it('keeps the previewed look on the Plus screen', () => {
    previewThenOpenPlus({ palette: 'dusk', font: 'modern' })
    expect(ui().screen).toBe('plus')
    expect(shown()).toEqual({ palette: 'dusk', font: 'modern' })
  })

  it('saves the previewed look when Plus unlocks', () => {
    previewThenOpenPlus({ palette: 'dusk', font: 'modern' })
    expect(unlockPlus()).toEqual({ palette: 'dusk', font: 'modern' })
    const { settings, plus } = useStore.getState()
    expect(plus).toBe(true)
    expect([settings.palette, settings.font]).toEqual(['dusk', 'modern'])
    expect(ui().pendingLook).toBeNull()
    ui().back()
    ui().back()
    expect(shown()).toEqual({ palette: 'dusk', font: 'modern' })
  })

  it('only changes what was previewed', () => {
    useStore.getState().updateSettings({ font: 'classic' })
    previewThenOpenPlus({ palette: 'dusk' })
    unlockPlus()
    expect(shown()).toEqual({ palette: 'dusk', font: 'classic' })
  })

  it('goes back to Ember when they leave Plus without buying', () => {
    previewThenOpenPlus({ palette: 'dusk', font: 'modern' })
    ui().back()
    expect(ui().screen).toBe('settings')
    expect(ui().pendingLook).toBeNull()
    expect(shown()).toEqual({ palette: 'ember', font: 'fraunces' })
    expect(useStore.getState().settings.palette).toBe('ember')
  })

  it('unlocks without a preview and leaves the look alone', () => {
    ui().go('plus')
    expect(unlockPlus()).toBeNull()
    expect(shown()).toEqual({ palette: 'ember', font: 'fraunces' })
  })

  it('says the look is theirs after buying on the Plus screen', async () => {
    previewThenOpenPlus({ palette: 'dusk' })
    render(<Plus />)
    expect(screen.getByText("You're previewing Dusk. Unlock to keep it.")).toBeInTheDocument()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /Unlock for/ })))
    expect(screen.getByText('Dusk is now yours.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'See your stats' })).toBeInTheDocument()
    expect(useStore.getState().settings.palette).toBe('dusk')
  })

  it('applies the pending look when Restore purchase brings Plus back', async () => {
    setPurchaseProvider({ ...prototypeProvider, restore: async () => ({ restored: true, message: 'Gleam Plus is back.' }) })
    try {
      previewThenOpenPlus({ font: 'modern' })
      render(<Plus />)
      await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Restore purchase' })))
      expect(screen.getByText('Modern is now yours.')).toBeInTheDocument()
      expect(useStore.getState().settings.font).toBe('modern')
    } finally {
      setPurchaseProvider(prototypeProvider)
    }
  })
})
