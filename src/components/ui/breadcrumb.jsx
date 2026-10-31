import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { CaretRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

function Breadcrumb(props) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

function BreadcrumbList({ className, ...props }) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn('text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words', className)}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }) {
  return <li data-slot="breadcrumb-item" className={cn('inline-flex items-center gap-1.5', className)} {...props} />
}

function BreadcrumbLink({ asChild, className, ...props }) {
  const Comp = asChild ? Slot : 'a'
  return (
    <Comp data-slot="breadcrumb-link" className={cn('inline-flex min-h-11 items-center hover:text-foreground transition-colors', className)} {...props} />
  )
}

function BreadcrumbPage({ className, ...props }) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('inline-flex min-h-11 items-center text-foreground font-normal', className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({ children, className, ...props }) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn('[&>svg]:size-4', className)}
      {...props}
    >
      {children ?? <CaretRight />}
    </li>
  )
}

export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator }
