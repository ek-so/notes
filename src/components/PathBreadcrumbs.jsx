import { Fragment } from 'react'
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from './ui/breadcrumb.jsx'

// Home › folder › … › current, at the top of inner screens' scrolling
// content. Every level but the last is a link to that folder ('' = home).
// Lines are 24px apart; links keep a 44px tap area (see ui/breadcrumb).
export default function PathBreadcrumbs({ root, path, current, onNavigate }) {
  const parts = path.split('/').filter(Boolean)
  const crumbs = [
    { name: root, path: '' },
    ...parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') })),
  ]
  if (current) crumbs[crumbs.length - 1].name = current

  return (
    <Breadcrumb className="px-4 py-2.5">
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <Fragment key={crumb.path}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <button onClick={() => onNavigate(crumb.path)}>
                    <span className="block max-w-40 truncate">{crumb.name}</span>
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
