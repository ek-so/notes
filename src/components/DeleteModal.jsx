import { Button } from './ui/button.jsx'

export default function DeleteModal({ item, onDelete, onClose }) {
  const isDir = item.type === 'dir'
  const name = item.name.replace(/\.md$/, '')

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[680px] bg-card rounded-t-2xl p-6 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h2 className="text-lg font-bold truncate">Delete {isDir ? 'folder' : 'note'} “{name}”?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isDir ? 'Everything inside it will be deleted too. ' : ''}It's removed from GitHub when you sync.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" className="flex-1" onClick={onDelete}>Delete</Button>
        </div>
      </div>
    </div>
  )
}
