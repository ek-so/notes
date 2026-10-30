const TOKEN_KEY = 'brain_gh_token'
const REPO_KEY = 'brain_gh_repo'

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
