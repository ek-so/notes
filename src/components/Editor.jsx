import { useState, useEffect, useRef } from 'react'
import { getFile, saveFile } from '../lib/github.js'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ breaks: true, gfm: true })

export default function Editor({ path, onClose }) {
  const [content, setContent] = useState('')
  const [sha, setSha] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const [mode, setMode] = useState('edit')
  const textareaRef = useRef()

  useEffect(() => { load() }, [path])

  useEffect(() => {
    if (mode === 'edit' && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [mode])

  async function load() {
    setLoading(true)
    try {
      const result = await getFile(path)
      setContent(result.content)
      setSha(result.sha)
    } catch {
      setContent('')
    }
    setLoading(false)
  }

  async function save() {
    if (saving) return
    setSaving(true)
    setSaveState('saving')
    try {
      await saveFile(path, content, sha)
      const refreshed = await getFile(path)
      setSha(refreshed.sha)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
    setSaving(false)
  }

  const fileName = path.split('/').pop().replace(/\.md$/, '')
  const preview = DOMPurify.sanitize(marked.parse(content))

  if (loading) {
    return (
      <div className="editor">
        <div className="editor-header">
          <button className="icon-btn" onClick={onClose}>←</button>
          <span className="editor-title">Loading…</span>
        </div>
        <div className="loading"><span className="spinner" /></div>
      </div>
    )
  }

  return (
    <div className="editor">
      <div className="editor-header">
        <button className="icon-btn" onClick={onClose}>←</button>
        <span className="editor-title">{fileName}</span>
        <div className="editor-toolbar">
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === 'edit' ? 'active' : ''}`}
              onClick={() => setMode('edit')}
            >Edit</button>
            <button
              className={`mode-btn ${mode === 'preview' ? 'active' : ''}`}
              onClick={() => setMode('preview')}
            >Preview</button>
          </div>
          <button
            className={`save-btn save-${saveState}`}
            onClick={save}
            disabled={saving}
          >
            {saveState === 'saving' && '…'}
            {saveState === 'saved' && '✓'}
            {saveState === 'error' && '✗'}
            {saveState === 'idle' && 'Save'}
          </button>
        </div>
      </div>

      {mode === 'edit' ? (
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={content}
          onChange={e => setContent(e.target.value)}
          spellCheck="true"
          autoCorrect="on"
          placeholder="Start writing…"
        />
      ) : (
        <div
          className="editor-preview"
          dangerouslySetInnerHTML={{ __html: preview || '<p class="empty-preview">Nothing to preview yet.</p>' }}
        />
      )}
    </div>
  )
}
