import { useMemo, useEffect, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { renderBlocks, tapOffset, resolveImage } from '../lib/markdown.js'
import { useRepoImages } from '../hooks/useRepoImages.js'

// Text node and offset under a screen point
function caretAt(x, y) {
  if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(x, y)
    return r && { node: r.startContainer, offset: r.startOffset }
  }
  const p = document.caretPositionFromPoint?.(x, y)
  return p && { node: p.offsetNode, offset: p.offset }
}

const LONG_WORD = /(\S{16,})/
const BREAK_EVERY = 8

// Long unbroken words (tokens, URLs) in table cells get <wbr> break points,
// so tables fit the screen without splitting short words. <wbr> adds no
// characters, so copied text stays intact.
function breakLongWords(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (node.parentElement.closest('td, th') && LONG_WORD.test(node.data)) nodes.push(node)
  }
  for (const node of nodes) {
    // split() with a capture group puts the long words at odd indexes
    const parts = node.data.split(LONG_WORD).flatMap((part, i) => {
      if (i % 2 === 0) return part ? [part] : []
      const chunks = part.match(new RegExp(`.{1,${BREAK_EVERY}}`, 'g'))
      return chunks.flatMap((chunk, j) => j ? [document.createElement('wbr'), chunk] : [chunk])
    })
    node.replaceWith(...parts)
  }
}

const repoImages = (html, notePath) => {
  const tpl = document.createElement('template')
  tpl.innerHTML = html
  return [tpl, [...tpl.content.querySelectorAll('img')]
    .map(img => [img, resolveImage(notePath, img.getAttribute('src'))])
    .filter(([, repoPath]) => repoPath !== null)]
}

// Rendered note. Tapping text (not links or images) calls onTap with the
// markdown offset of the tapped word. On mount, scrolls the block holding
// `scrollTo` (a markdown offset) into view. `children` render above the
// note and scroll with it.
export default function MarkdownPreview({ content, path, files, scrollTo, onTap, onOpenFile, onNavigate, children }) {
  const ref = useRef()
  const [brokenTip, setBrokenTip] = useState(null)
  const tipTimer = useRef()
  const linkHandlerRef = useRef()

  const [html, imagePaths] = useMemo(() => {
    const sanitized = DOMPurify.sanitize(renderBlocks(content))
    const tpl = document.createElement('template')
    tpl.innerHTML = sanitized
    // Add ↗ to external links so users see they open a website
    for (const a of tpl.content.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href')
      if (!href || href.startsWith('#')) continue
      if (!resolveImage(path, href)) {
        const s = document.createElement('span')
        s.setAttribute('aria-hidden', 'true')
        s.className = 'text-muted-foreground text-xs'
        s.textContent = ' ↗'
        a.appendChild(s)
      }
    }
    breakLongWords(tpl.content)
    const imgs = [...tpl.content.querySelectorAll('img')]
      .map(img => [img, resolveImage(path, img.getAttribute('src'))])
      .filter(([, repoPath]) => repoPath !== null)
    return [tpl.innerHTML, imgs.map(([, repoPath]) => repoPath)]
  }, [content, path])

  const images = useRepoImages(imagePaths, files)

  // Repo images swapped for loaded data URLs
  const withImages = useMemo(() => {
    const [tpl, imgs] = repoImages(html, path)
    for (const [img, repoPath] of imgs) {
      if (images[repoPath]) img.setAttribute('src', images[repoPath])
      else img.removeAttribute('src')
    }
    return tpl.innerHTML
  }, [html, images, path])

  useEffect(() => {
    if (scrollTo === null || scrollTo === undefined) return
    const block = [...ref.current.querySelectorAll('[data-src]')]
      .find(el => scrollTo < Number(el.dataset.src) + Number(el.dataset.len))
    block?.scrollIntoView({ block: 'center' })
  }, [])

  useEffect(() => () => clearTimeout(tipTimer.current), [])

  // Always up-to-date handler without re-attaching the listener
  linkHandlerRef.current = (e) => {
    const link = e.target.closest('a')
    if (!link || !ref.current?.contains(link)) return
    const href = link.getAttribute('href')
    if (!href || href.startsWith('#')) return
    e.preventDefault()
    const repoPath = resolveImage(path, href)
    if (!repoPath) {
      window.open(href, '_blank', 'noopener,noreferrer')
      return
    }
    // Try exact path, then with .md extension (for links that omit it)
    const target = files[repoPath] ? repoPath : files[repoPath + '.md'] ? repoPath + '.md' : null
    if (target) {
      onOpenFile?.(target)
    } else if (Object.keys(files).some(p => p.startsWith(repoPath + '/'))) {
      onNavigate?.(repoPath)
    } else {
      clearTimeout(tipTimer.current)
      setBrokenTip({ x: e.clientX, y: e.clientY })
      tipTimer.current = setTimeout(() => setBrokenTip(null), 2000)
    }
  }

  // Capture-phase native listener intercepts link clicks before browser navigation
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = (e) => linkHandlerRef.current(e)
    el.addEventListener('click', handler, true)
    return () => el.removeEventListener('click', handler, true)
  }, [])

  // Markdown offset for a tap: the tapped block, at the tapped word
  function offsetAt(x, y, target) {
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

  function handleClick(e) {
    if (e.target.closest('a, img')) return
    onTap(offsetAt(e.clientX, e.clientY, e.target))
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      {children}
      <div
        ref={ref}
        className="editor-preview px-5 py-4 text-base leading-relaxed touch-manipulation [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: withImages || '<p class="text-muted-foreground italic">Nothing to preview yet.</p>' }}
      />
      {brokenTip && (
        <div
          className="fixed z-50 rounded-md border border-border bg-popover text-foreground text-sm px-2 py-1 shadow-md pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{ left: brokenTip.x, top: brokenTip.y - 6 }}
        >
          Link is broken
        </div>
      )}
    </div>
  )
}
