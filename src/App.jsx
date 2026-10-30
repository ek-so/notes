import { useState, useEffect } from 'react'
import Auth from './components/Auth.jsx'
import FileBrowser from './components/FileBrowser.jsx'
import Editor from './components/Editor.jsx'
import NewFileModal from './components/NewFileModal.jsx'
import { init, getUser } from './lib/github.js'
import { storage } from './lib/storage.js'

export default function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [newFileFolder, setNewFileFolder] = useState(null)
  const [showNewFile, setShowNewFile] = useState(false)

  useEffect(() => {
    const saved = storage.getToken()
    if (saved) {
      authenticate(saved).catch(() => {
        storage.clearToken()
        setReady(true)
      })
    } else {
      setReady(true)
    }
  }, [])

  async function authenticate(token) {
    init(token)
    const u = await getUser()
    storage.setToken(token)
    setUser(u)
    setReady(true)
  }

  function logout() {
    storage.clearToken()
    setUser(null)
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
          />
          <div className="user-bar">
            <span className="user-name">@{user.login}</span>
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
