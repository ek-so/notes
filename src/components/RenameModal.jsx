import { useState, useRef } from 'react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import BottomSheet from './BottomSheet.jsx'
import { splitName } from '../lib/changes.js'

export default function RenameModal({ item, onRename, onClose }) {
  const isDir = item.type === 'dir'
  const [currentName, ext] = isDir ? [item.name, ''] : splitName(item.name)
  const [name, setName] = useState(currentName)
  const [error, setError] = useState('')
  const inputRef = useRef()

  function handleRename(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed === currentName) return onClose()
    setError(onRename(trimmed) || '')
  }

  return (
    <BottomSheet
      title={`Rename ${isDir ? 'folder' : ext === '.md' ? 'note' : 'file'}`}
      onClose={onClose}
      onOpenAutoFocus={e => { e.preventDefault(); inputRef.current?.select() }}
    >
      <form onSubmit={handleRename} className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            autoCorrect="off"
            className="bg-background border-border"
          />
          {ext && <span className="text-muted-foreground shrink-0">{ext}</span>}
        </div>
        {error && <p className="text-destructive text-xs">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name.trim()} className="flex-1">Save</Button>
        </div>
      </form>
    </BottomSheet>
  )
}
