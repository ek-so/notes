import { registerSW } from 'virtual:pwa-register'

const IDLE_DELAY_MS = 300

const isTyping = () => document.activeElement?.matches('textarea, input')

// Keeps the installed app current. Checks for a new version on start and
// whenever the app comes back to the foreground (iOS resumes home-screen
// apps instead of restarting them). A ready update reloads the page, but not
// while a text field has focus; edits are saved on the way out (pagehide).
export function setupAutoUpdate() {
  let ready = false

  const applyUpdate = registerSW({
    immediate: true,
    onNeedRefresh() {
      ready = true
      applyWhenIdle()
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {})
      })
    },
  })

  function applyWhenIdle() {
    if (!ready) return
    if (isTyping()) {
      document.addEventListener('focusout', () => setTimeout(applyWhenIdle, IDLE_DELAY_MS), { once: true })
      return
    }
    ready = false
    applyUpdate(true)
  }
}
