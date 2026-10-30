import { Button } from './ui/button.jsx'

export default function ConflictModal({ paths, busy, onPushLocal, onUseRemote, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[680px] bg-card rounded-t-2xl p-6 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h2 className="text-lg font-bold">Changed on GitHub</h2>
          <p className="text-sm text-muted-foreground mt-1">
            These files changed remotely while you had local changes to them.
          </p>
        </div>
        <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {paths.map(p => (
            <li key={p} className="text-sm font-mono truncate">{p}</li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <Button onClick={onPushLocal} disabled={busy}>Push local (overwrite GitHub)</Button>
          <Button variant="secondary" onClick={onUseRemote} disabled={busy}>Use remote (discard my changes)</Button>
        </div>
      </div>
    </div>
  )
}
