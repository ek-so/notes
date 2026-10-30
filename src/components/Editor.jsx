import { useState, useEffect, useRef, useMemo } from 'react'
import { getBlob, getBlobBase64 } from '../lib/github.js'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Hash, PaintBrush } from '@phosphor-icons/react'
import Header from './Header.jsx'
import { cn } from '@/lib/utils.js'

marked.setOptions({ breaks: true, gfm: true })

const MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif', bmp: 'image/bmp',
}

// Repo path for a relative image src in the note at `notePath`, or null for
// external URLs.
function resolveImage(notePath, src) {
  if (!src || /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(src)) return null
  let rel
  try { rel = decodeURI(src.split(/[?#]/)[0]) } catch { return null }
  const parts = rel.startsWith('/') ? [] : notePath.split('/').slice(0, -1)
  for (const seg of rel.split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') parts.pop()
    else parts.push(seg)
  }
  return parts.join('/')
}

// GitHub's version of a note; '' for one created on this device
const fetchOriginal = sha => sha === null ? Promise.resolve('') : getBlob(sha)

export default function Editor({ path, entry, files, edited, onEdit, onClose, onHome }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [mode, setMode] = useState('preview')
  const [images, setImages] = useState({}) // repo path -> data URL, or null if unavailable
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
    tpl.innerHTML = DOMPurify.sanitize(marked.parse(content))
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
        <Header title={fileName} onHome={onHome} onBack={onClose} />
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
      <Header title={fileName} changed={changed} onHome={onHome} onBack={onClose}>
        <div className="flex bg-secondary rounded-lg p-0.5 shrink-0">
          <button
            className={cn('px-2.5 py-1.5 rounded-md transition-colors',
              mode === 'edit' ? 'bg-card text-foreground' : 'text-muted-foreground')}
            onClick={() => setMode('edit')}
            aria-label="Markdown"
            aria-pressed={mode === 'edit'}
          ><Hash className="size-4" /></button>
          <button
            className={cn('px-2.5 py-1.5 rounded-md transition-colors',
              mode === 'preview' ? 'bg-card text-foreground' : 'text-muted-foreground')}
            onClick={() => setMode('preview')}
            aria-label="Preview"
            aria-pressed={mode === 'preview'}
          ><PaintBrush className="size-4" /></button>
        </div>
      </Header>

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
          className="editor-preview flex-1 px-5 py-4 overflow-y-auto text-base leading-relaxed [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md"
          style={{ WebkitOverflowScrolling: 'touch' }}
          dangerouslySetInnerHTML={{ __html: preview || '<p class="text-muted-foreground italic">Nothing to preview yet.</p>' }}
        />
      )}
    </div>
  )
}
