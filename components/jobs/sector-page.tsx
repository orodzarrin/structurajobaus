import Link from 'next/link'
import { JobsListing } from '@/components/jobs/jobs-listing'
import { PageHeader } from '@/components/page-header'
import { getJobCounts } from '@/lib/jobs'
import { CIVIL_SPECIALISMS, type Sector } from '@/lib/taxonomy'
import type { JobFilters } from '@/lib/types'
import { cn } from '@/lib/utils'

const SECTOR_COPY = {
  industry: {
    eyebrow: 'Industry jobs',
    title: 'Industry structural engineering jobs',
    description:
      'Structural, civil, geotechnical, bridge, design and project engineering roles with Australian consultancies, contractors and asset owners.',
  },
}

export async function SectorPage({ sector, filters }: { sector: Sector; filters: JobFilters }) {
  const copy = SECTOR_COPY[sector]
  const basePath = `/${sector}`
  // Chips are the civil disciplines, not seniority levels: one Structural chip
  // covers every structural role (Structural, Senior, Principal), and every
  // other discipline the board actually has jobs in gets a chip too. A chip
  // is only shown while it leads to at least one live job.
  const counts = await getJobCounts()
  const disciplines = CIVIL_SPECIALISMS.filter(
    (specialism) => (counts.bySpecialism[specialism.slug] ?? 0) > 0,
  )

  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        breadcrumbs={[{ label: copy.eyebrow, href: basePath }]}
      >
        <nav aria-label={`${copy.eyebrow} by discipline`} className="mt-8">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={basePath}
                className={cn(
                  'inline-flex rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                  !filters.specialism && !filters.role
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-white/20 hover:border-white/50',
                )}
              >
                All roles
              </Link>
            </li>
            {disciplines.map((specialism) => (
              <li key={specialism.slug}>
                <Link
                  href={`${basePath}?specialism=${specialism.slug}`}
                  aria-current={filters.specialism === specialism.slug ? 'page' : undefined}
                  className={cn(
                    'inline-flex rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                    filters.specialism === specialism.slug
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-white/20 hover:border-white/50',
                  )}
                >
                  {specialism.short}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>
      <JobsListing action={basePath} filters={{ ...filters, sector }} lockSector />
    </>
  )
}
