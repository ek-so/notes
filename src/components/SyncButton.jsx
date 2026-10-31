import { ArrowsClockwise, Check, X, CloudSlash } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { cn } from '@/lib/utils.js'

const LOOK = {
  idle: { variant: 'default', label: 'Sync' },
  done: { variant: 'success', label: 'Synced', Icon: Check },
  error: { variant: 'destructive', label: 'Failed', Icon: X },
  offline: { variant: 'default', label: 'Offline', Icon: CloudSlash },
}

// Sync button with its outcome (syncState) and the number of local changes.
export default function SyncButton({ syncState, syncing, changeCount, onSync }) {
  const { variant, label, Icon } = LOOK[syncState] || LOOK.idle
  return (
    <Button onClick={onSync} disabled={syncing} variant={variant} className="gap-2">
      {Icon ? <Icon /> : <ArrowsClockwise className={cn(syncing && 'animate-spin')} />}
      {label}
      {changeCount > 0 && syncState === 'idle' && !syncing && (
        <span className="bg-primary-foreground text-primary rounded-full text-[11px] min-w-5 h-5 px-1 flex items-center justify-center font-semibold">
          {changeCount}
        </span>
      )}
    </Button>
  )
}
