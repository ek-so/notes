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
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant="destructive" className="flex-1" onClick={onSignOut}>Sign out</Button>
      </div>
    </BottomSheet>
  )
}
