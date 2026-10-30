import { useState, useEffect, useRef } from 'react'
import { createFile } from '../lib/github.js'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'

export default function NewFileModal({ folder, kind, onCreated, onClose }) {
  const isFolder = kind === 'folder'
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef()

  // Wait for the menu that opened this to release focus
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus())
    return () => clearTimeout(timer)
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setCreating(true)
    setError('')
    try {
      const base = folder ? `${folder}/${trimmed}` : trimmed
      if (isFolder) {
        await createFile(`${base}/.gitkeep`, '', `Create folder ${trimmed}`)
        onCreated(base)
      } else {
        await createFile(`${base}.md`, `# ${trimmed}\n\n`)
        onCreated(`${base}.md`)
      }
    } catch {
      setError(isFolder ? 'Could not create folder. Try again.' : 'Could not create file. Try again.')
      setCreating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[680px] bg-card rounded-t-2xl p-6 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h2 className="text-lg font-bold">{isFolder ? 'New folder' : 'New note'}</h2>
          {folder && <p className="text-xs text-muted-foreground mt-0.5">in {folder}</p>}
        </div>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <Input
            ref={inputRef}
            type="text"
            placeholder={isFolder ? 'Folder name' : 'Note name'}
            value={name}
            onChange={e => setName(e.target.value)}
            autoCorrect="off"
            autoCapitalize="words"
            className="h-11 bg-background border-border"
          />
          {error && <p className="text-destructive text-xs">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating || !name.trim()} className="flex-1">
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
