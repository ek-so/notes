import Header from './Header.jsx'

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3 border-b border-border">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-base break-all">{children}</span>
    </div>
  )
}

// Settings page. Read-only for now; the place for future options.
export default function Settings({ login, repo, onBack }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header title="Settings" onBack={onBack} />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <Row label="Signed in as">@{login}</Row>
        <Row label="Repository">{repo}</Row>
        <p className="px-4 py-3 text-sm text-muted-foreground">
          To switch account or repository, sign out and connect again. Use a fine-grained GitHub token
          limited to your notes repo, with Contents: Read and write.
        </p>
      </div>
    </div>
  )
}
