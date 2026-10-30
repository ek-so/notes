import { useState } from 'react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import BottomSheet from './BottomSheet.jsx'

// Creates the note or folder locally; it reaches GitHub on the next sync.
export default function NewFileModal({ folder, kind, onCreate, onClose }) {
  const isFolder = kind === 'folder'
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function handleCreate(e) {
    e.preventDefault()
    setError(onCreate(name.trim()) || '')
  }

  return (
    <BottomSheet
      title={isFolder ? 'New folder' : 'New note'}
      description={folder ? `in ${folder}` : undefined}
      onClose={onClose}
    >
      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <Input
          type="text"
          placeholder={isFolder ? 'Folder name' : 'Note name'}
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          autoCorrect="off"
          autoCapitalize="words"
          className="h-11 bg-background border-border"
        />
        {error && <p className="text-destructive text-xs">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name.trim()} className="flex-1">Create</Button>
        </div>
      </form>
    </BottomSheet>
  )
}
