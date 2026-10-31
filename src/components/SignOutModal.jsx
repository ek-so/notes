import { Button } from './ui/button.jsx'
import BottomSheet from './BottomSheet.jsx'

// Confirms signing out when there are unsynced changes, which it deletes.
export default function SignOutModal({ changeCount, onSignOut, onClose }) {
  return (
    <BottomSheet
      title="Sign out?"
      description={`You have ${changeCount} unsynced change${changeCount === 1 ? '' : 's'}. Signing out deletes them from this device.`}
      onClose={onClose}
    >
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="destructive" onClick={onSignOut}>Sign out</Button>
      </div>
    </BottomSheet>
  )
}
