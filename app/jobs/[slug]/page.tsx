import { Building2, CalendarClock, CalendarDays, Clock, Laptop, Mail, MapPin, Plane, Wallet } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ApplyButton } from '@/components/jobs/apply-button'
import { EmailApplication } from '@/components/jobs/email-application'
import { JsonLd } from '@/components/json-ld'
import { JobCard, SectorBadge } from '@/components/jobs/job-card'
import { PageHeader } from '@/components/page-header'
import {
  decodeHtmlEntities,
  EMPLOYMENT_TYPE_LABEL,
  formatDate,
  formatSalary,
  SITE_URL,
  SOURCE_ATTRIBUTION,
  WORK_ARRANGEMENT_LABEL,
} from '@/lib/format'
import { getCompanyEmail } from '@/lib/data/company-contacts'
import { getAllJobSlugs, getJobBySlug, getRelatedJobs, IS_DEMO_DATA } from '@/lib/jobs'
import { getCity, getRole } from '@/lib/taxonomy'
import type { Job } from '@/lib/types'

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  return (await getAllJobSlugs()).map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const job = await getJobBySlug((await params).slug)
  if (!job) return {}
  // Aggregated ads sometimes never name the employer; the title then leads with
  // the location instead of a placeholder.
  const title = `${job.title} — ${[job.organisation, job.location].filter(Boolean).join(', ')}`
  return {
    title,
    description: decodeHtmlEntities(job.summary),
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: { title, description: decodeHtmlEntities(job.summary), type: 'article' },
  }
}

/** ISO 3166 country code for the JobPosting markup; legacy AU listings
 * carry no country field and default to Australia. */
const COUNTRY_ISO: Record<string, string> = {
  Australia: 'AU',
  'United States': 'US',
  Canada: 'CA',
  'United Kingdom': 'GB',
  Germany: 'DE',
  Ireland: 'IE',
  Italy: 'IT',
  Spain: 'ES',
  France: 'FR',
  'New Zealand': 'NZ',
  'United Arab Emirates': 'AE',
  Oman: 'OM',
  'Saudi Arabia': 'SA',
}

/**
 * Only real vacancies are marked up. Demo listings carry invented details, and
 * publishing JobPosting markup for them is what search engines treat as spam.
 */
function jobPostingJsonLd(job: Job) {
  if (job.source === 'demo') return null
  // Google requires hiringOrganization on a JobPosting, so an ad that does not
  // name its employer is better left unmarked than marked up with a stand-in.
  if (!job.organisation) return null

  const city = getCity(job.city)?.name ?? job.location.split(',')[0].trim()
  const hasSalary = Boolean(job.salaryMin || job.salaryMax)
  const countryName = job.country ?? 'Australia'
  const countryIso = COUNTRY_ISO[countryName] ?? 'AU'
  const currency = job.salaryCurrency?.toUpperCase() || (countryIso === 'AU' ? 'AUD' : undefined)

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: `<p>${job.description.replace(/\n+/g, ' ')}</p>`,
    identifier: { '@type': 'PropertyValue', name: job.organisation, value: job.id },
    datePosted: job.postedAt,
    validThrough: `${job.closingDate}T23:59:59+11:00`,
    employmentType:
      job.employmentType === 'full-time'
        ? 'FULL_TIME'
        : job.employmentType === 'part-time'
          ? 'PART_TIME'
          : job.employmentType === 'contract'
            ? 'CONTRACTOR'
            : 'OTHER',
    hiringOrganization: { '@type': 'Organization', name: job.organisation },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressRegion: job.state,
        addressCountry: countryIso,
      },
    },
    ...(job.workArrangement === 'remote' && {
      jobLocationType: 'TELECOMMUTE',
      applicantLocationRequirements: { '@type': 'Country', name: countryName },
    }),
    ...(hasSalary && currency && {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency,
        value: {
          '@type': 'QuantitativeValue',
          ...(job.salaryMin ? { minValue: job.salaryMin } : {}),
          ...(job.salaryMax ? { maxValue: job.salaryMax } : {}),
          unitText: 'YEAR',
        },
      },
    }),
    directApply: false,
    url: `${SITE_URL}/jobs/${job.slug}`,
  }
}

export default async function JobPage({ params }: { params: Params }) {
  const job = await getJobBySlug((await params).slug)
  if (!job) notFound()
  const related = await getRelatedJobs(job)
  const role = getRole(job.roleSlug)
  const sectorLabel = 'Industry jobs'
  const jsonLd = IS_DEMO_DATA ? null : jobPostingJsonLd(job)
  const attribution = job.source ? SOURCE_ATTRIBUTION[job.source] : undefined

  const salary = formatSalary(job)

  // The employer's published contact email, when one exists. Companies with
  // no published email get no row — never a made-up address.
  const contact = job.organisation ? getCompanyEmail(job.organisation) : undefined
  const contactMailto = contact
    ? `mailto:${contact.email}?subject=${encodeURIComponent(
        `Application status enquiry — ${job.title} (${job.organisation})`,
      )}&body=${encodeURIComponent(
        `Dear ${job.organisation} Recruitment Team,\n\nI recently applied for the ${job.title} role and would like to enquire about the status of my application.\n\nThank you for your time.\n\nKind regards,\n[Your Name]`,
      )}`
    : undefined

  const facts = [
    // Only facts the ad states are listed: no "Not advertised" filler.
    ...(salary ? [{ icon: Wallet, label: 'Salary', value: salary }] : []),
    { icon: MapPin, label: 'Location', value: job.location },
    { icon: Clock, label: 'Employment', value: EMPLOYMENT_TYPE_LABEL[job.employmentType] },
    { icon: Laptop, label: 'Work arrangement', value: WORK_ARRANGEMENT_LABEL[job.workArrangement] },
    // Only stated sponsorship is listed. Most employers say nothing either way,
    // and a "not mentioned" row reads as doubt the ad never expressed.
    ...(job.visaSponsorship
      ? [{ icon: Plane, label: 'Visa sponsorship', value: 'Available' }]
      : []),
    { icon: CalendarDays, label: 'Posted', value: formatDate(job.postedAt) },
    { icon: CalendarClock, label: 'Closing date', value: formatDate(job.closingDate) },
  ]

  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      <PageHeader
        eyebrow={role?.name ?? sectorLabel}
        title={job.title}
        description={decodeHtmlEntities(job.summary)}
        breadcrumbs={[
          { label: sectorLabel, href: '/industry' },
          { label: job.title, href: `/jobs/${job.slug}` },
        ]}
      >
        {job.organisation && (
          <p className="mt-5 flex items-center gap-2 text-white/90">
            <Building2 className="size-4" aria-hidden="true" />
            {job.organisation}
            {job.department && <span className="text-white/75">· {job.department}</span>}
          </p>
        )}
      </PageHeader>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <article className="min-w-0">
          <section aria-labelledby="about-role">
            <h2 id="about-role" className="text-xl font-semibold">
              About the role
            </h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-muted-foreground">
              {decodeHtmlEntities(job.description)}
            </p>
          </section>

          {job.responsibilities.length > 0 && (
            <section aria-labelledby="responsibilities" className="mt-10">
              <h2 id="responsibilities" className="text-xl font-semibold">
                Key responsibilities
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {job.responsibilities.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {job.requirements.length > 0 && (
            <section aria-labelledby="requirements" className="mt-10">
              <h2 id="requirements" className="text-xl font-semibold">
                Selection criteria
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {job.requirements.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {job.tags.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-2" aria-label="Skills and keywords">
              {job.tags.map((tag) => (
                <li key={tag} className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs">
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border bg-card p-6">
            <SectorBadge sector={job.sector} />
            <dl className="mt-5 flex flex-col divide-y">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-start gap-3 py-3 first:pt-0">
                  <fact.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <dt className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                      {fact.label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium">{fact.value}</dd>
                  </div>
                </div>
              ))}
              {contact && contactMailto && (
                <div className="flex items-start gap-3 py-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                      Contact email
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium break-all">
                      <a href={contactMailto} className="text-primary underline hover:text-primary/80">
                        {contact.email}
                      </a>
                    </dd>
                  </div>
                </div>
              )}
            </dl>
            {IS_DEMO_DATA ? (
              <p className="mt-4 rounded-md border border-dashed px-3 py-2.5 text-center text-xs text-muted-foreground">
                Demo listing — no application link.
              </p>
            ) : (
              <ApplyButton slug={job.slug} href={job.applyUrl} />
            )}
            {!IS_DEMO_DATA && (
              <EmailApplication
                title={job.title}
                organisation={job.organisation}
                contactEmail={contact?.email ?? null}
              />
            )}
            {attribution && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Listing sourced from{' '}
                <a
                  href={attribution.url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  {attribution.label}
                </a>
              </p>
            )}
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-jobs" className="border-t bg-muted/50 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 id="related-jobs" className="text-xl font-semibold">
              Similar industry jobs
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <JobCard job={item} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
