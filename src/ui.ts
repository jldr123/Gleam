import { create } from 'zustand'

export type Screen = 'home' | 'reflect' | 'bank' | 'settings' | 'backup' | 'stats' | 'year' | 'plus'

interface UI {
  screen: Screen
  /** Where Back goes from a screen opened from more than one place. */
  prev: Screen
  /** Entry opened from the bank, by date. */
  openEntry: string | null
  go: (screen: Screen) => void
  setOpenEntry: (date: string | null) => void
}

export const useUI = create<UI>()((set, get) => ({
  screen: 'home',
  prev: 'home',
  openEntry: null,
  go: (screen) => set({ screen, prev: get().screen === screen ? get().prev : get().screen }),
  setOpenEntry: (openEntry) => set({ openEntry }),
}))
