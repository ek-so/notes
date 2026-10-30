import { useState, useEffect } from 'react'
import Auth from './components/Auth.jsx'
import RepoSetup from './components/RepoSetup.jsx'
import FileBrowser from './components/FileBrowser.jsx'
import Editor from './components/Editor.jsx'
import NewFileModal from './components/NewFileModal.jsx'
import { init, setRepo, getUser, getFile, saveFile } from './lib/github.js'
import { storage, drafts } from './lib/storage.js'

function getEffectiveTheme() {
  const saved = storage.getTheme()
  if (saved) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}
import { Button } from './components/ui/button.jsx'
import { cn } from '@/lib/utils.js'

export default function App() {
  const [user, setUser] = useState(null)
  const [repo, setRepoState] = useState(null)
  const [ready, setReady] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [newFileFolder, setNewFileFolder] = useState(null)
  const [showNewFile, setShowNewFile] = useState(false)
  const [draftCount, setDraftCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
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
    setDraftCount(drafts.count())
  }, [])

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
  }

  function handleEditorClose() {
    setSelectedFile(null)
    setDraftCount(drafts.count())
  }

  async function syncAll() {
    const all = drafts.all()
    const entries = Object.entries(all)
    if (!entries.length) return
    setSyncing(true)
    let errors = 0
    for (const [draftPath, content] of entries) {
      try {
        const { sha } = await getFile(draftPath)
        await saveFile(draftPath, content, sha)
        drafts.clear(draftPath)
      } catch {
        errors++
      }
    }
    setSyncing(false)
    setDraftCount(drafts.count())
    setSyncState(errors ? 'error' : 'done')
    setTimeout(() => setSyncState('idle'), 2000)
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
      {selectedFile ? (
        <Editor path={selectedFile} onClose={handleEditorClose} />
      ) : (
        <>
          <FileBrowser
            onSelect={setSelectedFile}
            currentPath={selectedFile}
            onNewFile={f => { setNewFileFolder(f || ''); setShowNewFile(true) }}
            repo={repo}
            draftCount={draftCount}
            onSync={syncAll}
            syncState={syncState}
          />
          <div
            className="flex items-center justify-between px-4 py-3 border-t border-border bg-background shrink-0"
            style={{ paddingBottom: 'calc(0.75rem + var(--safe-bottom))' }}
          >
            <span className="text-sm text-muted-foreground truncate">@{user.login} · {repo}</span>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={syncAll}
                disabled={syncing || draftCount === 0}
                className={cn('gap-1.5 text-muted-foreground',
                  syncState === 'done' && 'text-green-500',
                  syncState === 'error' && 'text-destructive')}
              >
                {syncing ? '…' : syncState === 'done' ? '✓' : syncState === 'error' ? '✗' : 'Sync'}
                {draftCount > 0 && syncState === 'idle' && !syncing && (
                  <span className="bg-primary text-primary-foreground rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-medium">
                    {draftCount}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleTheme} className="text-muted-foreground px-2">
                {theme === 'dark' ? '☀️' : '🌙'}
              </Button>
              <Button variant="outline" size="sm" onClick={logout} className="text-muted-foreground">
                Sign out
              </Button>
            </div>
          </div>
        </>
      )}

      {showNewFile && (
        <NewFileModal
          folder={newFileFolder}
          onCreated={path => { setShowNewFile(false); setSelectedFile(path) }}
          onClose={() => setShowNewFile(false)}
        />
      )}
    </div>
  )
}
