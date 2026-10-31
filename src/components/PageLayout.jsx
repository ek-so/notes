// Shared outer shell for every screen: flex column, fills available space.
// Each screen owns its own scroll wrapper and content area inside children.
export default function PageLayout({ children }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {children}
    </div>
  )
}
