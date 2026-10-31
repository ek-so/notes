import { useState } from 'react'
import { Plus, FileText, Folder } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import Header from './Header.jsx'
import PathBreadcrumbs from './PathBreadcrumbs.jsx'
import ItemMenu from './ItemMenu.jsx'
import { splitName } from '../lib/changes.js'
import { isImage } from '../lib/files.js'
import Spinner from './Spinner.jsx'
import { cn } from '@/lib/utils.js'

export default function FileBrowser({ path, onNavigate, listDir, loading, error, notice, onSelect, onNewFile, repoName, onRename, onDelete, onMove, folders, menu }) {
  const items = loading ? [] : listDir(path)
  const [dragging, setDragging] = useState(null)
  const [dragOverPath, setDragOverPath] = useState(null)

  function navigate(item) {
    if (item.type === 'dir') onNavigate(item.path)
    else onSelect(item.path)
  }

  const currentFolder = path ? path.split('/').pop() : repoName

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header
        start={
          path ? (
            <div className="flex-1 min-w-0">
              <PathBreadcrumbs root={repoName} path={path} onNavigate={onNavigate} />
            </div>
          ) : menu
        }
      >
        {path && (
          <ItemMenu item={{ name: currentFolder, path, type: 'dir' }} onRename={onRename} onDelete={onDelete} onMove={onMove} folders={folders} />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" aria-label="New" className="shrink-0">
              <Plus />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
            <DropdownMenuItem onSelect={() => onNewFile(path, 'note')}><FileText /> New note</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onNewFile(path, 'folder')}><Folder /> New folder</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Header>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-[680px] mx-auto">
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}
        {error && <p className="text-destructive text-sm text-center pt-4 px-4">{error}</p>}
        {notice && <p className="text-muted-foreground text-xs text-center pt-3 px-4">{notice}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-12">No notes yet</p>
        )}
        {!loading && (
          <ul className={path ? 'pb-2 px-2' : 'py-2 px-2'}>
            {items.map(item => {
              const [base, ext] = item.type === 'dir' ? [item.name, ''] : splitName(item.name)
              const openable = item.type === 'dir' || ext === '.md'
              const isDropTarget = item.type === 'dir' && dragging && dragging.path !== item.path
              const isDraggedItem = dragging?.path === item.path
              return (
                <li
                  key={item.path}
                  draggable
                  onDragStart={e => {
                    setDragging(item)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragEnd={() => { setDragging(null); setDragOverPath(null) }}
                  className={isDraggedItem ? 'opacity-40' : ''}
                >
                  <div
                    className={cn(
                      'flex items-center pr-1 rounded-lg transition-colors',
                      dragOverPath === item.path && isDropTarget && 'bg-primary/10 ring-1 ring-primary/40'
                    )}
                    onDragOver={e => {
                      if (!isDropTarget) return
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      setDragOverPath(item.path)
                    }}
                    onDragLeave={e => {
                      if (item.type !== 'dir') return
                      if (!e.currentTarget.contains(e.relatedTarget)) setDragOverPath(null)
                    }}
                    onDrop={e => {
                      if (!isDropTarget) return
                      e.preventDefault()
                      onMove?.(dragging, item.path)
                      setDragging(null)
                      setDragOverPath(null)
                    }}
                  >
                    <Button
                      variant="ghost"
                      className="flex-1 min-w-0 justify-start gap-3 pl-3 pr-0 rounded-lg font-normal text-left hover:bg-secondary disabled:opacity-100 disabled:cursor-default"
                      onClick={() => navigate(item)}
                      disabled={!openable}
                    >
                      {item.type === 'dir'
                        ? <img src={`${import.meta.env.BASE_URL}folio-logo.png`} alt="" className="size-6 shrink-0 object-contain" />
                        : <span className="text-lg shrink-0">{isImage(item.name) ? '🖼️' : '📄'}</span>}
                      <span className="flex-1 text-base truncate">
                        {base}
                        {ext && <span className="text-muted-foreground">{ext}</span>}
                        {item.changed && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />}
                      </span>
                    </Button>
                    <ItemMenu item={item} onRename={onRename} onDelete={onDelete} onMove={onMove} folders={folders} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        </div>
      </div>
    </div>
  )
}
