import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/format'
import { DATA_UPDATED_AT, getAllJobSlugs, getCountries } from '@/lib/jobs'
import { ALL_ROLES, CITIES } from '@/lib/taxonomy'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await getAllJobSlugs()
  const lastModified = DATA_UPDATED_AT ? new Date(DATA_UPDATED_AT) : undefined

  const staticPages = [
    '',
    '/jobs',
    '/industry',
    '/cities',
    '/countries',
    '/post-a-job',
    '/privacy',
    '/terms',
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: 'daily' as const,
    priority: path === '' ? 1 : 0.9,
  }))

  return [
    ...staticPages,
    ...getCountries().map((entry) => ({
      url: `${SITE_URL}/countries/${entry.slug}`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...ALL_ROLES.map((role) => ({
      url: `${SITE_URL}/${role.sector}?role=${role.slug}`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...CITIES.map((city) => ({
      url: `${SITE_URL}/cities/${city.slug}`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...jobs.map((job) => ({
      url: `${SITE_URL}/jobs/${job.slug}`,
      lastModified: new Date(`${job.postedAt}T00:00:00Z`),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
