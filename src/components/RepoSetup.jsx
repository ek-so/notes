import { useState } from 'react'
import { setRepo, listContents } from '../lib/github.js'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'

export default function RepoSetup({ user, onRepo, onLogout }) {
  const [value, setValue] = useState(`${user.login}/`)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    const slashIdx = trimmed.indexOf('/')
    if (slashIdx < 1 || slashIdx === trimmed.length - 1) {
      setError('Use owner/repo format, e.g. ek-so/brain')
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
      setError("Can't access that repo. Check the name and token permissions.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        <span className="text-5xl leading-none">📂</span>
        <h1 className="text-2xl font-bold tracking-tight">Notes repo</h1>
        <p className="text-sm text-muted-foreground text-center">
          Which GitHub repo stores your notes?
        </p>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2.5">
          <Input
            type="text"
            placeholder="owner/repo"
            value={value}
            onChange={e => setValue(e.target.value)}
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
            className="font-mono h-12 text-base bg-card border-border"
          />
          {error && <p className="text-destructive text-xs text-center">{error}</p>}
          <Button type="submit" disabled={loading || !value.trim()} className="w-full h-12">
            {loading ? 'Connecting…' : 'Connect'}
          </Button>
        </form>
        <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground">
          Sign out
        </Button>
      </div>
    </div>
  )
}
