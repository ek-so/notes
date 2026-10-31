import { useState } from 'react'
import { DotsThree, PencilSimple, Trash } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx'
import RenameModal from './RenameModal.jsx'
import DeleteModal from './DeleteModal.jsx'

// ⋯ menu with Rename / Delete for a file or folder ({ name, path, type }),
// used on list rows and in the header of the open folder or note.
// onRename(item, name) returns an error message or null.
export default function ItemMenu({ item, onRename, onDelete }) {
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More actions" className="shrink-0 text-muted-foreground hover:bg-transparent hover:text-foreground">
            <DotsThree weight="bold" size={20} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={e => e.preventDefault()}>
          <DropdownMenuItem onSelect={() => setRenaming(true)}><PencilSimple /> Rename</DropdownMenuItem>
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
    </>
  )
}
