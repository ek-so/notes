import { useState } from 'react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'

export default function ItemActionsModal({ item, onRename, onDelete, onClose }) {
  const isDir = item.type === 'dir'
  const currentName = item.name.replace(/\.md$/, '')
  const [name, setName] = useState(currentName)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

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
        <h2 className="text-lg font-bold truncate">{isDir ? '📁' : '📄'} {currentName}</h2>
        <form onSubmit={handleRename} className="flex flex-col gap-3">
          <Input
            autoFocus
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            autoCorrect="off"
            className="h-11 bg-background border-border"
          />
          {error && <p className="text-destructive text-xs">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={confirmDelete ? 'destructive' : 'secondary'}
              className="flex-1"
              onClick={() => confirmDelete ? onDelete() : setConfirmDelete(true)}
            >
              {confirmDelete ? (isDir ? 'Delete folder?' : 'Delete note?') : 'Delete'}
            </Button>
            <Button type="submit" disabled={!name.trim()} className="flex-1">Rename</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
