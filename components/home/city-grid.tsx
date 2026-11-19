import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { CITIES } from '@/lib/taxonomy'

export function CityGrid({
  counts,
  cities = CITIES,
  eyebrow = 'Browse by city',
  heading = 'Structural engineering jobs across Australia',
  headingLevel = 'h2',
}: {
  counts: Record<string, number>
  /** Subset to show — e.g. only one country's cities. Defaults to all hubs. */
  cities?: typeof CITIES
  eyebrow?: string
  heading?: string
  headingLevel?: 'h2' | 'h1'
}) {
  const Heading = headingLevel
  return (
    <section aria-labelledby="browse-cities" className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-xs font-medium tracking-wider text-accent uppercase">{eyebrow}</p>
        <Heading id="browse-cities" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {heading}
        </Heading>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <li key={city.slug}>
              <Link
                href={`/cities/${city.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-lg border bg-primary p-6 text-primary-foreground transition-colors hover:bg-primary/95"
              >
                <div className="blueprint-grid absolute inset-0 opacity-60" aria-hidden="true" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs tracking-wider text-accent uppercase">{city.state}</p>
                    <h3 className="mt-1 text-xl font-semibold">{city.name}</h3>
                  </div>
                  <ArrowUpRight
                    className="size-5 text-white/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
                    aria-hidden="true"
                  />
                </div>
                <p className="relative mt-3 line-clamp-2 text-sm leading-relaxed text-white/70">{city.description}</p>
                <p className="relative mt-5 font-mono text-sm tabular-nums">
                  <span className="text-white">{counts[city.slug] ?? 0}</span>{' '}
                  <span className="text-white/60">open roles</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
