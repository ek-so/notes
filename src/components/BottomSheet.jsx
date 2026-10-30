import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet.jsx'

// Bottom sheet dialog used for every prompt in the app. Rendered while
// open; closing (backdrop, Escape, ✕) calls onClose.
export default function BottomSheet({ title, description, onClose, onOpenAutoFocus, children }) {
  return (
    <Sheet open onOpenChange={open => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto w-full max-w-[680px] gap-4 rounded-t-2xl bg-card p-6"
        style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom))' }}
        {...(description ? {} : { 'aria-describedby': undefined })}
        onOpenAutoFocus={onOpenAutoFocus}
      >
        <SheetHeader className="p-0 pr-8">
          <SheetTitle className="text-lg font-bold truncate">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}
