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

const repoImages = (html, notePath) => {
  const tpl = document.createElement('template')
  tpl.innerHTML = html
  return [tpl, [...tpl.content.querySelectorAll('img')]
    .map(img => [img, resolveImage(notePath, img.getAttribute('src'))])
    .filter(([, repoPath]) => repoPath !== null)]
}

// Rendered note. Tapping text (not links or images) calls onTap with the
// markdown offset of the tapped word. On mount, scrolls the block holding
// `scrollTo` (a markdown offset) into view.
export default function MarkdownPreview({ content, path, files, scrollTo, onTap }) {
  const ref = useRef()

  const [html, imagePaths] = useMemo(() => {
    const [tpl, imgs] = repoImages(DOMPurify.sanitize(renderBlocks(content)), path)
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
    <div
      ref={ref}
      className="editor-preview flex-1 px-5 py-4 overflow-y-auto text-base leading-relaxed touch-manipulation [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: withImages || '<p class="text-muted-foreground italic">Nothing to preview yet.</p>' }}
    />
  )
}
