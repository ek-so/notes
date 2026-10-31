import { Fragment } from 'react'
import { House } from '@phosphor-icons/react'
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from './ui/breadcrumb.jsx'

// Breadcrumbs in the fixed header. Every level but the last is a link.
// `current` overrides the last crumb's name (used in Editor for the display name).
// `changed` shows an unsaved-changes dot on the last crumb.
export default function PathBreadcrumbs({ root, path, current, changed, onNavigate }) {
  const parts = path.split('/').filter(Boolean)
  const crumbs = [
    { name: root, path: '' },
    ...parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') })),
  ]
  if (current) crumbs[crumbs.length - 1].name = current

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap text-base">
        {crumbs.map((crumb, i) => (
          <Fragment key={crumb.path}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage>
                  {crumb.name}
                  {changed && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <button onClick={() => onNavigate(crumb.path)}>
                    <span className="flex items-center gap-1 max-w-40">
                      {i === 0 && <House className="size-4 shrink-0" />}
                      <span className={`truncate${i === 0 ? ' font-semibold' : ''}`}>{crumb.name}</span>
                    </span>
                  </button>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
