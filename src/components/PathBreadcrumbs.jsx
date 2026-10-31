import { Fragment } from 'react'
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from './ui/breadcrumb.jsx'

// Home › folder › … › current, under the Header of inner screens. Every
// level but the last is a link to that folder ('' = home).
export default function PathBreadcrumbs({ root, path, current, onNavigate }) {
  const parts = path.split('/').filter(Boolean)
  const crumbs = [
    { name: root, path: '' },
    ...parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') })),
  ]
  if (current) crumbs[crumbs.length - 1].name = current

  return (
    <Breadcrumb className="px-4">
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <Fragment key={crumb.path}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <button onClick={() => onNavigate(crumb.path)}>{crumb.name}</button>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
