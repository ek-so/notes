import { List, Sun, Moon, Monitor, Gear, SignOut } from '@phosphor-icons/react'
import { Button } from './ui/button.jsx'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from './ui/dropdown-menu.jsx'
import { cn } from '@/lib/utils.js'

const THEMES = [['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]]

// Home header's left side: ☰ owner / repo, opening the account popover.
// The account is shown in Settings; the header already names the owner.
export default function AccountMenu({ repo, theme, onTheme, onSettings, onSignOut }) {
  const [owner, name] = repo.split('/')
  return (
    <DropdownMenu>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Account and settings" className="shrink-0 -ml-2">
            <List />
          </Button>
        </DropdownMenuTrigger>
        <span className="truncate text-xl select-none">
          <span className="text-muted-foreground">{owner} / </span>
          <span className="font-bold">{name}</span>
        </span>
      </div>
      <DropdownMenuContent align="start" className="w-64" onCloseAutoFocus={e => e.preventDefault()}>
        {/* Radio items: arrow keys reach them; selecting keeps the menu open */}
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={onTheme}
          aria-label="Theme"
          className="flex h-11 gap-1 rounded-lg bg-segment p-1 mx-1 my-1"
        >
          {THEMES.map(([value, label, Icon]) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              aria-label={label}
              onSelect={e => e.preventDefault()}
              className={cn(
                'flex h-9 flex-1 items-center justify-center rounded-sm transition-colors [&_svg]:size-4',
                'data-[highlighted]:ring-1 data-[highlighted]:ring-ring',
                theme === value ? 'bg-segment-active text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            ><Icon /></DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuItem onSelect={onSettings}><Gear /> Settings</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onSignOut}><SignOut /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
