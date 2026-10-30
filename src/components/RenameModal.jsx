import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import { splitName } from '../lib/changes.js'

export default function RenameModal({ item, onRename, onClose }) {
  const isDir = item.type === 'dir'
  const [currentName, ext] = isDir ? [item.name, ''] : splitName(item.name)
  const [name, setName] = useState(currentName)
  const [error, setError] = useState('')
  const inputRef = useRef()

  // Wait for the menu that opened this to release focus
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.select())
    return () => clearTimeout(timer)
  }, [])

  function handleRename(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed === currentName) return onClose()
    setError(onRename(trimmed) || '')
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
        <h2 className="text-lg font-bold truncate">Rename {isDir ? 'folder' : ext === '.md' ? 'note' : 'file'}</h2>
        <form onSubmit={handleRename} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              autoCorrect="off"
              className="h-11 bg-background border-border"
            />
            {ext && <span className="text-muted-foreground shrink-0">{ext}</span>}
          </div>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()} className="flex-1">Save</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
