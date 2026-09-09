import { createContext } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

export type ThemeContextValue = {
  /** What the user chose. `system` follows the operating system setting. */
  preference: ThemePreference
  /** The theme actually rendered once `system` is resolved. */
  resolved: 'light' | 'dark'
  setPreference: (preference: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export const THEME_STORAGE_KEY = 'theme'
