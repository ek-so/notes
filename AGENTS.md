# Folio — Agent Instructions

## How to work with me
- **Ask before building.** Clarify scope before writing code. You may suggest, but never implement more than what was explicitly confirmed.
- **Be concise.** Short sentences. No filler. No summaries of what you just did.
- **Push to `main` directly.** No pull requests.

React + Vite PWA. Reads/writes markdown files from any GitHub repo via the GitHub REST API.

## Design system — shadcn/ui + Tailwind v4

**Stack:** shadcn/ui (new-york style) · Tailwind CSS v4 · Radix UI primitives · lucide-react icons

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
| `bg-primary` / `text-primary` | Accent purple (`#7c6af7`) |
| `bg-destructive` | Errors / danger (`#e05252`) |
| `--radius` | `0.75rem` base radius |

Legacy variables `--bg`, `--bg2`, `--safe-top`, `--safe-bottom` etc. remain in `src/index.css` for the hand-rolled components in `src/App.css` — migrate them to Tailwind as components are rebuilt.

## Architecture

- `src/lib/github.js` — all GitHub API calls. `init(token)` sets up Octokit; `setRepo(owner, repo)` sets target repo.
- `src/lib/storage.js` — localStorage wrapper for token + repo.
- App flow: **Auth → RepoSetup → FileBrowser / Editor**
- Token and repo are always user-supplied at runtime. Nothing is hardcoded.
