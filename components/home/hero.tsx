import Link from 'next/link'
import { LiveBadge } from '@/components/live/live-badge'
import { LiveStatus } from '@/components/live/live-status'
import { SearchBar } from '@/components/home/search-bar'

interface HeroProps {
  stats: { total: number; industry: number; visa: number }
  /** Data snapshot time (data/jobs.json generatedAt) for the freshness line. */
  updatedAt: string | null
}

export function Hero({ stats, updatedAt }: HeroProps) {
  const statItems = [
    { label: 'Live roles', value: stats.total },
    { label: 'Industry', value: stats.industry },
    { label: 'Visa sponsored', value: stats.visa },
  ]

  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <div className="hero-sky absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <span className="hero-stars" />
        <span className="hero-meteor" />
        <span className="hero-meteor hero-meteor-delayed" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-16 pb-14 sm:px-6 md:pt-24 md:pb-20 lg:px-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 font-mono text-xs tracking-wider text-white/80 uppercase">
          <LiveBadge />
        </p>

        <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Structural Engineering Industry Jobs{' '}
          <span className="text-accent">in Australia</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-white/80">
          Explore industry civil and structural engineering jobs across Australia — structural, civil, geotechnical, bridge, design and project engineering roles with consultancies, contractors and asset owners.
        </p>

        <div className="mt-10 max-w-5xl">
          <SearchBar />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-white/80">
          <span>Popular:</span>
          <Link
            href="/industry?specialism=structural"
            className="rounded-full border border-white/20 px-3 py-1 transition-colors hover:border-accent hover:text-white"
          >
            Structural Engineers
          </Link>
          <Link
            href="/industry?specialism=geotechnical"
            className="rounded-full border border-white/20 px-3 py-1 transition-colors hover:border-accent hover:text-white"
          >
            Geotechnical Engineers
          </Link>
          <Link
            href="/industry?specialism=water"
            className="rounded-full border border-white/20 px-3 py-1 transition-colors hover:border-accent hover:text-white"
          >
            Water Engineers
          </Link>
          <Link
            href="/industry?specialism=transport"
            className="rounded-full border border-white/20 px-3 py-1 transition-colors hover:border-accent hover:text-white"
          >
            Transport &amp; Roads Engineers
          </Link>
        </div>

        <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/15 bg-white/15 sm:grid-cols-3">
          {statItems.map((item) => (
            <div key={item.label} className="bg-primary/80 px-5 py-4 backdrop-blur">
              <dt className="font-mono text-[11px] tracking-wider text-white/75 uppercase">
                {item.label}
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>

        <LiveStatus updatedAt={updatedAt} />
      </div>
    </section>
  )
}
