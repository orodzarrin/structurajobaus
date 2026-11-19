import type { Job } from './types'

const compactAud = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
  notation: 'compact',
})

const dateFormatter = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Australia/Sydney',
})

/**
 * Returns null when the ad states no salary, so callers can leave the line out
 * completely. A placeholder such as "Not advertised" reads like a gap on the
 * board rather than a fact about the ad, and most live listings omit pay.
 */
export function formatSalary(
  job: Pick<Job, 'salaryMin' | 'salaryMax' | 'salaryPeriod' | 'salaryCurrency'>,
) {
  const { salaryMin, salaryMax } = job

  if (!salaryMin && !salaryMax) return null

  const currency = job.salaryCurrency?.toUpperCase() || 'AUD'
  const formatter =
    currency === 'AUD'
      ? compactAud
      : new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
          notation: 'compact',
        })

  const min = salaryMin ?? salaryMax!
  const max = salaryMax ?? salaryMin!
  const range =
    min === max ? formatter.format(min) : `${formatter.format(min)} – ${formatter.format(max)}`

  return job.salaryPeriod === 'scholarship' ? `${range} stipend p.a.` : `${range} p.a.`
}

/**
 * Parses a plain `YYYY-MM-DD` date as midnight UTC, then renders it in Sydney
 * time so the calendar date never shifts by a day or an hour across DST.
 */
export function formatDate(iso: string) {
  return dateFormatter.format(new Date(`${iso}T00:00:00Z`))
}

/** Relative "checked … ago" label for the live freshness line. */
export function formatRelativeTime(iso: string, now = new Date()) {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  const diffMs = now.getTime() - then
  if (diffMs < 45_000) return 'just now'
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export const WORK_ARRANGEMENT_LABEL = {
  onsite: 'On-site',
  hybrid: 'Hybrid',
  remote: 'Remote',
} as const

export const EMPLOYMENT_TYPE_LABEL = {
  'full-time': 'Full time',
  'part-time': 'Part time',
  contract: 'Fixed term / Contract',
  scholarship: 'Scholarship',
} as const

export const SITE_NAME = 'Civil Jobs Australia'
export const SITE_SHORT_NAME = 'Civil Jobs Australia'
export const SITE_TAGLINE = 'Industry civil engineering jobs in Australia'

/**
 * Canonical host. Set NEXT_PUBLIC_SITE_URL explicitly once a custom domain is
 * live; until then fall back to the Vercel deployment URL so canonical tags and
 * the sitemap can never point at a host that does not resolve.
 */
export const SITE_URL = (() => {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim()
  if (vercelHost) return `https://${vercelHost.replace(/\/+$/, '')}`

  return 'http://localhost:3000'
})()

/**
 * Aggregators require a visible attribution link wherever their listings appear.
 * Listings with no entry here (employer submissions) render no attribution.
 */
export const SOURCE_ATTRIBUTION: Record<string, { label: string; url: string }> = {
  adzuna: { label: 'Adzuna', url: 'https://www.adzuna.com.au' },
  careerjet: { label: 'Careerjet', url: 'https://www.careerjet.com.au' },
  jooble: { label: 'Jooble', url: 'https://au.jooble.org' },
}

/** Adzuna's terms require an attribution link wherever their listings appear. */
export const ADZUNA_ATTRIBUTION_URL = 'https://www.adzuna.com.au'

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
}

/**
 * Feed ad text sometimes arrives with HTML entities left in it
 * ("40&#43; countries", "email&#64;domain.com"). React renders a JS string
 * verbatim, so the entities show literally unless decoded first. Decodes
 * numeric decimal/hex entities and the common named ones. The ingest already
 * strips angle brackets, so no markup can appear from decoding.
 */
export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      const code = Number.parseInt(body.slice(2), 16)
      return Number.isNaN(code) ? match : String.fromCodePoint(code)
    }
    if (body.startsWith('#')) {
      const code = Number.parseInt(body.slice(1), 10)
      return Number.isNaN(code) ? match : String.fromCodePoint(code)
    }
    return NAMED_ENTITIES[body] ?? match
  })
}
