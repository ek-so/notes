import { useState } from 'react'
import { setRepo, listContents } from '../lib/github.js'

export default function RepoSetup({ user, onRepo, onLogout }) {
  const [value, setValue] = useState(`${user.login}/`)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    const slashIdx = trimmed.indexOf('/')
    if (slashIdx < 1 || slashIdx === trimmed.length - 1) {
      setError('Enter in owner/repo format, e.g. ek-so/brain')
      return
    }
    const ownerVal = trimmed.slice(0, slashIdx)
    const repoVal = trimmed.slice(slashIdx + 1)
    setLoading(true)
    setError('')
    setRepo(ownerVal, repoVal)
    try {
      await listContents('')
      onRepo(ownerVal, repoVal)
    } catch {
      setError("Couldn't access that repo. Check the name and token permissions.")
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-icon">📂</div>
        <h1>Notes repo</h1>
        <p>Which GitHub repo stores your notes?</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="owner/repo"
            value={value}
            onChange={e => setValue(e.target.value)}
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading || !value.trim()}>
            {loading ? 'Connecting…' : 'Connect'}
          </button>
        </form>
        <button className="logout-btn" style={{ marginTop: 8 }} onClick={onLogout}>
          Sign out
        </button>
      </div>
    </div>
  )
}
