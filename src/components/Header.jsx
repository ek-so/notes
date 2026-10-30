import { House, ArrowLeft, List } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import { cn } from '@/lib/utils.js'

// Top bar shared by every screen. With onBack it's an inner page
// (⌂ | ← title); without it, the home screen (☰ title).
export default function Header({ title, changed, onMenu, onHome, onBack, children }) {
  const inner = Boolean(onBack)
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
      {inner ? (
        <>
          <Button variant="ghost" size="icon" onClick={onHome} aria-label="Home" className="shrink-0">
            <House className="size-5" />
          </Button>
          <div className="h-5 w-px bg-border shrink-0" />
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back" className="shrink-0">
            <ArrowLeft className="size-5" />
          </Button>
        </>
      ) : (
        <Button variant="ghost" size="icon" onClick={onMenu} aria-label="Menu" className="shrink-0">
          <List className="size-5" />
        </Button>
      )}
      <span className={cn('flex-1 truncate min-w-0', inner ? 'text-lg font-semibold' : 'text-xl font-bold')}>
        {title}
        {changed && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />}
      </span>
      {children}
    </div>
  )
}
