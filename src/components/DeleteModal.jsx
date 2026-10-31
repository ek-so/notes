import { Button } from './ui/button.jsx'
import BottomSheet from './BottomSheet.jsx'

export default function DeleteModal({ item, onDelete, onClose }) {
  const isDir = item.type === 'dir'
  const kind = isDir ? 'folder' : item.name.endsWith('.md') ? 'note' : 'file'

  return (
    <BottomSheet
      title={`Delete ${kind} “${item.name}”?`}
      description={`${isDir ? 'Everything inside it will be deleted too. ' : ''}It's removed from GitHub when you sync.`}
      onClose={onClose}
    >
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="destructive" onClick={onDelete}>Delete</Button>
      </div>
    </BottomSheet>
  )
}
