import { useState } from 'react'
import { DotsThree, PencilSimple, Trash, Folder } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import RenameModal from './RenameModal.jsx'
import DeleteModal from './DeleteModal.jsx'
import MoveModal from './MoveModal.jsx'

// ⋯ menu with Rename / Move / Delete for a file or folder ({ name, path, type }).
// onRename(item, name) returns an error message or null.
// onMove(item, targetFolder) returns an error message or null.
export default function ItemMenu({ item, onRename, onDelete, onMove, folders }) {
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [moving, setMoving] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost-outline" size="icon" aria-label="More actions" className="shrink-0">
            <DotsThree weight="bold" size={20} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
          <DropdownMenuItem onSelect={() => setRenaming(true)}><PencilSimple /> Rename</DropdownMenuItem>
          {onMove && <DropdownMenuItem onSelect={() => setMoving(true)}><Folder /> Move to…</DropdownMenuItem>}
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}><Trash /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {renaming && (
        <RenameModal
          item={item}
          onRename={name => {
            const err = onRename(item, name)
            if (!err) setRenaming(false)
            return err
          }}
          onClose={() => setRenaming(false)}
        />
      )}

      {deleting && (
        <DeleteModal
          item={item}
          onDelete={() => { setDeleting(false); onDelete(item) }}
          onClose={() => setDeleting(false)}
        />
      )}

      {moving && (
        <MoveModal
          item={item}
          folders={folders || []}
          onMove={onMove}
          onClose={() => setMoving(false)}
        />
      )}
    </>
  )
}
