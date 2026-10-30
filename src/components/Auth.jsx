import { useState } from 'react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'

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
      setError('Token invalid or missing repo access. Needs "repo" scope.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        <span className="text-5xl leading-none">📝</span>
        <h1 className="text-2xl font-bold tracking-tight">Folio</h1>
        <p className="text-sm text-muted-foreground text-center">
          Paste a GitHub token to access your notes.
        </p>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2.5">
          <Input
            type="password"
            placeholder="ghp_xxxxxxxxxxxx"
            value={token}
            onChange={e => setToken(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
            className="font-mono tracking-wide h-12 text-base bg-card border-border"
          />
          {error && <p className="text-destructive text-xs text-center">{error}</p>}
          <Button type="submit" disabled={loading || !token.trim()} className="w-full h-12">
            {loading ? 'Connecting…' : 'Connect'}
          </Button>
        </form>
        <a
          href="https://github.com/settings/tokens/new?scopes=repo&description=Folio"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm hover:opacity-80 transition-opacity"
        >
          Create a token on GitHub ↗
        </a>
      </div>
    </div>
  )
}
