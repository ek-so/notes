import { List, Sun, Moon, Monitor, Gear, SignOut } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from './ui/dropdown-menu.jsx'
import { cn } from '@/lib/utils.js'

const THEMES = [['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]]

// Home header's left side: ☰ owner / repo, opening the account popover.
export default function AccountMenu({ login, repo, theme, onTheme, onSettings, onSignOut }) {
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
        <DropdownMenuLabel className="text-xl font-bold truncate">@{login}</DropdownMenuLabel>
        <div className="flex rounded-md bg-secondary mx-1 my-1" role="radiogroup" aria-label="Theme">
          {THEMES.map(([value, label, Icon]) => (
            <Button
              key={value}
              variant="ghost"
              size="icon"
              role="radio"
              aria-checked={theme === value}
              aria-label={label}
              onClick={() => onTheme(value)}
              className={cn('flex-1', theme === value ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : 'text-muted-foreground')}
            ><Icon /></Button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSettings}><Gear /> Settings</DropdownMenuItem>
        <DropdownMenuItem onSelect={onSignOut}><SignOut /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
