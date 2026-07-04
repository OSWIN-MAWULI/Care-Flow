import { create } from 'zustand'

interface ThemeStore {
  dark: boolean
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  dark: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  toggle: () =>
    set((state) => {
      const next = !state.dark
      document.documentElement.classList.toggle('dark', next)
      return { dark: next }
    }),
}))
