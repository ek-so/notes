import { useState, useEffect } from 'react'
import { ArrowsClockwise, Check, X, Sun, Moon, CloudSlash } from '@phosphor-icons/react'
import Auth from './components/Auth.jsx'
import RepoSetup from './components/RepoSetup.jsx'
import FileBrowser from './components/FileBrowser.jsx'
import Editor from './components/Editor.jsx'
import PullToRefresh from './components/PullToRefresh.jsx'
import NewFileModal from './components/NewFileModal.jsx'
import ConflictModal from './components/ConflictModal.jsx'
import BottomSheet from './components/BottomSheet.jsx'
import Spinner from './components/Spinner.jsx'
import { Button } from './components/ui/button.jsx'
import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from './components/ui/sheet.jsx'
import { useAuth } from './hooks/useAuth.js'
import { useRepo } from './hooks/useRepo.js'
import { useTheme } from './hooks/useTheme.js'
import { storage } from './lib/storage.js'
import { cache } from './lib/cache.js'
import { listDir, splitName, exists, nameError, add, setEdit, rename, remove } from './lib/changes.js'
import { cn } from '@/lib/utils.js'

export default function App() {
  const auth = useAuth()
  const repo = useRepo(auth.user ? auth.repo : null)
  const { theme, toggleTheme } = useTheme()
  const [selectedFile, setSelectedFile] = useState(storage.getFile)
  const [folder, setFolder] = useState(storage.getFolder)
  const [newFile, setNewFile] = useState(null) // { folder, kind } while the sheet is open
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  useEffect(() => { storage.setFolder(folder) }, [folder])
  useEffect(() => { storage.setFile(selectedFile) }, [selectedFile])

  const { virtual, changes, update } = repo

  // A remote path whose original name is taken by a local rename can't be
  // reused until that rename is synced.
  function pathError(path) {
    if (exists(virtual, path)) return 'That name is already taken.'
    if (changes.moves[path]) return 'Sync first: a renamed item used this name.'
    return null
  }

  function handleRename(item, name) {
    const error = nameError(name)
    if (error) return error
    const parent = item.path.slice(0, item.path.lastIndexOf('/') + 1)
    const to = parent + name + (item.type === 'dir' ? '' : splitName(item.name)[1])
    if (exists(virtual, to)) return 'That name is already taken.'
    // A path freed by an unsynced rename/delete would clash in one commit
    const moving = item.type === 'dir'
      ? Object.keys(virtual).filter(p => p.startsWith(item.path + '/'))
      : [item.path]
    const clash = moving.some(p => {
      const target = to + p.slice(item.path.length)
      return target in changes.moves && target !== virtual[p].orig
    })
    if (clash) return 'Sync first: a renamed or deleted item just used this name.'
    update(ch => rename(ch, virtual, item.path, to, item.type === 'dir'))
    return null
  }

  function handleDelete(item) {
    if (selectedFile === item.path || selectedFile?.startsWith(item.path + '/')) setSelectedFile(null)
    update(ch => remove(ch, virtual, item.path, item.type === 'dir'))
  }

  function handleCreate(name) {
    if (!repo.remote) return 'Files are still loading.'
    const error = nameError(name)
    if (error) return error
    const base = newFile.folder ? `${newFile.folder}/${name}` : name
    if (newFile.kind === 'folder') {
      const err = pathError(base) || pathError(`${base}/.gitkeep`)
      if (err) return err
      update(ch => add(ch, repo.remote.files, `${base}/.gitkeep`, ''))
    } else {
      const path = `${base}.md`
      const err = pathError(path)
      if (err) return err
      update(ch => add(ch, repo.remote.files, path, `# ${name}\n\n`))
      setSelectedFile(path)
    }
    setNewFile(null)
    return null
  }

  async function signOut() {
    setConfirmSignOut(false)
    setMenuOpen(false)
    repo.discardAll()
    await cache.clearAll()
    auth.signOut()
    setSelectedFile(null)
    setFolder('')
  }

  if (!auth.ready) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <Spinner />
      </div>
    )
  }

  if (!auth.user) return <Auth onAuth={auth.authenticate} />
  if (!auth.repo) return <RepoSetup user={auth.user} onRepo={auth.selectRepo} onLogout={auth.signOut} />

  const entry = selectedFile && virtual[selectedFile]
  const { syncState, syncing } = repo

  return (
    <div className="flex flex-col h-full max-w-[680px] mx-auto bg-background">
      <PullToRefresh onRefresh={() => window.location.reload()}>
        {entry ? (
          <Editor
            key={selectedFile}
            path={selectedFile}
            entry={entry}
            files={virtual}
            edited={changes.edits[entry.orig]}
            onEdit={(content, original) =>
              update(ch => setEdit(ch, virtual[selectedFile], content, original))}
            onClose={() => setSelectedFile(null)}
            root={auth.repo.split('/')[1]}
            onNavigate={p => { setFolder(p); setSelectedFile(null) }}
          />
        ) : (
          <FileBrowser
            path={folder}
            onNavigate={setFolder}
            listDir={dir => listDir(virtual, dir, repo.changed)}
            loading={!repo.remote && !repo.error}
            error={repo.error}
            notice={repo.remote?.truncated ? 'This repo is too large to list in full; some files are missing.' : ''}
            onRename={handleRename}
            onDelete={handleDelete}
            onMenu={() => setMenuOpen(true)}
            onSelect={setSelectedFile}
            onNewFile={(f, kind) => setNewFile({ folder: f, kind })}
            repo={auth.repo}
          />
        )}
      </PullToRefresh>

      <div
        className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border bg-background shrink-0"
        style={{ paddingBottom: 'calc(0.75rem + var(--safe-bottom))' }}
      >
        <span className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', repo.online && 'invisible')}>
          <CloudSlash className="size-4" /> Offline
        </span>
        <Button
          onClick={repo.sync}
          disabled={syncing}
          variant={syncState === 'error' ? 'destructive' : 'default'}
          className="gap-2"
        >
          {syncState === 'done' ? <Check />
            : syncState === 'error' ? <X />
            : syncState === 'offline' ? <CloudSlash />
            : <ArrowsClockwise className={cn(syncing && 'animate-spin')} />}
          {{ done: 'Synced', error: 'Failed', offline: 'Offline' }[syncState] || 'Sync'}
          {repo.changeCount > 0 && syncState === 'idle' && !syncing && (
            <span className="bg-primary-foreground text-primary rounded-full text-[11px] min-w-5 h-5 px-1 flex items-center justify-center font-semibold">
              {repo.changeCount}
            </span>
          )}
        </Button>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}>
          <SheetHeader>
            <SheetTitle>@{auth.user.login}</SheetTitle>
            <SheetDescription>{auth.repo}</SheetDescription>
          </SheetHeader>
          <div className="px-2">
            <Button variant="ghost" onClick={toggleTheme} className="w-full justify-start gap-3 px-2">
              {theme === 'dark' ? <><Sun /> Light theme</> : <><Moon /> Dark theme</>}
            </Button>
          </div>
          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => repo.changeCount ? setConfirmSignOut(true) : signOut()}
            >Sign out</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {confirmSignOut && (
        <BottomSheet
          title="Sign out?"
          description={`You have ${repo.changeCount} unsynced change${repo.changeCount === 1 ? '' : 's'}. Signing out deletes them from this device.`}
          onClose={() => setConfirmSignOut(false)}
        >
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmSignOut(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={signOut}>Sign out</Button>
          </div>
        </BottomSheet>
      )}

      {newFile && (
        <NewFileModal
          folder={newFile.folder}
          kind={newFile.kind}
          onCreate={handleCreate}
          onClose={() => setNewFile(null)}
        />
      )}

      {repo.conflictPaths.length > 0 && (
        <ConflictModal
          paths={repo.conflictPaths}
          busy={syncing}
          onPushLocal={repo.pushLocal}
          onUseRemote={repo.takeRemote}
          onClose={repo.dismissConflicts}
        />
      )}
    </div>
  )
}
