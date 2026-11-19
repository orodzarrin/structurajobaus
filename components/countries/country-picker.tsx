'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { JobCard } from '@/components/jobs/job-card'
import type { Job } from '@/lib/types'

export interface PickerCountry {
  country: string
  slug: string
  count: number
}

export interface PickerCity {
  slug: string
  name: string
  countrySlug: string
  count: number
  /** True when the city is in the site's city directory (so /jobs?city= works). */
  inDirectory: boolean
}

/**
 * A job as the picker needs it: the full card fields, but without the ad
 * text — the detail page carries that, so the list below the dropdowns does
 * not ship 238 full descriptions to the browser. `countrySlug` is computed
 * server-side (the client cannot import the job dataset to derive it).
 */
export type PickerJob = Omit<Job, 'description' | 'responsibilities' | 'requirements' | 'tags'> & {
  countrySlug: string
}

interface CountryPickerProps {
  countries: PickerCountry[]
  cities: PickerCity[]
  jobs: PickerJob[]
  total: number
}

const selectClass =
  'h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60'

/**
 * Cascading picker for the Browse by Country page: country filters the
 * cities, the city filters the jobs, and picking a job goes to its detail
 * page. Compact by design — three dropdowns in a row instead of a grid of
 * large country cards.
 */
export function CountryPicker({ countries, cities, jobs, total }: CountryPickerProps) {
  const router = useRouter()
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [job, setJob] = useState('')

  const selectedCountry = countries.find((entry) => entry.slug === country)

  const countryCities = useMemo(
    () =>
      cities
        .filter((entry) => entry.countrySlug === country)
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    [cities, country],
  )

  const visibleJobs = useMemo(() => {
    let list = jobs
    if (country && country !== 'all') list = list.filter((entry) => entry.countrySlug === country)
    if (city) list = list.filter((entry) => entry.city === city)
    return list
  }, [jobs, country, city])

  const selectedCity = countryCities.find((entry) => entry.slug === city)

  const browseHref =
    country && country !== 'all'
      ? selectedCity && selectedCity.inDirectory
        ? `/jobs?country=${country}&city=${selectedCity.slug}`
        : `/countries/${country}`
      : country === 'all'
        ? '/industry'
        : undefined

  const browseLabel =
    country && country !== 'all'
      ? selectedCity
        ? `See ${visibleJobs.length} ${visibleJobs.length === 1 ? 'role' : 'roles'} in ${selectedCity.name}`
        : `See all ${selectedCountry?.count ?? 0} roles in ${selectedCountry?.country}`
      : country === 'all'
        ? `See all ${total} open roles`
        : undefined

  function onCountryChange(value: string) {
    setCountry(value)
    setCity('')
    setJob('')
  }

  function onCityChange(value: string) {
    setCity(value)
    setJob('')
  }

  function onJobChange(value: string) {
    setJob(value)
    if (value) router.push(`/jobs/${value}`)
  }

  const cityDisabled = country === '' || country === 'all'
  const jobDisabled = country === '' || visibleJobs.length === 0

  return (
    <>
      <div className="mt-6 rounded-lg border bg-card p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="picker-country" className="mb-1.5 block text-sm font-medium">
            Country
          </label>
          <select
            id="picker-country"
            value={country}
            onChange={(event) => onCountryChange(event.target.value)}
            className={selectClass}
          >
            <option value="">Select a country</option>
            <option value="all">All countries ({total} open roles)</option>
            {countries.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {entry.country} ({entry.count} open roles)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="picker-city" className="mb-1.5 block text-sm font-medium">
            City
          </label>
          <select
            id="picker-city"
            value={city}
            onChange={(event) => onCityChange(event.target.value)}
            disabled={cityDisabled}
            className={selectClass}
          >
            {country === '' ? (
              <option value="">Select a country first</option>
            ) : country === 'all' ? (
              <option value="">Pick a country to see its cities</option>
            ) : (
              <>
                <option value="">All cities</option>
                {countryCities.map((entry) => (
                  <option key={entry.slug} value={entry.slug}>
                    {entry.name} ({entry.count} open roles)
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        <div>
          <label htmlFor="picker-job" className="mb-1.5 block text-sm font-medium">
            Job
          </label>
          <select
            id="picker-job"
            value={job}
            onChange={(event) => onJobChange(event.target.value)}
            disabled={jobDisabled}
            className={selectClass}
          >
            {country === '' ? (
              <option value="">Select a country first</option>
            ) : visibleJobs.length === 0 ? (
              <option value="">No open roles yet</option>
            ) : (
              <>
                <option value="">
                  Select a job… ({visibleJobs.length} open roles)
                </option>
                {visibleJobs.map((entry) => (
                  <option key={entry.slug} value={entry.slug}>
                    {entry.organisation ? `${entry.title} — ${entry.organisation}` : entry.title}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t pt-4">
        <p className="font-mono text-xs tabular-nums text-muted-foreground">
          {total} open roles across {countries.length} countries
        </p>
        {browseHref && browseLabel && (
          <Link href={browseHref} className="text-sm font-medium text-primary hover:underline">
            {browseLabel} →
          </Link>
        )}
      </div>
      </div>

      {/* Job list, narrowed by the dropdowns above: all roles with nothing
          picked, then fewer as a country and a city are chosen. Picking a job
          in the Job dropdown still navigates to its detail page. */}
      <div className="mt-8">
        <p className="font-mono text-xs font-medium tracking-wider text-accent uppercase">
          {visibleJobs.length} {visibleJobs.length === 1 ? 'role' : 'roles'} found
          {selectedCountry ? ` in ${selectedCountry.country}` : ''}
          {selectedCity ? ` — ${selectedCity.name}` : ''}
        </p>
        {visibleJobs.length > 0 ? (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleJobs.map((job) => (
              <li key={job.slug}>
                <JobCard
                  job={{
                    ...job,
                    description: '',
                    responsibilities: [],
                    requirements: [],
                    tags: [],
                  }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No open roles match this selection yet.
          </p>
        )}
      </div>
    </>
  )
}
