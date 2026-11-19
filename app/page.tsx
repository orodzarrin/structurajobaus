import { CityGrid } from '@/components/home/city-grid'
import { CvPromo } from '@/components/home/cv-promo'
import { Hero } from '@/components/home/hero'
import { JobSection } from '@/components/home/job-section'
import { RoleCategories } from '@/components/home/role-categories'
import { JsonLd } from '@/components/json-ld'
import { SITE_NAME, SITE_URL } from '@/lib/format'
import { getFeaturedJobs, getJobCounts, getLatestJobs, getVisaSponsoredJobs, DATA_UPDATED_AT } from '@/lib/jobs'

export default async function HomePage() {
  const [featured, industry, visa, counts] = await Promise.all([
    getFeaturedJobs(6),
    getLatestJobs('industry', 4),
    getVisaSponsoredJobs(4),
    getJobCounts(),
  ])

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/jobs?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <Hero stats={counts} updatedAt={DATA_UPDATED_AT} />
      <JobSection
        id="featured-jobs"
        eyebrow="Featured"
        title="Featured structural engineering jobs"
        description="The newest roles from Australian engineering firms and contractors."
        jobs={featured}
        href="/jobs"
        linkLabel="View all jobs"
        columns={3}
      />
      <RoleCategories counts={counts.bySpecialism} />
      <CvPromo />
      <JobSection
        id="latest-industry"
        eyebrow="Industry"
        title="Latest industry jobs"
        description="Structural, bridge, civil, design and project engineering roles."
        jobs={industry}
        href="/industry"
        linkLabel="All industry jobs"
        className="border-y bg-muted/50"
      />
      <JobSection
        id="visa-jobs"
        eyebrow="Visa sponsorship"
        title="Jobs offering visa sponsorship"
        description="Employers open to sponsoring skilled international engineers."
        jobs={visa}
        href="/jobs?visa=1"
        linkLabel="All visa sponsored jobs"
      />
      <CityGrid counts={counts.byCity} />
    </>
  )
}
