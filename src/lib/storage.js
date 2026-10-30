const TOKEN_KEY = 'brain_gh_token'
const REPO_KEY = 'brain_gh_repo'
const THEME_KEY = 'folio_theme'
const DRAFT_PREFIX = 'folio_draft_'
const CHANGES_KEY = 'folio_changes_'

export const storage = {
  getToken: () => {
    try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
  },
  setToken: (token) => {
    try { localStorage.setItem(TOKEN_KEY, token) } catch {}
  },
  clearToken: () => {
    try { localStorage.removeItem(TOKEN_KEY) } catch {}
  },
  getRepo: () => {
    try { return localStorage.getItem(REPO_KEY) } catch { return null }
  },
  setRepo: (repo) => {
    try { localStorage.setItem(REPO_KEY, repo) } catch {}
  },
  clearRepo: () => {
    try { localStorage.removeItem(REPO_KEY) } catch {}
  },
  getTheme: () => {
    try { return localStorage.getItem(THEME_KEY) } catch { return null }
  },
  setTheme: (theme) => {
    try { localStorage.setItem(THEME_KEY, theme) } catch {}
  },
}

export const localChanges = {
  get: (repo) => {
    try { return JSON.parse(localStorage.getItem(CHANGES_KEY + repo)) } catch { return null }
  },
  set: (repo, changes) => {
    try { localStorage.setItem(CHANGES_KEY + repo, JSON.stringify(changes)) } catch {}
  },
}

// Per-file drafts from older versions. Migrated into localChanges on load.
export const legacyDrafts = {
  all: () => {
    try {
      const result = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(DRAFT_PREFIX)) {
          result[key.slice(DRAFT_PREFIX.length)] = localStorage.getItem(key)
        }
      }
      return result
    } catch { return {} }
  },
  clear: (path) => {
    try { localStorage.removeItem(DRAFT_PREFIX + path) } catch {}
  },
}
