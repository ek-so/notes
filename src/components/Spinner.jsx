import { cn } from '@/lib/utils.js'

// Loading indicator. `spinning={false}` shows it still (e.g. while pulling).
export default function Spinner({ spinning = true, className, style }) {
  return (
    <div
      className={cn('size-6 rounded-full border-2 border-border border-t-primary', spinning && 'animate-spin', className)}
      style={style}
    />
  )
}
