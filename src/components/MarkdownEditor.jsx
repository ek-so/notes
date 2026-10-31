import { forwardRef, useMemo, useRef } from 'react'
import { highlightMarkdown } from '../lib/markdown.js'
import { cn } from '@/lib/utils.js'

// Shared by the textarea and its styling layer so they line up exactly
const TEXT_LAYOUT = 'w-full h-full px-5 py-4 font-mono text-base leading-relaxed whitespace-pre-wrap break-words'

const DRAG_PX = 10
const LONG_PRESS_MS = 400

// Markdown text box with live styling: a transparent textarea over a styled
// copy of the same text. The ref is the textarea.
//
// Dragging the text while typing hides the keyboard (like iOS Notes) and
// stays here; a long press (text selection) doesn't count. Closing the
// keyboard otherwise (iOS Done, tapping elsewhere, Escape) calls onDone.
const MarkdownEditor = forwardRef(function MarkdownEditor({ content, onChange, onDone }, textareaRef) {
  const highlightRef = useRef()
  const dragRef = useRef(null)
  const keepEditingRef = useRef(false)
  const highlighted = useMemo(() => highlightMarkdown(content), [content])

  function handleTouchStart(e) {
    const focused = document.activeElement === e.currentTarget
    dragRef.current = focused ? { y: e.touches[0].clientY, time: e.timeStamp } : null
  }

  function handleTouchMove(e) {
    const drag = dragRef.current
    if (!drag) return
    if (e.timeStamp - drag.time > LONG_PRESS_MS) {
      dragRef.current = null
    } else if (Math.abs(e.touches[0].clientY - drag.y) > DRAG_PX) {
      dragRef.current = null
      keepEditingRef.current = true
      e.currentTarget.blur()
    }
  }

  function handleBlur() {
    if (keepEditingRef.current) {
      keepEditingRef.current = false
      return
    }
    onDone()
  }

  return (
    // data-no-pull: drags here scroll or hide the keyboard, never refresh
    <div className="relative flex-1 min-h-0 bg-background" data-no-pull>
      <pre
        ref={highlightRef}
        aria-hidden="true"
        className={cn(TEXT_LAYOUT, 'absolute inset-0 overflow-hidden m-0 text-foreground pointer-events-none')}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
      <textarea
        ref={textareaRef}
        className={cn(TEXT_LAYOUT, 'absolute inset-0 overflow-y-auto bg-transparent text-transparent caret-foreground selection:bg-primary/30 resize-none outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden')}
        style={{ WebkitOverflowScrolling: 'touch' }}
        value={content}
        onChange={e => onChange(e.target.value)}
        onScroll={e => { highlightRef.current.scrollTop = e.currentTarget.scrollTop }}
        onBlur={handleBlur}
        onKeyDown={e => e.key === 'Escape' && e.currentTarget.blur()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        spellCheck="true"
        autoCorrect="on"
        placeholder="Start writing…"
      />
    </div>
  )
})

export default MarkdownEditor
