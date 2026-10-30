import { useState, useEffect, useRef } from 'react'
import { createFile } from '../lib/github.js'

export default function NewFileModal({ folder, onCreated, onClose }) {
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef()

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setCreating(true)
    setError('')
    try {
      const filePath = folder ? `${folder}/${trimmed}.md` : `${trimmed}.md`
      await createFile(filePath, `# ${trimmed}\n\n`)
      onCreated(filePath)
    } catch {
      setError('Could not create file. Try again.')
      setCreating(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>New note</h2>
        {folder && <p className="modal-folder">in {folder}</p>}
        <form onSubmit={handleCreate}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Note name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoCorrect="off"
            autoCapitalize="words"
          />
          {error && <p className="error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={creating || !name.trim()}>
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
