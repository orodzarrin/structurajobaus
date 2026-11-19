import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2.5', className)} aria-label="SE Jobs Australia home">
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M2 19h20M4 19V9l8-5 8 5v10M4 9l8 5 8-5M12 14v5" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn('text-base font-semibold tracking-tight', inverted ? 'text-white' : 'text-foreground')}>
          SE Jobs <span className="text-accent">Australia</span>
        </span>
      </span>
    </Link>
  )
}
