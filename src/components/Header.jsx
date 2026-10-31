import { ArrowLeft, List } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { cn } from '@/lib/utils.js'

// Top bar shared by every screen. With onBack it's an inner page (← title);
// without it, the home screen (☰ title). Inner pages put PathBreadcrumbs
// below it for jumping further up.
export default function Header({ title, changed, onMenu, onBack, children }) {
  const inner = Boolean(onBack)
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={inner ? onBack : onMenu}
        aria-label={inner ? 'Back' : 'Menu'}
        className="shrink-0"
      >
        {inner ? <ArrowLeft /> : <List />}
      </Button>
      <span className={cn('flex-1 truncate min-w-0', inner ? 'text-lg font-semibold' : 'text-xl font-bold')}>
        {title}
        {changed && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />}
      </span>
      {children}
    </div>
  )
}
