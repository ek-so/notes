import { ArrowUp, ArrowDown, Check, X, CloudSlash } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { cn } from '@/lib/utils.js'

const LOOK = {
  idle: { variant: 'default', label: 'Sync' },
  done: { variant: 'success', label: 'Synced', Icon: Check },
  error: { variant: 'destructive', label: 'Failed', Icon: X },
  offline: { variant: 'default', label: 'Offline', Icon: CloudSlash },
}

function Badge({ children, className }) {
  return (
    <span className={cn(
      'bg-primary-foreground text-primary rounded-full text-[11px] h-5 px-1.5',
      'flex items-center justify-center font-semibold gap-0.5',
      className,
    )}>
      {children}
    </span>
  )
}

function SplitBadge({ count }) {
  return (
    <span className="flex items-center bg-primary-foreground text-primary rounded-full text-[11px] h-5 font-semibold overflow-hidden">
      <span className="flex items-center gap-0.5 px-1.5">
        <ArrowUp className="size-3" weight="bold" />
        {count > 1 && count}
      </span>
      <span className="w-px h-3 bg-primary/30 shrink-0" />
      <span className="flex items-center px-1.5">
        <ArrowDown className="size-3" weight="bold" />
      </span>
    </span>
  )
}

// Sync button with directional badges (↑ push, ↓ pull, split for both).
export default function SyncButton({ syncState, syncing, changeCount, remoteAhead, onSync }) {
  const { variant, label, Icon } = LOOK[syncState] || LOOK.idle
  const hasPush = changeCount > 0
  const hasPull = remoteAhead
  const showBadge = syncState === 'idle' && !syncing

  return (
    <Button onClick={onSync} disabled={syncing} variant={variant} className="gap-2">
      {syncing ? (
        <span className="size-4 rounded-full border border-current border-t-transparent animate-spin opacity-60" />
      ) : Icon ? (
        <Icon />
      ) : null}
      {label}
      {showBadge && hasPush && hasPull && <SplitBadge count={changeCount} />}
      {showBadge && hasPush && !hasPull && (
        <Badge>
          <ArrowUp className="size-3" weight="bold" />
          {changeCount > 1 && changeCount}
        </Badge>
      )}
      {showBadge && !hasPush && hasPull && (
        <Badge>
          <ArrowDown className="size-3" weight="bold" />
        </Badge>
      )}
    </Button>
  )
}
