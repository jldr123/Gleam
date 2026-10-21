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
  go: (screen: Screen) => void
  /** Returns to the screen the user came from, or home. */
  back: () => void
  setOpenEntry: (date: string | null) => void
  setPreview: (preview: LookPreview | null) => void
}

export const useUI = create<UI>()((set, get) => ({
  screen: 'home',
  history: [],
  openEntry: null,
  preview: null,
  go: (screen) => {
    const { screen: current, history } = get()
    if (screen === current) return
    set({ screen, history: screen === 'home' ? [] : [...history, current] })
  },
  back: () => {
    const history = [...get().history]
    set({ screen: history.pop() ?? 'home', history })
  },
  setOpenEntry: (openEntry) => set({ openEntry }),
  setPreview: (preview) => set({ preview }),
}))
