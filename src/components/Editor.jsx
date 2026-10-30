import { useState, useEffect, useRef } from 'react'
import { getBlob } from '../lib/github.js'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Button } from './ui/button.jsx'
import { cn } from '@/lib/utils.js'

marked.setOptions({ breaks: true, gfm: true })

export default function Editor({ path, entry, edited, onEdit, onClose }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('edit')
  const textareaRef = useRef()
  const originalRef = useRef(null)
  const pendingRef = useRef(null)
  const onEditRef = useRef(onEdit)

  useEffect(() => { onEditRef.current = onEdit }, [onEdit])

  useEffect(() => { load() }, [path])

  useEffect(() => {
    if (mode === 'edit') textareaRef.current?.focus()
  }, [mode])

  // Report edits after a pause, and flush on close
  useEffect(() => {
    if (pendingRef.current === null) return
    const timer = setTimeout(flush, 400)
    return () => clearTimeout(timer)
  }, [content])

  useEffect(() => flush, [])

  function flush() {
    if (pendingRef.current === null || originalRef.current === null) return
    onEditRef.current(pendingRef.current, originalRef.current)
    pendingRef.current = null
  }

  async function load() {
    setLoading(true)
    try {
      const original = await getBlob(entry.sha)
      originalRef.current = original
      setContent(edited ?? original)
    } catch {
      setContent(edited ?? '')
    }
    setLoading(false)
  }

  function handleChange(value) {
    pendingRef.current = value
    setContent(value)
  }

  const changed = edited !== undefined
  const fileName = path.split('/').pop().replace(/\.md$/, '')
  const preview = DOMPurify.sanitize(marked.parse(content))

  if (loading) {
    return (
      <div className="flex flex-col h-full" style={{ paddingTop: 'var(--safe-top)' }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-lg shrink-0">←</Button>
          <span className="text-base font-semibold text-muted-foreground">Loading…</span>
        </div>
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-border border-t-primary animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ paddingTop: 'var(--safe-top)' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-lg shrink-0">←</Button>
        <span className="flex-1 text-base font-semibold truncate min-w-0">
          {fileName}
          {changed && <span className="ml-1.5 text-primary text-xs">●</span>}
        </span>
        <div className="flex bg-secondary rounded-lg p-0.5 shrink-0">
          <button
            className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors',
              mode === 'edit' ? 'bg-card text-foreground' : 'text-muted-foreground')}
            onClick={() => setMode('edit')}
          >Edit</button>
          <button
            className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors',
              mode === 'preview' ? 'bg-card text-foreground' : 'text-muted-foreground')}
            onClick={() => setMode('preview')}
          >Preview</button>
        </div>
      </div>

      {mode === 'edit' ? (
        <textarea
          ref={textareaRef}
          className="flex-1 w-full px-5 py-4 bg-background text-foreground resize-none outline-none font-mono text-[15px] leading-relaxed"
          style={{ WebkitOverflowScrolling: 'touch' }}
          value={content}
          onChange={e => handleChange(e.target.value)}
          spellCheck="true"
          autoCorrect="on"
          placeholder="Start writing…"
        />
      ) : (
        <div
          className="editor-preview flex-1 px-5 py-4 overflow-y-auto text-base leading-relaxed"
          style={{ WebkitOverflowScrolling: 'touch' }}
          dangerouslySetInnerHTML={{ __html: preview || '<p class="empty-preview">Nothing to preview yet.</p>' }}
        />
      )}
    </div>
  )
}
