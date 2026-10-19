import { create } from 'zustand'

export type Screen = 'home' | 'reflect' | 'bank' | 'settings'

interface UI {
  screen: Screen
  /** Entry opened from the bank, by date. */
  openEntry: string | null
  go: (screen: Screen) => void
  setOpenEntry: (date: string | null) => void
}

export const useUI = create<UI>()((set) => ({
  screen: 'home',
  openEntry: null,
  go: (screen) => set({ screen }),
  setOpenEntry: (openEntry) => set({ openEntry }),
}))
