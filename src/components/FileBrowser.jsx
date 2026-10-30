import { useState, useEffect } from 'react'
import { listContents } from '../lib/github.js'
import { Button } from './ui/button.jsx'
import { cn } from '@/lib/utils.js'

export default function FileBrowser({ onSelect, currentPath, onNewFile, repo, draftCount, onSync, syncState }) {
  const [path, setPath] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [error, setError] = useState('')

  useEffect(() => { load(path) }, [path])

  async function load(p) {
    setLoading(true)
    setError('')
    try {
      const contents = await listContents(p)
      setItems(contents)
    } catch {
      setError('Failed to load files.')
    }
    setLoading(false)
  }

  function navigate(item) {
    if (item.type === 'dir') {
      setBreadcrumbs(prev => [...prev, { name: item.name, path }])
      setPath(item.path)
    } else {
      onSelect(item.path)
    }
  }

  function goBack() {
    const prev = breadcrumbs[breadcrumbs.length - 1]
    setBreadcrumbs(b => b.slice(0, -1))
    setPath(prev.path)
  }

  const repoName = repo ? repo.split('/')[1] : 'Notes'
  const currentFolder = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : repoName

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className="flex items-center justify-between px-4 pb-3 border-b border-border shrink-0"
        style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}
      >
        <div className="flex items-center gap-1 min-w-0">
          {breadcrumbs.length > 0 && (
            <Button variant="ghost" size="icon" onClick={goBack} aria-label="Back" className="shrink-0">←</Button>
          )}
          <span className="text-xl font-bold truncate">{currentFolder}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onNewFile(path)} aria-label="New note"
          className="shrink-0 text-primary text-2xl font-light">＋</Button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-border border-t-primary animate-spin" />
        </div>
      )}
      {error && <p className="text-destructive text-sm text-center py-12 px-4">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-12">No notes yet</p>
      )}
      {!loading && (
        <ul className="flex-1 overflow-y-auto py-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          {items.map(item => (
            <li key={item.path}>
              <button
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  'hover:bg-secondary',
                  currentPath === item.path && 'bg-primary/10'
                )}
                onClick={() => navigate(item)}
              >
                <span className="text-lg shrink-0">{item.type === 'dir' ? '📁' : '📄'}</span>
                <span className="flex-1 text-base truncate">{item.name.replace(/\.md$/, '')}</span>
                {item.type === 'dir' && <span className="text-muted-foreground text-xl shrink-0">›</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
