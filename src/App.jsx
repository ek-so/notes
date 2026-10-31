import { useState, useEffect } from 'react'
import { CloudSlash } from '@phosphor-icons/react'
import Auth from './components/Auth.jsx'
import RepoSetup from './components/RepoSetup.jsx'
import FileBrowser from './components/FileBrowser.jsx'
import Editor from './components/Editor.jsx'
import PullToRefresh from './components/PullToRefresh.jsx'
import NewFileModal from './components/NewFileModal.jsx'
import ConflictModal from './components/ConflictModal.jsx'
import SyncButton from './components/SyncButton.jsx'
import SignOutModal from './components/SignOutModal.jsx'
import AccountMenu from './components/AccountMenu.jsx'
import Settings from './components/Settings.jsx'
import Spinner from './components/Spinner.jsx'
import { useAuth } from './hooks/useAuth.js'
import { useRepo } from './hooks/useRepo.js'
import { useTheme } from './hooks/useTheme.js'
import { storage } from './lib/storage.js'
import { cache } from './lib/cache.js'
import {
  listDir, nameError, renameTarget, renameError, createError, add, setEdit, rename, remove,
} from './lib/changes.js'
import { cn } from '@/lib/utils.js'

export default function App() {
  const auth = useAuth()
  const repo = useRepo(auth.user ? auth.repo : null)
  const { theme, setTheme } = useTheme()
  const [selectedFile, setSelectedFile] = useState(storage.getFile)
  const [folder, setFolder] = useState(storage.getFolder)
  const [newFile, setNewFile] = useState(null) // { folder, kind } while the sheet is open
  const [showSettings, setShowSettings] = useState(storage.getSettingsOpen)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  useEffect(() => { storage.setFolder(folder) }, [folder])
  useEffect(() => { storage.setFile(selectedFile) }, [selectedFile])
  useEffect(() => { storage.setSettingsOpen(showSettings) }, [showSettings])

  const { virtual, changes, update } = repo

  function handleRename(item, name) {
    const to = renameTarget(item, name)
    const error = nameError(name) || renameError(changes, virtual, item, to)
    if (error) return error
    update(ch => rename(ch, virtual, item.path, to, item.type === 'dir'))
    // Stay in the renamed folder / note
    const follow = p => p && (p === item.path || p.startsWith(item.path + '/')) ? to + p.slice(item.path.length) : p
    setFolder(follow)
    setSelectedFile(follow)
    return null
  }

  function handleDelete(item) {
    const inside = p => p === item.path || p?.startsWith(item.path + '/')
    if (inside(selectedFile)) setSelectedFile(null)
    // Deleting the open folder (or one above it): go to its parent
    if (inside(folder)) setFolder(item.path.slice(0, Math.max(item.path.lastIndexOf('/'), 0)))
    update(ch => remove(ch, virtual, item.path, item.type === 'dir'))
  }

  function handleCreate(name) {
    if (!repo.remote) return 'Files are still loading.'
    const error = nameError(name)
    if (error) return error
    const base = newFile.folder ? `${newFile.folder}/${name}` : name
    if (newFile.kind === 'folder') {
      const err = createError(changes, virtual, [base, `${base}/.gitkeep`])
      if (err) return err
      update(ch => add(ch, repo.remote.files, `${base}/.gitkeep`, ''))
    } else {
      const path = `${base}.md`
      const err = createError(changes, virtual, [path])
      if (err) return err
      update(ch => add(ch, repo.remote.files, path, `# ${name}\n\n`))
      setSelectedFile(path)
    }
    setNewFile(null)
    return null
  }

  async function signOut() {
    setConfirmSignOut(false)
    setShowSettings(false)
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
  const repoName = auth.repo.split('/')[1]

  return (
    <div className="flex flex-col h-full bg-background">
      <PullToRefresh onRefresh={() => window.location.reload()}>
        {showSettings ? (
          <Settings login={auth.user.login} repo={auth.repo} onBack={() => setShowSettings(false)} />
        ) : entry ? (
          <Editor
            key={selectedFile}
            path={selectedFile}
            entry={entry}
            files={virtual}
            edited={changes.edits[entry.orig]}
            onEdit={(content, original) =>
              update(ch => setEdit(ch, virtual[selectedFile], content, original))}
            onClose={() => setSelectedFile(null)}
            root={repoName}
            onNavigate={p => { setFolder(p); setSelectedFile(null) }}
            onRename={handleRename}
            onDelete={handleDelete}
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
            menu={
              <AccountMenu
                repo={auth.repo}
                theme={theme}
                onTheme={setTheme}
                onSettings={() => setShowSettings(true)}
                onSignOut={() => repo.changeCount ? setConfirmSignOut(true) : signOut()}
              />
            }
            onSelect={setSelectedFile}
            onNewFile={(f, kind) => setNewFile({ folder: f, kind })}
            repoName={repoName}
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
        <SyncButton syncState={repo.syncState} syncing={repo.syncing} changeCount={repo.changeCount} onSync={repo.sync} />
      </div>

      {confirmSignOut && (
        <SignOutModal changeCount={repo.changeCount} onSignOut={signOut} onClose={() => setConfirmSignOut(false)} />
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
          busy={repo.syncing}
          onPushLocal={repo.pushLocal}
          onUseRemote={repo.takeRemote}
          onClose={repo.dismissConflicts}
        />
      )}
    </div>
  )
}
