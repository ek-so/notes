import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'

// Top bar shared by every screen. With onBack it's an inner page (← title),
// with PathBreadcrumbs at the top of the content for jumping further up.
// Without it, the home screen: `start` (the account menu) fills the left.
export default function Header({ title, changed, onBack, start, children }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
      {onBack ? (
        <>
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back" className="shrink-0">
            <ArrowLeft />
          </Button>
          <span className="flex-1 truncate min-w-0 text-lg font-semibold">
            {title}
            {changed && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />}
          </span>
        </>
      ) : start}
      {children}
    </div>
  )
}
