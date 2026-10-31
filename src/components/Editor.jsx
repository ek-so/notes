import { useState, useRef } from 'react'
import { flushSync } from 'react-dom'
import { Check } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import Header from './Header.jsx'
import ItemMenu from './ItemMenu.jsx'
import PathBreadcrumbs from './PathBreadcrumbs.jsx'
import Spinner from './Spinner.jsx'
import MarkdownPreview from './MarkdownPreview.jsx'
import MarkdownEditor from './MarkdownEditor.jsx'
import { useNote } from '../hooks/useNote.js'
import { displayName } from '../lib/files.js'

// A note: shown as preview; tapping text edits its markdown there. Edits
// save on their own; ✓ / Done only switches back to preview.
export default function Editor({ path, root, entry, files, edited, onEdit, onClose, onNavigate, onRename, onDelete }) {
  const { content, change, loading, loadError } = useNote(entry, edited, onEdit)
  const [mode, setMode] = useState('preview')
  const [editedAt, setEditedAt] = useState(null) // offset to show when back in preview
  const textareaRef = useRef()

  // Inside the tap, so the textarea gets focus and mobile keyboards open
  function startEditing(pos) {
    flushSync(() => setMode('edit'))
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.setSelectionRange(pos, pos)
    textarea.focus()
  }

  function finishEditing() {
    setEditedAt(textareaRef.current?.selectionStart ?? null)
    setMode('preview')
  }

  const fileName = displayName(path)
  const breadcrumbs = <PathBreadcrumbs root={root} path={path} current={fileName} onNavigate={onNavigate} />
  const ready = !loading && !loadError

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header title={fileName} changed={ready && edited !== undefined} onBack={onClose}>
        <ItemMenu item={{ name: path.split('/').pop(), path, type: 'file' }} onRename={onRename} onDelete={onDelete} />
        {mode === 'edit' && (
          // For desktop, where there's no keyboard Done
          <Button variant="ghost" size="icon" onClick={finishEditing} aria-label="Done" className="shrink-0">
            <Check />
          </Button>
        )}
      </Header>
      {loading || loadError ? (
        <>
          {breadcrumbs}
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12 px-6">
              Couldn't open this note. It isn't saved on this device yet — connect to the internet and pull to refresh.
            </p>
          )}
        </>
      ) : mode === 'edit' ? (
        // The textarea scrolls on its own, so breadcrumbs can't scroll with it
        <MarkdownEditor ref={textareaRef} content={content} onChange={change} onDone={finishEditing} />
      ) : (
        <MarkdownPreview content={content} path={path} files={files} scrollTo={editedAt} onTap={startEditing}>
          {breadcrumbs}
        </MarkdownPreview>
      )}
    </div>
  )
}
