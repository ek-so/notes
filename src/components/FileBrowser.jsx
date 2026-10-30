import { useState, useRef } from 'react'
import { Menu, Plus, FileText, Folder, Pencil, Trash2 } from 'lucide-react'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import RenameModal from './RenameModal.jsx'
import DeleteModal from './DeleteModal.jsx'
import { cn } from '@/lib/utils.js'

export default function FileBrowser({ listDir, loading, error, onSelect, currentPath, onNewFile, repo, onRename, onDelete, onRefresh, onMenu }) {
  const [path, setPath] = useState('')
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [renameItem, setRenameItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const pullStart = useRef(null)

  const items = loading || error ? [] : listDir(path)

  // Pull-to-refresh: drag down while scrolled to the top
  function onTouchStart(e) {
    pullStart.current = e.currentTarget.scrollTop === 0 && !refreshing ? e.touches[0].clientY : null
  }

  function onTouchMove(e) {
    if (pullStart.current === null) return
    const dy = e.touches[0].clientY - pullStart.current
    setPull(dy > 0 ? Math.min(dy / 2, 80) : 0)
  }

  async function onTouchEnd() {
    pullStart.current = null
    if (pull >= 60) {
      setRefreshing(true)
      setPull(0)
      await onRefresh()
      setRefreshing(false)
    } else setPull(0)
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
          {breadcrumbs.length > 0 ? (
            <Button variant="ghost" size="icon" onClick={goBack} aria-label="Back" className="shrink-0">←</Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={onMenu} aria-label="Menu" className="shrink-0">
              <Menu className="size-5" />
            </Button>
          )}
          <span className="text-xl font-bold truncate">{currentFolder}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" aria-label="New" className="shrink-0">
              <Plus className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
            <DropdownMenuItem onSelect={() => onNewFile(path, 'note')}><FileText /> New note</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onNewFile(path, 'folder')}><Folder /> New folder</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        <ul
          className="flex-1 overflow-y-auto overscroll-y-contain py-2"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {(pull > 0 || refreshing) && (
            <li
              className={cn('flex justify-center items-end overflow-hidden', !pull && 'transition-[height]')}
              style={{ height: refreshing ? 48 : pull }}
            >
              <div
                className={cn('w-5 h-5 mb-3 rounded-full border-2 border-border border-t-primary',
                  refreshing && 'animate-spin')}
                style={{ transform: refreshing ? undefined : `rotate(${pull * 4}deg)`, opacity: refreshing ? 1 : pull / 60 }}
              />
            </li>
          )}
          {items.map(item => (
            <li key={item.path}>
              <div className={cn(
                'flex items-center pr-2 transition-colors hover:bg-secondary',
                currentPath === item.path && 'bg-primary/10'
              )}>
                <button
                  className="flex-1 min-w-0 flex items-center gap-3 pl-4 py-3 text-left"
                  onClick={() => navigate(item)}
                >
                  <span className="text-lg shrink-0">{item.type === 'dir' ? '📁' : '📄'}</span>
                  <span className="flex-1 text-base truncate">{item.name.replace(/\.md$/, '')}</span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="More actions"
                      className="shrink-0 text-muted-foreground">⋯</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
                    <DropdownMenuItem onSelect={() => setRenameItem(item)}><Pencil /> Rename</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleteItem(item)}>
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}

      {renameItem && (
        <RenameModal
          item={renameItem}
          onRename={name => {
            const err = onRename(renameItem, name)
            if (!err) setRenameItem(null)
            return err
          }}
          onClose={() => setRenameItem(null)}
        />
      )}

      {deleteItem && (
        <DeleteModal
          item={deleteItem}
          onDelete={() => { onDelete(deleteItem); setDeleteItem(null) }}
          onClose={() => setDeleteItem(null)}
        />
      )}
    </div>
  )
}
