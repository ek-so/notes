import { useState, useRef } from 'react'
import { Menu, Plus, FileText, Folder, Pencil, Trash2 } from 'lucide-react'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import RenameModal from './RenameModal.jsx'
import DeleteModal from './DeleteModal.jsx'
import { cn } from '@/lib/utils.js'
import { splitName } from '../lib/changes.js'

const IMAGE = /^\.(png|jpe?g|gif|webp|svg|heic|avif|bmp)$/i

export default function FileBrowser({ path, onNavigate, listDir, loading, error, onSelect, currentPath, onNewFile, repo, onRename, onDelete, onRefresh, onMenu }) {
  const [renameItem, setRenameItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const pullStart = useRef(null)
  const listRef = useRef()

  const items = loading || error ? [] : listDir(path)

  // Pull-to-refresh: drag down while the list is scrolled to the top
  function onTouchStart(e) {
    const atTop = !listRef.current || listRef.current.scrollTop === 0
    pullStart.current = atTop && !refreshing ? e.touches[0].clientY : null
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
    if (item.type === 'dir') onNavigate(item.path)
    else {
      onSelect(item.path)
    }
  }

  function goBack() {
    onNavigate(path.slice(0, Math.max(path.lastIndexOf('/'), 0)))
  }

  const repoName = repo ? repo.split('/')[1] : 'Notes'
  const currentFolder = path ? path.split('/').pop() : repoName

  const offset = refreshing ? 56 : pull

  return (
    <div
      className="relative flex flex-col h-full overflow-hidden"
      style={{ paddingTop: 'var(--safe-top)' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {offset > 0 && (
        <div
          className="absolute inset-x-0 flex items-center justify-center"
          style={{ top: 'var(--safe-top)', height: offset }}
        >
          <div
            className={cn('w-5 h-5 rounded-full border-2 border-border border-t-primary', refreshing && 'animate-spin')}
            style={{ transform: refreshing ? undefined : `rotate(${pull * 4}deg)`, opacity: refreshing ? 1 : pull / 60 }}
          />
        </div>
      )}
      <div
        className={cn('relative flex flex-col flex-1 min-h-0 bg-background', !pull && 'transition-transform')}
        style={{ transform: offset ? `translateY(${offset}px)` : undefined }}
      >
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-1 min-w-0">
          {path ? (
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
          ref={listRef}
          className="flex-1 overflow-y-auto overscroll-y-contain py-2"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {items.map(item => {
            const [base, ext] = item.type === 'dir' ? [item.name, ''] : splitName(item.name)
            const openable = item.type === 'dir' || ext === '.md'
            return (
              <li key={item.path}>
                <div className={cn(
                  'flex items-center pr-2 transition-colors hover:bg-secondary',
                  currentPath === item.path && 'bg-primary/10'
                )}>
                  <button
                    className="flex-1 min-w-0 flex items-center gap-3 pl-4 py-3 text-left disabled:cursor-default"
                    onClick={() => navigate(item)}
                    disabled={!openable}
                  >
                    <span className="text-lg shrink-0">{item.type === 'dir' ? '📁' : IMAGE.test(ext) ? '🖼️' : '📄'}</span>
                    <span className="flex-1 text-base truncate">
                      {base}
                      {ext && <span className="text-muted-foreground">{ext}</span>}
                      {item.changed && <span className="ml-1.5 text-primary text-xs">●</span>}
                    </span>
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
            )
          })}
        </ul>
      )}
      </div>

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
