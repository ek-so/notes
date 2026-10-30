import { useState } from 'react'
import { storage } from '../lib/storage.js'

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

// Light/dark theme: saved choice, else the system preference.
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const t = storage.getTheme() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    applyTheme(t)
    return t
  })

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    storage.setTheme(next)
    setTheme(next)
  }

  return { theme, toggleTheme }
}
