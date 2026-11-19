import { cn } from '@/lib/utils'

/**
 * The live indicator from the reference design: a blinking red dot beside
 * "LIVE INDUSTRY CAREERS", signalling the board refreshes constantly as new
 * roles arrive. The board itself refreshes on the morning ingest; the
 * badge marks the feed as live, not second-by-second.
 */
export function LiveBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative flex size-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75 motion-reduce:animate-none" />
        <span className="relative inline-flex size-2 rounded-full bg-red-500 live-dot-blink" />
      </span>
      <span>LIVE INDUSTRY CAREERS</span>
    </span>
  )
}
