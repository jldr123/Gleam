import { useStore } from './store'
import { useUI, type LookPreview } from './ui'

/** From the preview bar: keeps the look being tried while the user reads about Plus. */
export function carryPreviewToPlus(): void {
  const { preview, setPendingLook, go } = useUI.getState()
  setPendingLook(preview)
  go('plus')
}

/**
 * Turns Plus on after a purchase or restore. A look the user was previewing
 * becomes their own, so the app doesn't drop back to Ember. Returns that look.
 */
export function unlockPlus(): LookPreview | null {
  const { pendingLook, preview } = useUI.getState()
  const look = pendingLook ?? preview
  const store = useStore.getState()
  if (look) {
    const patch: LookPreview = {}
    if (look.palette) patch.palette = look.palette
    if (look.font) patch.font = look.font
    store.updateSettings(patch)
  }
  store.setPlus(true)
  useUI.setState({ pendingLook: null, preview: null })
  return look
}
