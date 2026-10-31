import { useMemo, useEffect, useRef } from 'react'
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

const LONG_WORD = /\S{16,}/g
const BREAK_EVERY = 8

// Long unbroken words (tokens, URLs) in table cells get <wbr> break points,
// so tables fit the screen without splitting short words. <wbr> adds no
// characters, so copied text stays intact.
function breakLongWords(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) {
    if (walker.currentNode.parentElement.closest('td, th') && LONG_WORD.test(walker.currentNode.data)) nodes.push(walker.currentNode)
    LONG_WORD.lastIndex = 0
  }
  for (const node of nodes) {
    const parts = node.data.split(/(\S{16,})/)
    const frag = document.createDocumentFragment()
    for (const part of parts) {
      if (!/^\S{16,}$/.test(part)) {
        if (part) frag.append(part)
        continue
      }
      for (let i = 0; i < part.length; i += BREAK_EVERY) {
        if (i) frag.append(document.createElement('wbr'))
        frag.append(part.slice(i, i + BREAK_EVERY))
      }
    }
    node.replaceWith(frag)
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
export default function MarkdownPreview({ content, path, files, scrollTo, onTap, children }) {
  const ref = useRef()

  const [html, imagePaths] = useMemo(() => {
    const [tpl, imgs] = repoImages(DOMPurify.sanitize(renderBlocks(content)), path)
    breakLongWords(tpl.content)
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
    </div>
  )
}
