import { List, Sun, Moon, Monitor, Gear, SignOut } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from './ui/dropdown-menu.jsx'
import { cn } from '@/lib/utils.js'

const THEMES = [['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]]

// Home header's left side: ☰ owner / repo, opening the account popover.
// The account is shown in Settings; the header already names the owner.
export default function AccountMenu({ repo, theme, onTheme, onSettings, onSignOut }) {
  const [owner, name] = repo.split('/')
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex-1 min-w-0 justify-start gap-3 -ml-2 px-2 font-normal" aria-label="Account and settings">
          <List />
          <span className="truncate text-xl">
            <span className="text-muted-foreground">{owner} / </span>
            <span className="font-bold">{name}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64" onCloseAutoFocus={e => e.preventDefault()}>
        <div className="flex h-11 gap-1 rounded-lg bg-segment p-1 mx-1 my-1" role="radiogroup" aria-label="Theme">
          {THEMES.map(([value, label, Icon]) => (
            <Button
              key={value}
              variant="ghost"
              size="icon"
              role="radio"
              aria-checked={theme === value}
              aria-label={label}
              onClick={() => onTheme(value)}
              className={cn('h-9 flex-1 rounded-sm', theme === value ? 'bg-segment-active text-foreground shadow-sm hover:bg-segment-active' : 'text-muted-foreground')}
            ><Icon /></Button>
          ))}
        </div>
        <DropdownMenuItem onSelect={onSettings}><Gear /> Settings</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onSignOut}><SignOut /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
