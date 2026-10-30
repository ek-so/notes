import { useState, useEffect, useRef, useMemo } from 'react'
import Auth from './components/Auth.jsx'
import RepoSetup from './components/RepoSetup.jsx'
import FileBrowser from './components/FileBrowser.jsx'
import Editor from './components/Editor.jsx'
import PullToRefresh from './components/PullToRefresh.jsx'
import NewFileModal from './components/NewFileModal.jsx'
import ConflictModal from './components/ConflictModal.jsx'
import { init, setRepo, getUser, getTree, getBlob, commitTree } from './lib/github.js'
import { storage, localChanges, legacyDrafts } from './lib/storage.js'
import {
  empty, count, virtualFiles, listDir, changedPaths, splitName, exists, setEdit, rename, remove,
  conflicts, discard, treeEntries, commitMessage,
} from './lib/changes.js'

function getEffectiveTheme() {
  const saved = storage.getTheme()
  if (saved) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}
import { ArrowsClockwise, Check, X, Sun, Moon } from '@phosphor-icons/react'
import { Button } from './components/ui/button.jsx'
import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from './components/ui/sheet.jsx'
import { cn } from '@/lib/utils.js'

export default function App() {
  const [user, setUser] = useState(null)
  const [repo, setRepoState] = useState(null)
  const [ready, setReady] = useState(false)
  const [selectedFile, setSelectedFile] = useState(storage.getFile)
  const [folder, setFolder] = useState(storage.getFolder)
  const [newFileFolder, setNewFileFolder] = useState(null)
  const [newFileKind, setNewFileKind] = useState('note')
  const [showNewFile, setShowNewFile] = useState(false)
  const [remote, setRemote] = useState(null)
  const [remoteError, setRemoteError] = useState('')
  const [changes, setChanges] = useState(empty)
  const changesRef = useRef(changes)
  const [conflictPaths, setConflictPaths] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [syncState, setSyncState] = useState('idle') // idle | done | error
  const [theme, setTheme] = useState(() => {
    const t = getEffectiveTheme()
    applyTheme(t)
    return t
  })

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    storage.setTheme(next)
    setTheme(next)
  }

  useEffect(() => {
    const token = storage.getToken()
    const savedRepo = storage.getRepo()
    if (token) {
      init(token)
      const doAuth = async () => {
        try {
          const u = await getUser()
          setUser(u)
          if (savedRepo) {
            const slashIdx = savedRepo.indexOf('/')
            setRepo(savedRepo.slice(0, slashIdx), savedRepo.slice(slashIdx + 1))
            setRepoState(savedRepo)
          }
        } catch {
          storage.clearToken()
          storage.clearRepo()
        }
        setReady(true)
      }
      doAuth()
    } else {
      setReady(true)
    }
  }, [])

  useEffect(() => { storage.setFolder(folder) }, [folder])
  useEffect(() => { storage.setFile(selectedFile) }, [selectedFile])

  useEffect(() => {
    if (!user || !repo) return
    changesRef.current = localChanges.get(repo) || empty()
    setChanges(changesRef.current)
    setRemote(null)
    load()
  }, [user, repo])

  const virtual = useMemo(
    () => remote ? virtualFiles(remote.files, changes) : {},
    [remote, changes]
  )
  const changeCount = count(changes)
  const changed = useMemo(() => changedPaths(changes), [changes])

  function updateChanges(fn) {
    const next = fn(changesRef.current)
    changesRef.current = next
    localChanges.set(repo, next)
    setChanges(next)
  }

  async function pull() {
    const latest = await getTree()
    setRemote(latest)
    return latest
  }

  async function load() {
    setRemoteError('')
    try {
      const latest = await pull()
      await migrateDrafts(latest)
      setConflictPaths(conflicts(changesRef.current, latest.files))
    } catch {
      setRemoteError('Failed to load files.')
    }
  }

  // Keep only old drafts that really differ from GitHub
  async function migrateDrafts(latest) {
    for (const [path, content] of Object.entries(legacyDrafts.all())) {
      const file = latest.files[path]
      if (!file) continue
      if (!(path in changesRef.current.edits)) {
        const original = await getBlob(file.sha)
        updateChanges(ch => setEdit(ch, { orig: path, sha: file.sha }, content, original))
      }
      legacyDrafts.clear(path)
    }
  }

  function flash(state) {
    setSyncState(state)
    setTimeout(() => setSyncState('idle'), 2000)
  }

  async function push(latest) {
    const ch = changesRef.current
    if (!count(ch)) return
    await commitTree(latest, treeEntries(ch, latest.files), commitMessage(ch))
    updateChanges(() => empty())
    await pull()
  }

  async function sync() {
    if (syncing) return
    window.dispatchEvent(new Event('folio:flush'))
    setSyncing(true)
    try {
      const latest = await pull()
      const conflicted = conflicts(changesRef.current, latest.files)
      if (conflicted.length) setConflictPaths(conflicted)
      else {
        await push(latest)
        flash('done')
      }
    } catch {
      flash('error')
    }
    setSyncing(false)
  }

  async function pushLocal() {
    setSyncing(true)
    try {
      await push(await pull())
      setConflictPaths([])
      flash('done')
    } catch {
      flash('error')
    }
    setSyncing(false)
  }

  function takeRemote() {
    updateChanges(ch => discard(ch, conflictPaths))
    setConflictPaths([])
  }

  function handleRename(item, name) {
    if (name.includes('/')) return 'Name can\'t contain "/".'
    const parent = item.path.slice(0, item.path.lastIndexOf('/') + 1)
    const to = parent + name + (item.type === 'dir' ? '' : splitName(item.name)[1])
    if (exists(virtual, to)) return 'That name is already taken.'
    updateChanges(ch => rename(ch, virtual, item.path, to, item.type === 'dir'))
    return null
  }

  function handleDelete(item) {
    if (selectedFile === item.path || selectedFile?.startsWith(item.path + '/')) setSelectedFile(null)
    updateChanges(ch => remove(ch, virtual, item.path, item.type === 'dir'))
  }

  async function handleCreated(path) {
    setShowNewFile(false)
    try { await pull() } catch {}
    if (newFileKind === 'note') setSelectedFile(path)
  }

  async function authenticate(token) {
    init(token)
    const u = await getUser()
    storage.setToken(token)
    setUser(u)
  }

  function onRepo(ownerVal, repoVal) {
    const full = `${ownerVal}/${repoVal}`
    storage.setRepo(full)
    setRepoState(full)
  }

  function logout() {
    storage.clearToken()
    storage.clearRepo()
    setUser(null)
    setRepoState(null)
    setSelectedFile(null)
    setFolder('')
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="w-6 h-6 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    )
  }

  if (!user) return <Auth onAuth={authenticate} />
  if (!repo) return <RepoSetup user={user} onRepo={onRepo} onLogout={logout} />

  return (
    <div className="flex flex-col h-full max-w-[680px] mx-auto bg-background">
      <PullToRefresh onRefresh={() => window.location.reload()}>
        {selectedFile && virtual[selectedFile] ? (
          <Editor
            key={selectedFile}
            path={selectedFile}
            entry={virtual[selectedFile]}
            files={virtual}
            edited={changes.edits[virtual[selectedFile].orig]}
            onEdit={(content, original) =>
              updateChanges(ch => setEdit(ch, virtual[selectedFile], content, original))}
            onClose={() => setSelectedFile(null)}
            onHome={() => { setFolder(''); setSelectedFile(null) }}
          />
        ) : (
          <FileBrowser
            path={folder}
            onNavigate={setFolder}
            listDir={dir => listDir(virtual, dir, changed)}
            loading={!remote && !remoteError}
            error={remoteError}
            onRename={handleRename}
            onDelete={handleDelete}
            onMenu={() => setMenuOpen(true)}
            onSelect={setSelectedFile}
            currentPath={selectedFile}
            onNewFile={(f, kind) => { setNewFileFolder(f || ''); setNewFileKind(kind); setShowNewFile(true) }}
            repo={repo}
          />
        )}
      </PullToRefresh>
      <div
        className="flex items-center justify-end px-4 py-3 border-t border-border bg-background shrink-0"
        style={{ paddingBottom: 'calc(0.75rem + var(--safe-bottom))' }}
      >
        <Button
          onClick={sync}
          disabled={syncing}
          variant={syncState === 'error' ? 'destructive' : 'default'}
          className="gap-2"
        >
          {syncState === 'done' ? <Check className="size-4" />
            : syncState === 'error' ? <X className="size-4" />
            : <ArrowsClockwise className={cn('size-4', syncing && 'animate-spin')} />}
          {syncState === 'done' ? 'Synced' : syncState === 'error' ? 'Failed' : 'Sync'}
          {changeCount > 0 && syncState === 'idle' && !syncing && (
            <span className="bg-primary-foreground text-primary rounded-full text-[11px] min-w-5 h-5 px-1 flex items-center justify-center font-semibold">
              {changeCount}
            </span>
          )}
        </Button>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}>
          <SheetHeader>
            <SheetTitle>@{user.login}</SheetTitle>
            <SheetDescription>{repo}</SheetDescription>
          </SheetHeader>
          <div className="px-2">
            <Button variant="ghost" onClick={toggleTheme} className="w-full justify-start gap-3 px-2">
              {theme === 'dark' ? <><Sun className="size-5" /> Light theme</> : <><Moon className="size-5" /> Dark theme</>}
            </Button>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => { setMenuOpen(false); logout() }}>Sign out</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {showNewFile && (
        <NewFileModal
          folder={newFileFolder}
          kind={newFileKind}
          onCreated={handleCreated}
          onClose={() => setShowNewFile(false)}
        />
      )}

      {conflictPaths.length > 0 && (
        <ConflictModal
          paths={conflictPaths}
          busy={syncing}
          onPushLocal={pushLocal}
          onUseRemote={takeRemote}
          onClose={() => setConflictPaths([])}
        />
      )}
    </div>
  )
}
