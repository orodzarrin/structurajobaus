import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CityGrid } from '@/components/home/city-grid'
import { JobsListing } from '@/components/jobs/jobs-listing'
import { PageHeader } from '@/components/page-header'
import { getCountries, getCountryBySlug, getJobCounts, isKnownSector, parseFilters } from '@/lib/jobs'
import { CITIES } from '@/lib/taxonomy'

type Params = Promise<{ country: string }>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

export function generateStaticParams() {
  return getCountries().map((entry) => ({ country: entry.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const entry = getCountryBySlug((await params).country)
  if (!entry) return {}
  return {
    title: `Civil Engineering Jobs in ${entry.country}`,
    description:
      entry.count > 0
        ? `Industry civil engineering jobs in ${entry.country} — ${entry.count} open roles. Pick a city to narrow it down.`
        : `Industry civil engineering jobs in ${entry.country} — no open roles yet. New roles will appear here as soon as they arrive.`,
    alternates: { canonical: `/countries/${entry.slug}` },
  }
}

export default async function CountryPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const entry = getCountryBySlug((await params).country)
  if (!entry) notFound()

  const counts = await getJobCounts()
  const rawParams = await searchParams
  const filters = parseFilters(rawParams)
  const sectorParam = Array.isArray(rawParams.sector) ? rawParams.sector[0] : rawParams.sector
  if (!isKnownSector(sectorParam)) notFound()

  const cities = CITIES.filter((city) => city.country === entry.country)

  return (
    <>
      <PageHeader
        eyebrow={entry.country}
        title={`Civil engineering jobs in ${entry.country}`}
        description={
          entry.count > 0
            ? `${entry.count} open roles in ${entry.country}. Pick a city below, or use the filters to narrow by role, salary and work type.`
            : `No open roles in ${entry.country} yet. New civil engineering roles will show up here as soon as they arrive — or browse all countries to see every open role.`
        }
        breadcrumbs={[
          { label: 'Countries', href: '/countries' },
          { label: entry.country, href: `/countries/${entry.slug}` },
        ]}
      />
      {entry.count === 0 && (
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <p className="rounded-xl border bg-card p-5 text-sm leading-relaxed text-muted-foreground">
            No roles in {entry.country} yet. The board lists civil engineering jobs from
            the feeds it follows, and none from {entry.country} have arrived so far.{' '}
            <Link href="/countries" className="text-primary hover:underline">
              Browse all countries
            </Link>{' '}
            or{' '}
            <Link href="/industry" className="text-primary hover:underline">
              see every open role
            </Link>
            .
          </p>
        </div>
      )}
      {cities.length > 0 && (
        <CityGrid
          counts={counts.byCity}
          cities={cities}
          eyebrow={`Cities in ${entry.country}`}
          heading={`Engineering hubs in ${entry.country}`}
        />
      )}
      <JobsListing
        action={`/countries/${entry.slug}`}
        filters={{ ...filters, country: entry.slug }}
      />
    </>
  )
}
