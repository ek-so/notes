# Folio — Agent Instructions

## How to work with me
- **Ask before building.** Clarify scope before writing code. You may suggest, but never implement more than what was explicitly confirmed.
- **Be concise.** Short sentences. No filler. No summaries of what you just did.
- **Push to `main` directly.** No pull requests.

React + Vite PWA. Reads/writes markdown files from any GitHub repo via the GitHub REST API.

## Design system — shadcn/ui + Tailwind v4

**Stack:** shadcn/ui (new-york style) · Tailwind CSS v4 · Radix UI primitives · Phosphor icons (`@phosphor-icons/react`, regular weight; emoji for file/folder icons)

### Rules
- Use shadcn components from `src/components/ui/` for all interactive elements. Add new ones with `npx shadcn@latest add <component>`.
- Use Tailwind utility classes for layout and spacing. Never write custom CSS for things Tailwind covers.
- Use `cn()` from `@/lib/utils` to merge classes conditionally.
- Never hardcode colors — use Tailwind semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, etc.).

### CSS variables (defined in `src/index.css`)

| Tailwind token | Role |
|---|---|
| `bg-background` | Page background (`#0f0f0f`) |
| `bg-card` | Cards, modals (`#1a1a1a`) |
| `bg-secondary` | Hover, subtle fills (`#252525`) |
| `border-border` | Dividers, input borders |
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary / muted text |
| `bg-primary` / `text-primary` | Accent blue |
| `bg-destructive` | Errors / danger (`#e05252`) |
| `--radius` | `0.75rem` base radius |

`--safe-top` / `--safe-bottom` hold the iOS safe-area insets. `src/App.css` only styles the generated markdown preview HTML, using the tokens above.

## Architecture

- `src/lib/github.js` — all GitHub API calls. `init(token)` sets up Octokit; `setRepo(owner, repo)` sets target repo. Blob reads go through the offline cache.
- `src/lib/changes.js` — pure model of local changes (edits, renames, deletes, new files) layered over the remote tree. Covered by `changes.test.js` (`npm test`).
- `src/lib/cache.js` — IndexedDB copies of the last tree and of blobs (by sha) for offline use.
- `src/lib/storage.js` — localStorage/sessionStorage: token, repo, cached user, theme, local changes, open folder/note.
- `src/hooks/` — `useAuth` (token/user/repo), `useRepo` (remote tree, local changes, sync), `useTheme`. `App.jsx` is layout and UI actions.
- Prompts use `BottomSheet` (shadcn Sheet). Pull-to-refresh wraps every screen (`PullToRefresh`).
- Offline: a service worker (vite-plugin-pwa) caches the app; all notes are prefetched to IndexedDB. Every change is local until Sync, which makes one commit.
- App flow: **Auth → RepoSetup → FileBrowser / Editor**
- Token and repo are always user-supplied at runtime. Nothing is hardcoded.
