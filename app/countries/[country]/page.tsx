import type { Metadata } from 'next'
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
    description: `Industry civil engineering jobs in ${entry.country} — ${entry.count} open roles. Pick a city to narrow it down.`,
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
        description={`${entry.count} open roles in ${entry.country}. Pick a city below, or use the filters to narrow by role, salary and work type.`}
        breadcrumbs={[
          { label: 'Countries', href: '/countries' },
          { label: entry.country, href: `/countries/${entry.slug}` },
        ]}
      />
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
