import { useState, Fragment } from 'react'
import { Plus, FileText, Folder, PencilSimple, Trash, DotsThree } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from './ui/breadcrumb.jsx'
import Header from './Header.jsx'
import RenameModal from './RenameModal.jsx'
import DeleteModal from './DeleteModal.jsx'
import { cn } from '@/lib/utils.js'
import { splitName } from '../lib/changes.js'

const IMAGE = /^\.(png|jpe?g|gif|webp|svg|heic|avif|bmp)$/i

export default function FileBrowser({ path, onNavigate, listDir, loading, error, notice, onSelect, currentPath, onNewFile, repo, onRename, onDelete, onMenu }) {
  const [renameItem, setRenameItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const items = loading ? [] : listDir(path)

  function navigate(item) {
    if (item.type === 'dir') onNavigate(item.path)
    else onSelect(item.path)
  }

  function goBack() {
    onNavigate(path.slice(0, Math.max(path.lastIndexOf('/'), 0)))
  }

  const repoName = repo ? repo.split('/')[1] : 'Notes'
  const currentFolder = path ? path.split('/').pop() : repoName
  // Home, then every folder level down to the current one
  const crumbs = [{ name: repoName, path: '' }, ...path.split('/').filter(Boolean).map((name, i, parts) => (
    { name, path: parts.slice(0, i + 1).join('/') }
  ))]

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header
        title={currentFolder}
        onMenu={onMenu}
        onBack={path ? goBack : undefined}
      >
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
      </Header>

      {path && (
        <Breadcrumb className="px-4 pt-3">
          <BreadcrumbList>
            {crumbs.map((crumb, i) => (
              <Fragment key={crumb.path}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {i === crumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <button onClick={() => onNavigate(crumb.path)}>{crumb.name}</button>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-border border-t-primary animate-spin" />
        </div>
      )}
      {error && <p className="text-destructive text-sm text-center pt-4 px-4">{error}</p>}
      {notice && <p className="text-muted-foreground text-xs text-center pt-3 px-4">{notice}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-12">No notes yet</p>
      )}
      {!loading && (
        <ul
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
                      {item.changed && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />}
                    </span>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="More actions"
                        className="shrink-0 text-muted-foreground"><DotsThree className="size-5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
                      <DropdownMenuItem onSelect={() => setRenameItem(item)}><PencilSimple /> Rename</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleteItem(item)}>
                        <Trash /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            )
          })}
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
