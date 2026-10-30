import { useState, useEffect } from 'react'
import { listContents } from '../lib/github.js'

export default function FileBrowser({ onSelect, currentPath, onNewFile, repo }) {
  const [path, setPath] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    load(path)
  }, [path])

  async function load(p) {
    setLoading(true)
    setError('')
    try {
      const contents = await listContents(p)
      setItems(contents)
    } catch {
      setError('Failed to load files.')
    }
    setLoading(false)
  }

  function navigate(item) {
    if (item.type === 'dir') {
      setBreadcrumbs(prev => [...prev, { name: item.name, path }])
      setPath(item.path)
    } else {
      onSelect(item.path)
    }
  }

  function goBack() {
    const prev = breadcrumbs[breadcrumbs.length - 1]
    setBreadcrumbs(b => b.slice(0, -1))
    setPath(prev.path)
  }

  const repoName = repo ? repo.split('/')[1] : 'Notes'
  const currentFolder = breadcrumbs.length > 0
    ? breadcrumbs[breadcrumbs.length - 1].name
    : repoName

  return (
    <div className="file-browser">
      <div className="browser-header">
        <div className="browser-nav">
          {breadcrumbs.length > 0 && (
            <button className="icon-btn" onClick={goBack} aria-label="Back">←</button>
          )}
          <span className="browser-title">{currentFolder}</span>
        </div>
        <button
          className="icon-btn new-btn"
          onClick={() => onNewFile(path)}
          aria-label="New note"
        >＋</button>
      </div>

      {loading && <div className="loading"><span className="spinner" /></div>}
      {error && <div className="error-msg">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="empty">No notes yet</div>
      )}

      {!loading && (
        <ul className="file-list">
          {items.map(item => (
            <li
              key={item.path}
              className={`file-item ${item.type === 'dir' ? 'folder' : 'note'} ${currentPath === item.path ? 'active' : ''}`}
              onClick={() => navigate(item)}
            >
              <span className="file-icon">{item.type === 'dir' ? '📁' : '📄'}</span>
              <span className="file-name">{item.name.replace(/\.md$/, '')}</span>
              {item.type === 'dir' && <span className="chevron">›</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
