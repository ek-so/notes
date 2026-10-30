const TOKEN_KEY = 'brain_gh_token'
const REPO_KEY = 'brain_gh_repo'
const DRAFT_PREFIX = 'folio_draft_'

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
}

export const drafts = {
  get: (path) => {
    try { return localStorage.getItem(DRAFT_PREFIX + path) } catch { return null }
  },
  set: (path, content) => {
    try { localStorage.setItem(DRAFT_PREFIX + path, content) } catch {}
  },
  clear: (path) => {
    try { localStorage.removeItem(DRAFT_PREFIX + path) } catch {}
  },
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
  count: () => {
    try {
      let n = 0
      for (let i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i)?.startsWith(DRAFT_PREFIX)) n++
      }
      return n
    } catch { return 0 }
  },
}
