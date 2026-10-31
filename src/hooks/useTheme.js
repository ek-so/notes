import { useState } from 'react'
import { storage } from '../lib/storage.js'

// 'system' leaves data-theme unset, so index.css follows the OS setting live
function applyTheme(theme) {
  if (theme === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', theme)
}

// Theme preference: 'light' | 'dark' | 'system' (default).
export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    const t = storage.getTheme() || 'system'
    applyTheme(t)
    return t
  })

  function setTheme(next) {
    applyTheme(next)
    storage.setTheme(next)
    setThemeState(next)
  }

  return { theme, setTheme }
}
