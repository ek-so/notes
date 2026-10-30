import { useState } from 'react'

export default function Auth({ onAuth }) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!token.trim()) return
    setLoading(true)
    setError('')
    try {
      await onAuth(token.trim())
    } catch {
      setError('Token invalid or missing repo access. Make sure it has "repo" scope.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-icon">🧠</div>
        <h1>Brain</h1>
        <p>Paste a GitHub token to access your notes.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="ghp_xxxxxxxxxxxx"
            value={token}
            onChange={e => setToken(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading || !token.trim()}>
            {loading ? 'Connecting…' : 'Connect'}
          </button>
        </form>
        <a
          href="https://github.com/settings/tokens/new?scopes=repo&description=Brain+Notes+App"
          target="_blank"
          rel="noopener noreferrer"
          className="token-link"
        >
          Create a token on GitHub ↗
        </a>
      </div>
    </div>
  )
}
