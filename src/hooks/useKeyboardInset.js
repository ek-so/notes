import { useState, useEffect } from 'react'

// Height of the on-screen keyboard (0 when closed). iOS doesn't shrink the
// page for the keyboard, so bottom-fixed elements would sit behind it; the
// visual viewport shows how much is covered.
export function useKeyboardInset() {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    // Layout height (clientHeight) rather than innerHeight: on iOS
    // innerHeight shrinks with the keyboard too, which would hide the gap
    const update = () => {
      const layout = document.documentElement.clientHeight
      setInset(Math.max(0, Math.round(layout - vv.height - vv.offsetTop)))
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    window.addEventListener('focusin', update)
    return () => {
      window.removeEventListener('focusin', update)
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return inset
}
