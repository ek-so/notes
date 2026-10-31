import { Plus, FileText, Folder } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import Header from './Header.jsx'
import PathBreadcrumbs from './PathBreadcrumbs.jsx'
import ItemMenu from './ItemMenu.jsx'
import { splitName } from '../lib/changes.js'
import { isImage } from '../lib/files.js'
import Spinner from './Spinner.jsx'

export default function FileBrowser({ path, onNavigate, listDir, loading, error, notice, onSelect, onNewFile, repoName, onRename, onDelete, menu }) {
  const items = loading ? [] : listDir(path)

  function navigate(item) {
    if (item.type === 'dir') onNavigate(item.path)
    else onSelect(item.path)
  }

  function goBack() {
    onNavigate(path.slice(0, Math.max(path.lastIndexOf('/'), 0)))
  }

  const currentFolder = path ? path.split('/').pop() : repoName

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header
        title={currentFolder}
        start={menu}
        onBack={path ? goBack : undefined}
      >
        {path && (
          <ItemMenu item={{ name: currentFolder, path, type: 'dir' }} onRename={onRename} onDelete={onDelete} />
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

      {/* Breadcrumbs scroll away with the list */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        {path && <PathBreadcrumbs root={repoName} path={path} onNavigate={onNavigate} />}

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
          <ul className={path ? 'pb-2' : 'py-2'}>
            {items.map(item => {
              const [base, ext] = item.type === 'dir' ? [item.name, ''] : splitName(item.name)
              const openable = item.type === 'dir' || ext === '.md'
              return (
                <li key={item.path}>
                  <div className="flex items-center pr-2 transition-colors hover:bg-secondary">
                    <Button
                      variant="ghost"
                      className="flex-1 min-w-0 justify-start gap-3 pl-4 pr-0 rounded-none font-normal text-left hover:bg-transparent disabled:opacity-100 disabled:cursor-default"
                      onClick={() => navigate(item)}
                      disabled={!openable}
                    >
                      <span className="text-lg shrink-0">{item.type === 'dir' ? '📁' : isImage(item.name) ? '🖼️' : '📄'}</span>
                      <span className="flex-1 text-base truncate">
                        {base}
                        {ext && <span className="text-muted-foreground">{ext}</span>}
                        {item.changed && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />}
                      </span>
                    </Button>
                    <ItemMenu item={item} onRename={onRename} onDelete={onDelete} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
