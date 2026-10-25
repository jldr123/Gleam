import { create } from 'zustand'
import type { HeadingFont, Palette } from './lib/types'

export type Screen = 'home' | 'reflect' | 'bank' | 'settings' | 'backup' | 'stats' | 'year' | 'plus'

/** A palette or font a free user is trying out in Settings. Never stored. */
export interface LookPreview {
  palette?: Palette
  font?: HeadingFont
}

interface UI {
  screen: Screen
  /** The screens Back walks through, most recent last. Going home clears it. */
  history: Screen[]
  /** Entry opened from the bank, by date. */
  openEntry: string | null
  preview: LookPreview | null
  /** A preview carried from Settings to the Plus screen, so unlocking keeps it. Cleared on leaving Plus. */
  pendingLook: LookPreview | null
  go: (screen: Screen) => void
  /** Returns to the screen the user came from, or home. */
  back: () => void
  setOpenEntry: (date: string | null) => void
  setPreview: (preview: LookPreview | null) => void
  setPendingLook: (look: LookPreview | null) => void
}

/** Leaving the Plus screen without buying lets a pending look go. */
const leaving = (from: Screen, to: Screen) => (from === 'plus' && to !== 'plus' ? { pendingLook: null } : {})

export const useUI = create<UI>()((set, get) => ({
  screen: 'home',
  history: [],
  openEntry: null,
  preview: null,
  pendingLook: null,
  go: (screen) => {
    const { screen: current, history } = get()
    if (screen === current) return
    set({ screen, history: screen === 'home' ? [] : [...history, current], ...leaving(current, screen) })
  },
  back: () => {
    const history = [...get().history]
    const screen = history.pop() ?? 'home'
    set({ screen, history, ...leaving(get().screen, screen) })
  },
  setOpenEntry: (openEntry) => set({ openEntry }),
  setPreview: (preview) => set({ preview }),
  setPendingLook: (pendingLook) => set({ pendingLook }),
}))
