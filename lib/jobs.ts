import dataset from '@/data/jobs.json'
import { SAMPLE_JOBS } from './data/sample-jobs'
import { ALL_ROLES, CITIES, CIVIL_SPECIALISMS, STATES, type Sector, type StateCode } from './taxonomy'
import type { Job, JobFilters } from './types'

/*
 * Data access layer. Every page reads jobs through these async functions.
 *
 * Live listings live in data/jobs.json, which scripts/ingest-jobs.mjs refreshes
 * from the Adzuna AU API on a 6am schedule (see .github/workflows/refresh-jobs.yml).
 * The file is committed so the site stays statically rendered, and each deploy
 * picks up the newest snapshot.
 *
 * The bundled sample listings are only used when NEXT_PUBLIC_DEMO_JOBS=1 and no
 * live data exists yet, so the design can be reviewed before the first sync.
 * Demo data is never served in production and never marked up as a JobPosting.
 */

interface JobsFile {
  generatedAt: string | null
  source: string
  jobs: Job[]
}

const FILE = dataset as unknown as JobsFile
const DEMO_ENABLED = process.env.NEXT_PUBLIC_DEMO_JOBS === '1'

const sydneyDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Australia/Sydney',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function today() {
  return sydneyDate.format(new Date())
}

function byNewest(a: Job, b: Job) {
  return b.postedAt.localeCompare(a.postedAt)
}

function isOpen(job: Job) {
  return job.closingDate >= today()
}

/**
 * Jooble returns an empty company for some aggregated ads, and older snapshots
 * stored those as "Unnamed employer". A placeholder is not information, so it is
 * treated as "employer not named" and the organisation line is left out.
 */
const PLACEHOLDER_EMPLOYER =
  /^(unnamed employer|unknown( employer)?|n\/?a|none|not specified|not disclosed|employer confidential)$/i

function withRealEmployer(job: Job): Job {
  const organisation = String(job.organisation ?? '').trim()
  return PLACEHOLDER_EMPLOYER.test(organisation) ? { ...job, organisation: '' } : job
}

const LIVE_JOBS: Job[] = FILE.jobs.filter(isOpen).map(withRealEmployer).sort(byNewest)

export const IS_DEMO_DATA = LIVE_JOBS.length === 0 && DEMO_ENABLED
export const DATA_UPDATED_AT = FILE.generatedAt
export const HAS_LIVE_DATA = LIVE_JOBS.length > 0

const JOBS: Job[] = IS_DEMO_DATA ? [...SAMPLE_JOBS].sort(byNewest) : LIVE_JOBS

/** URL slug for a country name: "Australia" -> "australia". */
export function countrySlug(country: string) {
  return country
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * The country a listing belongs to, derived from the job data itself — never
 * invented. A listing with an explicit country uses it; otherwise its city
 * record carries the country; older snapshots have neither, and every one of
 * those is Australian (all eight state codes are Australian states, and the
 * feeds are Australian). When a feed from another country arrives it must
 * set `country` (or add its cities), and the new country appears
 * automatically in the counts and the Browse by Country page.
 */
export function countryOfJob(job: Job): string {
  if (job.country) return job.country
  const city = CITIES.find((entry) => entry.slug === job.city)
  if (city) return city.country
  return 'Australia'
}

export interface CountryCount {
  country: string
  slug: string
  count: number
}

/**
 * Countries the Browse by Country page lists by name, in the order Orod
 * asked for — every one is selectable even where no roles have arrived yet
 * (its count is then 0, never invented). Counts always come from the live
 * job data; a country outside this list still appears automatically when a
 * feed brings jobs from there, appended after the listed ones.
 */
export const BROWSE_COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'Ireland',
  'Italy',
  'Spain',
  'France',
  'Australia',
  'New Zealand',
  'United Arab Emirates',
  'Oman',
  'Saudi Arabia',
]

/**
 * Countries on the board, most jobs first. The listed countries always
 * appear (with 0 where no roles have arrived yet); any other country the
 * data carries is appended, most jobs first.
 */
export function getCountries(): CountryCount[] {
  const counts = new Map<string, number>()
  for (const job of JOBS) {
    const country = countryOfJob(job)
    counts.set(country, (counts.get(country) ?? 0) + 1)
  }
  const listed = BROWSE_COUNTRIES.map((country) => ({
    country,
    slug: countrySlug(country),
    count: counts.get(country) ?? 0,
  }))
  const extra = [...counts.entries()]
    .filter(([country]) => !BROWSE_COUNTRIES.includes(country))
    .map(([country, count]) => ({ country, slug: countrySlug(country), count }))
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country))
  return [...listed, ...extra]
}

export function getCountryBySlug(slug?: string): CountryCount | undefined {
  return !slug ? undefined : getCountries().find((entry) => entry.slug === slug)
}

export function isKnownCountry(slug?: string) {
  return !slug || getCountries().some((entry) => entry.slug === slug)
}

function matchesFilters(job: Job, filters: JobFilters) {
  if (filters.sector && job.sector !== filters.sector) return false
  if (filters.role && job.roleSlug !== filters.role) return false
  if (filters.country && countrySlug(countryOfJob(job)) !== filters.country) return false

  // The feed never labels the sub-discipline, so the listing's own words decide it.
  if (filters.specialism) {
    const specialism = CIVIL_SPECIALISMS.find((entry) => entry.slug === filters.specialism)
    if (specialism) {
      const haystack = [job.title, job.summary, job.department ?? '', ...job.tags]
        .join(' ')
        .toLowerCase()
      if (!specialism.keywords.some((keyword) => haystack.includes(keyword))) return false
    }
  }

  if (filters.city && job.city !== filters.city) return false
  if (filters.state && job.state !== filters.state) return false
  if (filters.visa && !job.visaSponsorship) return false
  if (filters.fullTime && job.employmentType !== 'full-time') return false

  // Listings without an advertised salary cannot satisfy a salary filter.
  if (filters.salaryMin) {
    if (!job.salaryMax || job.salaryMax < filters.salaryMin) return false
  }

  if (filters.remote || filters.hybrid) {
    const allowed = [filters.remote && 'remote', filters.hybrid && 'hybrid'].filter(Boolean)
    if (!allowed.includes(job.workArrangement)) return false
  }

  if (filters.q) {
    const terms = filters.q.toLowerCase().split(/\s+/).filter(Boolean)
    const haystack = [
      job.title,
      job.organisation,
      job.department,
      job.location,
      job.summary,
      ...job.tags,
    ]
      .join(' ')
      .toLowerCase()
    if (!terms.every((term) => haystack.includes(term))) return false
  }

  return true
}

export async function getJobs(filters: JobFilters = {}): Promise<Job[]> {
  return JOBS.filter((job) => matchesFilters(job, filters))
}

export async function getJobBySlug(slug: string): Promise<Job | undefined> {
  return JOBS.find((job) => job.slug === slug)
}

export async function getFeaturedJobs(limit = 6): Promise<Job[]> {
  const featured = JOBS.filter((job) => job.featured)
  return (featured.length > 0 ? featured : JOBS).slice(0, limit)
}

export async function getLatestJobs(sector: Sector, limit = 4): Promise<Job[]> {
  return JOBS.filter((job) => job.sector === sector).slice(0, limit)
}

export async function getVisaSponsoredJobs(limit = 4): Promise<Job[]> {
  return JOBS.filter((job) => job.visaSponsorship).slice(0, limit)
}

export async function getRelatedJobs(job: Job, limit = 3): Promise<Job[]> {
  return JOBS.filter((other) => other.id !== job.id && other.sector === job.sector)
    .sort(
      (a, b) =>
        Number(b.roleSlug === job.roleSlug) - Number(a.roleSlug === job.roleSlug) || byNewest(a, b),
    )
    .slice(0, limit)
}

export async function getJobCounts() {
  const counts = {
    total: JOBS.length,
    industry: 0,
    visa: 0,
    byCity: {} as Record<string, number>,
    byCountry: {} as Record<string, number>,
    byRole: {} as Record<string, number>,
  }

  for (const job of JOBS) {
    counts[job.sector]++
    if (job.visaSponsorship) counts.visa++
    counts.byCity[job.city] = (counts.byCity[job.city] ?? 0) + 1
    const country = countrySlug(countryOfJob(job))
    counts.byCountry[country] = (counts.byCountry[country] ?? 0) + 1
    counts.byRole[job.roleSlug] = (counts.byRole[job.roleSlug] ?? 0) + 1
  }

  return counts
}

export async function getAllJobSlugs(): Promise<
  { slug: string; postedAt: string; closingDate: string }[]
> {
  return JOBS.map(({ slug, postedAt, closingDate }) => ({ slug, postedAt, closingDate }))
}

/** Used to reject junk filter values instead of serving a soft-404. */
export function isKnownSector(slug?: string) {
  return !slug || slug === 'industry'
}

export function isKnownRole(slug?: string) {
  return !slug || ALL_ROLES.some((role) => role.slug === slug)
}

export function isKnownCity(slug?: string) {
  return !slug || CITIES.some((city) => city.slug === slug)
}

type RawSearchParams = Record<string, string | string[] | undefined>

export function parseFilters(params: RawSearchParams): JobFilters {
  const get = (key: string) => {
    const value = params[key]
    return (Array.isArray(value) ? value[0] : value)?.trim() || undefined
  }
  const sector = get('sector')
  const state = get('state')
  const salary = Number(get('salary'))

  return {
    q: get('q')?.slice(0, 100),
    sector: sector === 'industry' ? sector : undefined,
    role: get('role'),
    city: get('city'),
    country: isKnownCountry(get('country')) ? get('country') : undefined,
    state: STATES.some((s) => s.code === state) ? (state as StateCode) : undefined,
    salaryMin: Number.isFinite(salary) && salary > 0 ? salary : undefined,
    visa: get('visa') === '1',
    remote: get('remote') === '1',
    hybrid: get('hybrid') === '1',
    fullTime: get('fulltime') === '1',
    specialism: CIVIL_SPECIALISMS.some((entry) => entry.slug === get('specialism'))
      ? get('specialism')
      : undefined,
  }
}

/** True when a search-params object narrows the result set in any way. */
export function hasActiveFilters(filters: JobFilters) {
  return Object.values(filters).some((value) => Boolean(value))
}
