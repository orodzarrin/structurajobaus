import type { EmploymentType, Sector, StateCode, WorkArrangement } from './taxonomy'

/**
 * Where a listing came from. `direct` (employer submissions), `careerjet`,
 * `jooble` and `workday` (employer career sites) are the free feeds;
 * `adzuna` is optional and paid. `pageup` is legacy — university boards that
 * are no longer fetched. Only `demo` is fabricated.
 */
export type JobSource =
  | 'adzuna'
  | 'careerjet'
  | 'jooble'
  | 'workday'
  | 'pageup'
  | 'direct'
  | 'demo'

/**
 * Mirrors the `jobs` table in scripts/001_create_jobs.sql (snake_case columns
 * map to the camelCase fields below).
 *
 * Salary is optional because live listings frequently omit it. `undefined`
 * means "not advertised" and is never rendered as zero.
 */
export interface Job {
  id: string
  slug: string
  title: string
  roleSlug: string
  sector: Sector
  organisation: string
  department?: string
  city: string
  /**
   * Region/province/state as the ad states it, as a plain string. Australian
   * listings use the state code (NSW, VIC, …); listings elsewhere use the
   * region name (e.g. "California", "England", "Ontario", "Dubai").
   */
  state: string
  /** Country of the listing. Absent on older snapshots — those are all
   * Australian (their city/state say so), see countryOfJob in lib/jobs. */
  country?: string
  location: string
  salaryMin?: number
  salaryMax?: number
  /** ISO 4217 currency of salaryMin/salaryMax, e.g. USD, GBP, EUR. Absent
   * means AUD (all legacy listings are Australian). */
  salaryCurrency?: string
  salaryPeriod: 'year' | 'scholarship'
  employmentType: EmploymentType
  workArrangement: WorkArrangement
  visaSponsorship: boolean
  featured: boolean
  postedAt: string
  /** No separate update date is reported by the feed yet; "Updated" falls
   * back to the posted date — see JobDateLine. */
  updatedAt?: string
  closingDate: string
  summary: string
  description: string
  responsibilities: string[]
  requirements: string[]
  tags: string[]
  applyUrl: string
  /** Absent on legacy demo seeds; treat anything other than `adzuna` as third-party. */
  source?: JobSource
  externalId?: string
}

export interface JobFilters {
  q?: string
  sector?: Sector
  role?: string
  city?: string
  state?: StateCode
  /** Country slug (e.g. 'australia'), derived from the job data. */
  country?: string
  salaryMin?: number
  visa?: boolean
  remote?: boolean
  hybrid?: boolean
  fullTime?: boolean
  /** Civil sub-discipline, e.g. structural, geotechnical, water, transport. */
  specialism?: string
}
