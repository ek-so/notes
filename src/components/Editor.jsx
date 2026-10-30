import { useState, useEffect, useRef } from 'react'
import { getFile, saveFile } from '../lib/github.js'
import { drafts } from '../lib/storage.js'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Button } from './ui/button.jsx'
import { cn } from '@/lib/utils.js'

marked.setOptions({ breaks: true, gfm: true })

export default function Editor({ path, onClose }) {
  const [content, setContent] = useState('')
  const [sha, setSha] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncState, setSyncState] = useState('idle') // idle | saving | saved | error
  const [hasDraft, setHasDraft] = useState(false)
  const [mode, setMode] = useState('edit')
  const textareaRef = useRef()
  const contentRef = useRef(content)

  useEffect(() => { contentRef.current = content }, [content])

  useEffect(() => { load() }, [path])

  useEffect(() => {
    if (mode === 'edit') textareaRef.current?.focus()
  }, [mode])

  // Auto-save to localStorage
  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => {
      drafts.set(path, contentRef.current)
      setHasDraft(true)
    }, 800)
    return () => clearTimeout(timer)
  }, [content, path, loading])

  async function load() {
    setLoading(true)
    try {
      const result = await getFile(path)
      setSha(result.sha)
      const draft = drafts.get(path)
      if (draft !== null) {
        setContent(draft)
        setHasDraft(true)
      } else {
        setContent(result.content)
        setHasDraft(false)
      }
    } catch {
      setContent('')
    }
    setLoading(false)
  }

  async function sync() {
    if (syncing) return
    setSyncing(true)
    setSyncState('saving')
    try {
      const { sha: freshSha } = await getFile(path)
      await saveFile(path, contentRef.current, freshSha)
      setSha(freshSha)
      drafts.clear(path)
      setHasDraft(false)
      setSyncState('saved')
      setTimeout(() => setSyncState('idle'), 2000)
    } catch {
      setSyncState('error')
      setTimeout(() => setSyncState('idle'), 3000)
    }
    setSyncing(false)
  }

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
          {hasDraft && <span className="ml-1.5 text-primary text-xs">●</span>}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-secondary rounded-lg p-0.5">
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
          <Button
            size="sm"
            onClick={sync}
            disabled={syncing}
            className={cn('min-w-[52px]',
              syncState === 'saved' && 'bg-green-600 hover:bg-green-600',
              syncState === 'error' && 'bg-destructive hover:bg-destructive')}
          >
            {syncState === 'saving' && '…'}
            {syncState === 'saved' && '✓'}
            {syncState === 'error' && '✗'}
            {syncState === 'idle' && 'Sync'}
          </Button>
        </div>
      </div>

      {mode === 'edit' ? (
        <textarea
          ref={textareaRef}
          className="flex-1 w-full px-5 py-4 bg-background text-foreground resize-none outline-none font-mono text-[15px] leading-relaxed"
          style={{ WebkitOverflowScrolling: 'touch' }}
          value={content}
          onChange={e => setContent(e.target.value)}
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
