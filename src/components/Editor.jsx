import { useState, useEffect, useRef, useMemo } from 'react'
import { flushSync } from 'react-dom'
import { getBlob, getBlobBase64 } from '../lib/github.js'
import DOMPurify from 'dompurify'
import { renderBlocks, tapOffset, resolveImage } from '../lib/markdown.js'
import { Hash, PaintBrush } from '@phosphor-icons/react'
import Header from './Header.jsx'
import PathBreadcrumbs from './PathBreadcrumbs.jsx'
import { cn } from '@/lib/utils.js'

const MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif', bmp: 'image/bmp',
}

// GitHub's version of a note; '' for one created on this device
const fetchOriginal = sha => sha === null ? Promise.resolve('') : getBlob(sha)

const DOUBLE_TAP_MS = 350
const DOUBLE_TAP_PX = 30

// Text node and offset under a screen point
function caretAt(x, y) {
  if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(x, y)
    return r && { node: r.startContainer, offset: r.startOffset }
  }
  const p = document.caretPositionFromPoint?.(x, y)
  return p && { node: p.offsetNode, offset: p.offset }
}

export default function Editor({ path, root, entry, files, edited, onEdit, onClose, onNavigate }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [mode, setMode] = useState('preview')
  const [images, setImages] = useState({}) // repo path -> data URL, or null if unavailable
  const textareaRef = useRef()
  const originalRef = useRef(null)
  const pendingRef = useRef(null)
  const onEditRef = useRef(onEdit)
  const lastTapRef = useRef(null)
  const caretRef = useRef(null) // cursor position to set when switching to edit

  useEffect(() => { onEditRef.current = onEdit }, [onEdit])

  useEffect(() => { load() }, [path])

  useEffect(() => {
    if (mode === 'edit' && caretRef.current === null) textareaRef.current?.focus()
  }, [mode])

  // Report edits after a pause, and flush on close
  useEffect(() => {
    if (pendingRef.current === null) return
    const timer = setTimeout(flush, 400)
    return () => clearTimeout(timer)
  }, [content])

  // Flush on close, before a reload (pull-to-refresh) and before Sync
  useEffect(() => {
    window.addEventListener('pagehide', flush)
    window.addEventListener('folio:flush', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('folio:flush', flush)
      flush()
    }
  }, [])

  // The file changed on GitHub (e.g. after Sync): compare edits against the
  // new version, and show it if nothing is edited locally
  const shaRef = useRef(entry.sha)
  useEffect(() => {
    if (entry.sha === shaRef.current) return
    shaRef.current = entry.sha
    const hasEdit = edited !== undefined
    fetchOriginal(entry.sha).then(original => {
      originalRef.current = original
      if (!hasEdit && pendingRef.current === null) setContent(original)
    }).catch(() => {})
  }, [entry.sha])

  function flush() {
    if (pendingRef.current === null || originalRef.current === null) return
    onEditRef.current(pendingRef.current, originalRef.current)
    pendingRef.current = null
  }

  async function load() {
    setLoading(true)
    try {
      const original = await fetchOriginal(entry.sha)
      originalRef.current = original
      setContent(edited ?? original)
    } catch {
      // Without GitHub's version edits can't be tracked, so don't allow any
      setLoadError(true)
    }
    setLoading(false)
  }

  // Markdown offset for a tap in the preview: the tapped block, at the tapped word
  function sourceOffsetAt(x, y, target) {
    const block = target.closest('[data-src]')
    if (!block) return content.length
    const start = Number(block.dataset.src)
    const raw = content.slice(start, start + Number(block.dataset.len))
    const caret = caretAt(x, y)
    if (!caret || !block.contains(caret.node)) return start
    const before = document.createRange()
    before.setStart(block, 0)
    before.setEnd(caret.node, caret.offset)
    const textAfter = caret.node.nodeType === Node.TEXT_NODE ? caret.node.textContent.slice(caret.offset) : ''
    return start + tapOffset(raw, before.toString(), textAfter)
  }

  // Double-tap in preview switches to markdown with the cursor at that spot.
  // Focus happens inside the tap so mobile keyboards open.
  function handlePreviewClick(e) {
    if (e.target.closest('a, img')) return
    const last = lastTapRef.current
    lastTapRef.current = { time: e.timeStamp, x: e.clientX, y: e.clientY }
    if (!last || e.timeStamp - last.time > DOUBLE_TAP_MS
      || Math.hypot(e.clientX - last.x, e.clientY - last.y) > DOUBLE_TAP_PX) return
    lastTapRef.current = null
    const pos = sourceOffsetAt(e.clientX, e.clientY, e.target)
    caretRef.current = pos
    flushSync(() => setMode('edit'))
    caretRef.current = null
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.setSelectionRange(pos, pos)
    textarea.focus()
  }

  function handleChange(value) {
    pendingRef.current = value
    setContent(value)
  }

  const changed = edited !== undefined
  const fileName = path.split('/').pop().replace(/\.md$/, '')
  // Preview HTML with repo images swapped for loaded data URLs
  const [preview, imagePaths] = useMemo(() => {
    if (mode !== 'preview') return ['', []]
    const tpl = document.createElement('template')
    tpl.innerHTML = DOMPurify.sanitize(renderBlocks(content))
    const paths = []
    for (const img of tpl.content.querySelectorAll('img')) {
      const repoPath = resolveImage(path, img.getAttribute('src'))
      if (repoPath === null) continue
      paths.push(repoPath)
      if (images[repoPath]) img.setAttribute('src', images[repoPath])
      else img.removeAttribute('src')
    }
    return [tpl.innerHTML, paths]
  }, [mode, content, images, path])

  useEffect(() => {
    const missing = [...new Set(imagePaths)].filter(p => !(p in images))
    if (!missing.length) return
    let cancelled = false
    Promise.all(missing.map(async p => {
      const mime = MIME[p.split('.').pop().toLowerCase()]
      if (!files[p]?.sha || !mime) return [p, null]
      try { return [p, `data:${mime};base64,${await getBlobBase64(files[p].sha)}`] } catch { return [p, null] }
    })).then(entries => {
      if (!cancelled) setImages(prev => ({ ...prev, ...Object.fromEntries(entries) }))
    })
    return () => { cancelled = true }
  }, [imagePaths])

  if (loading || loadError) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <Header title={fileName} onBack={onClose} />
        <PathBreadcrumbs root={root} path={path} current={fileName} onNavigate={onNavigate} />
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-border border-t-primary animate-spin" />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-12 px-6">
            Couldn't open this note. It isn't saved on this device yet — connect to the internet and pull to refresh.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header title={fileName} changed={changed} onBack={onClose}>
        <div className="flex bg-secondary rounded-lg p-0.5 shrink-0">
          <button
            className={cn('flex h-10 w-11 items-center justify-center rounded-md transition-colors',
              mode === 'edit' ? 'bg-card text-foreground' : 'text-muted-foreground')}
            onClick={() => setMode('edit')}
            aria-label="Markdown"
            aria-pressed={mode === 'edit'}
          ><Hash className="size-4" /></button>
          <button
            className={cn('flex h-10 w-11 items-center justify-center rounded-md transition-colors',
              mode === 'preview' ? 'bg-card text-foreground' : 'text-muted-foreground')}
            onClick={() => setMode('preview')}
            aria-label="Preview"
            aria-pressed={mode === 'preview'}
          ><PaintBrush className="size-4" /></button>
        </div>
      </Header>
      <PathBreadcrumbs root={root} path={path} current={fileName} onNavigate={onNavigate} />

      {mode === 'edit' ? (
        <textarea
          ref={textareaRef}
          className="flex-1 w-full px-5 py-4 bg-background text-foreground resize-none outline-none font-mono text-base leading-relaxed"
          style={{ WebkitOverflowScrolling: 'touch' }}
          value={content}
          onChange={e => handleChange(e.target.value)}
          spellCheck="true"
          autoCorrect="on"
          placeholder="Start writing…"
        />
      ) : (
        <div
          className="editor-preview flex-1 px-5 py-4 overflow-y-auto text-base leading-relaxed touch-manipulation [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onClick={handlePreviewClick}
          dangerouslySetInnerHTML={{ __html: preview || '<p class="text-muted-foreground italic">Nothing to preview yet.</p>' }}
        />
      )}
    </div>
  )
}
