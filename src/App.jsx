import { useState, useEffect } from 'react'
import Auth from './components/Auth.jsx'
import RepoSetup from './components/RepoSetup.jsx'
import FileBrowser from './components/FileBrowser.jsx'
import Editor from './components/Editor.jsx'
import NewFileModal from './components/NewFileModal.jsx'
import { init, setRepo, getUser } from './lib/github.js'
import { storage } from './lib/storage.js'

export default function App() {
  const [user, setUser] = useState(null)
  const [repo, setRepoState] = useState(null)
  const [ready, setReady] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [newFileFolder, setNewFileFolder] = useState(null)
  const [showNewFile, setShowNewFile] = useState(false)

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

  function openNewFile(folder) {
    setNewFileFolder(folder || '')
    setShowNewFile(true)
  }

  function onFileCreated(path) {
    setShowNewFile(false)
    setSelectedFile(path)
  }

  if (!ready) {
    return (
      <div className="splash">
        <span className="spinner" />
      </div>
    )
  }

  if (!user) {
    return <Auth onAuth={authenticate} />
  }

  if (!repo) {
    return <RepoSetup user={user} onRepo={onRepo} onLogout={logout} />
  }

  return (
    <div className="app">
      {selectedFile ? (
        <Editor path={selectedFile} onClose={() => setSelectedFile(null)} />
      ) : (
        <>
          <FileBrowser
            onSelect={setSelectedFile}
            currentPath={selectedFile}
            onNewFile={openNewFile}
            repo={repo}
          />
          <div className="user-bar">
            <span className="user-name">@{user.login} · {repo}</span>
            <button className="logout-btn" onClick={logout}>Sign out</button>
          </div>
        </>
      )}

      {showNewFile && (
        <NewFileModal
          folder={newFileFolder}
          onCreated={onFileCreated}
          onClose={() => setShowNewFile(false)}
        />
      )}
    </div>
  )
}
