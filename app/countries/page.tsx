import type { Metadata } from 'next'
import {
  CountryPicker,
  type PickerCity,
  type PickerJob,
} from '@/components/countries/country-picker'
import { PageHeader } from '@/components/page-header'
import { countryOfJob, countrySlug, getCountries, getJobCounts, getJobs } from '@/lib/jobs'
import { CITIES } from '@/lib/taxonomy'

export const metadata: Metadata = {
  title: 'Civil Engineering Jobs by Country',
  description:
    'Browse industry civil engineering jobs by country, then by city, then by job. Pick a country from the dropdown to see its cities and open roles — every listed country is selectable, even where no roles have arrived yet.',
  alternates: { canonical: '/countries' },
}

/**
 * Display name for a job's city. The city directory covers the main hubs;
 * regional locations only appear in the job data, so their name comes from
 * the listing's own location ("Alberton 3971, VIC" -> "Alberton").
 */
function cityDisplayName(slug: string, location: string): string {
  const known = CITIES.find((city) => city.slug === slug)
  if (known) return known.name
  const head = location.split(',')[0].trim()
  return head.replace(/\s+\d{4}$/, '') || slug
}

export default async function CountriesPage() {
  const counts = await getJobCounts()
  const countries = getCountries()
  const jobs = await getJobs()

  // Cities are derived from the jobs themselves (not just the directory),
  // so every open role is reachable through the city dropdown — the
  // directory misses regional locations such as Canberra or Wollongong.
  const cityMap = new Map<string, PickerCity>()
  const pickerJobs: PickerJob[] = jobs.map((job) => {
    const cSlug = countrySlug(countryOfJob(job))
    const key = `${cSlug}:${job.city}`
    const existing = cityMap.get(key)
    if (existing) {
      existing.count += 1
    } else {
      cityMap.set(key, {
        slug: job.city,
        name: cityDisplayName(job.city, job.location),
        countrySlug: cSlug,
        count: 1,
        inDirectory: CITIES.some((city) => city.slug === job.city),
      })
    }
    // The ad text stays on the detail page: the list below the dropdowns
    // renders JobCard from these fields alone.
    const { description: _description, responsibilities: _responsibilities, requirements: _requirements, tags: _tags, ...cardJob } = job
    return { ...cardJob, countrySlug: cSlug }
  })

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
          <CountryPicker
            countries={countries}
            cities={[...cityMap.values()]}
            jobs={pickerJobs}
            total={counts.total}
          />
        </div>
      </section>
    </>
  )
}
