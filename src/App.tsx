import type { ComponentType } from 'react'
import { useThemeClass } from './hooks'
import { Backup } from './screens/Backup'
import { Bank } from './screens/Bank'
import { Home } from './screens/Home'
import { Reflect } from './screens/Reflect'
import { Settings } from './screens/Settings'
import { Welcome } from './screens/Welcome'
import { useStore } from './store'
import { useUI, type Screen } from './ui'

const screens: Record<Screen, ComponentType> = {
  home: Home,
  reflect: Reflect,
  bank: Bank,
  settings: Settings,
  backup: Backup,
}

export default function App() {
  useThemeClass()
  const screen = useUI((s) => s.screen)
  const onboarded = useStore((s) => s.onboarded)
  const Current = onboarded ? screens[screen] : Welcome
  return (
    <div className="mx-auto h-full max-w-md overflow-y-auto">
      <Current />
    </div>
  )
}
