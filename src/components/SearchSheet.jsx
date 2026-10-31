import { useState, useRef, useEffect } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Dialog, DialogContent } from './ui/dialog.jsx'
import { Input } from './ui/input.jsx'
import { splitName } from '../lib/changes.js'
import { isImage } from '../lib/files.js'

// Command-palette style search. Shows recently opened files when no query is typed,
// then filters all .md files in the repo by path/name as the user types.
export default function SearchSheet({ open, onClose, onSelect, virtual, changes, recent }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef()

  useEffect(() => {
    if (open) {
      setQuery('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const q = query.trim().toLowerCase()
  const allFiles = Object.keys(virtual || {}).filter(p => p.endsWith('.md') && !p.endsWith('/.gitkeep'))
  const recentFiles = (recent || []).filter(p => p in (virtual || {}))

  const results = q
    ? allFiles.filter(p => p.toLowerCase().includes(q)).slice(0, 30)
    : recentFiles.slice(0, 12)

  function select(path) {
    onSelect(path)
    onClose()
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden"
        showCloseButton={false}
        aria-describedby={undefined}
        aria-label="Search files"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <MagnifyingGlass className="size-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search files…"
            className="border-0 shadow-none focus-visible:ring-0 px-0 h-12 bg-transparent"
          />
        </div>
        <div className="overflow-y-auto max-h-80">
          {!q && recentFiles.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8 px-4">No recent files</p>
          ) : results.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8 px-4">No files found</p>
          ) : (
            <ul className="py-1">
              {results.map(path => {
                const parts = path.split('/')
                const fileName = parts.pop()
                const [base] = splitName(fileName)
                const folder = parts.join('/')
                const hasEdit = changes?.edits && path in (changes.edits)
                const icon = isImage(fileName) ? '🖼️' : '📄'
                return (
                  <li key={path}>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary text-left min-h-11"
                      onClick={() => select(path)}
                    >
                      <span className="text-lg shrink-0">{icon}</span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5 text-sm truncate">
                          {base}
                          {hasEdit && <span className="inline-block size-1.5 rounded-full bg-primary shrink-0" />}
                        </span>
                        {folder && <span className="block text-xs text-muted-foreground truncate">{folder}</span>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
