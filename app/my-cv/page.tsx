import type { Metadata } from 'next'
import { CvWorkspace } from '@/components/cv/cv-workspace'
import { PageHeader } from '@/components/page-header'
import type { MatchJobInput } from '@/lib/cv-match'
import { getJobs, jobMatchesSpecialism } from '@/lib/jobs'
import { CIVIL_SPECIALISMS } from '@/lib/taxonomy'

export const metadata: Metadata = {
  title: 'My CV — match jobs to your experience',
  description:
    'Upload your CV and cover letter in your browser — never sent to any server — and see the industry jobs closest to your experience first.',
}

export default async function MyCvPage() {
  const jobs = await getJobs()
  const index: MatchJobInput[] = jobs.map((job) => ({
    slug: job.slug,
    title: job.title,
    organisation: job.organisation,
    location: job.location,
    country: job.country,
    summary: job.summary,
    tags: job.tags,
    specialisms: CIVIL_SPECIALISMS.filter((specialism) => jobMatchesSpecialism(job, specialism)).map(
      (specialism) => specialism.slug,
    ),
    postedAt: job.postedAt,
    closingDate: job.closingDate,
  }))

  return (
    <>
      <PageHeader
        eyebrow="My CV"
        title="Match jobs to your CV"
        description="Upload your CV and cover letter. They are read in your browser and never uploaded anywhere — then the jobs closest to your experience come first."
        breadcrumbs={[{ label: 'My CV', href: '/my-cv' }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <CvWorkspace jobs={index} />
      </div>
    </>
  )
}
