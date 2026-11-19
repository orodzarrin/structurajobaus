import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { getCountries, getJobCounts } from '@/lib/jobs'

export const metadata: Metadata = {
  title: 'Civil Engineering Jobs by Country',
  description:
    'Browse industry civil engineering jobs by country, then by city. Every listed country is selectable, even where no roles have arrived yet. Counts come from the live job data — a new country appears here automatically when jobs from elsewhere arrive.',
  alternates: { canonical: '/countries' },
}

export default async function CountriesPage() {
  const counts = await getJobCounts()
  const countries = getCountries()
  return (
    <>
      <PageHeader
        eyebrow="Browse by country"
        title="Civil engineering jobs by country"
        description="Pick a country to see its cities and open roles — every country on the list is selectable, even where no roles have arrived yet. Counts come from the live job data, so a new country shows up here as soon as jobs from there arrive."
        breadcrumbs={[{ label: 'Countries', href: '/countries' }]}
      />
      <section aria-labelledby="browse-countries" className="py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs font-medium tracking-wider text-accent uppercase">
            Browse by country
          </p>
          <h2
            id="browse-countries"
            className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl"
          >
            Where the jobs are
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <li>
              <Link
                href="/industry"
                className="group relative flex h-full flex-col overflow-hidden rounded-lg border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                      Everything
                    </p>
                    <h3 className="mt-0.5 text-base font-semibold">All countries</h3>
                  </div>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  Every open role on the board, in every country, together.
                </p>
                <p className="mt-3 font-mono text-xs tabular-nums">
                  <span>{counts.total}</span> <span className="text-muted-foreground">open roles</span>
                </p>
              </Link>
            </li>
            {countries.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={`/countries/${entry.slug}`}
                  className={
                    entry.count > 0
                      ? 'group relative flex h-full flex-col overflow-hidden rounded-lg border bg-primary p-4 text-primary-foreground transition-colors hover:bg-primary/95'
                      : 'group relative flex h-full flex-col overflow-hidden rounded-lg border bg-card p-4 transition-colors hover:border-primary/40'
                  }
                >
                  <div
                    className="blueprint-grid absolute inset-0 opacity-60"
                    aria-hidden="true"
                  />
                  <div className="relative flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-[11px] tracking-wider text-accent uppercase">Country</p>
                      <h3 className="mt-0.5 text-base font-semibold">{entry.country}</h3>
                    </div>
                    <ArrowUpRight
                      className={
                        entry.count > 0
                          ? 'size-4 shrink-0 text-white/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent'
                          : 'size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent'
                      }
                      aria-hidden="true"
                    />
                  </div>
                  <p
                    className={
                      entry.count > 0
                        ? 'relative mt-2 line-clamp-2 text-xs leading-relaxed text-white/70'
                        : 'relative mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground'
                    }
                  >
                    {entry.count > 0
                      ? `Civil engineering roles in ${entry.country} — pick a city to narrow it down.`
                      : `No open roles in ${entry.country} yet — new roles will appear here as soon as they arrive.`}
                  </p>
                  <p className="relative mt-3 font-mono text-xs tabular-nums">
                    <span className={entry.count > 0 ? 'text-white' : ''}>{entry.count}</span>{' '}
                    <span className={entry.count > 0 ? 'text-white/60' : 'text-muted-foreground'}>
                      open roles
                    </span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
