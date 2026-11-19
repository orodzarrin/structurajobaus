import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { ListsManager } from '@/components/account/lists-manager'
import { LocalAlerts } from '@/components/alerts/local-alerts'
import { criteriaToFilters, listsKey, type SavedList } from '@/lib/accounts'
import { getCurrentUser } from '@/lib/auth'
import { countryOfJob, countrySlug, getCountries, getJobs } from '@/lib/jobs'
import type { AlertJobRow } from '@/lib/local-alerts'
import { STORE_READY, getJson } from '@/lib/store'

export const metadata: Metadata = {
  title: 'My job alerts',
  description: 'Custom lists of structural engineering roles, emailed to you when something new appears.',
  robots: { index: false, follow: false },
}

export default async function AlertsPage() {
  // Data for the no-account alerts below: countries from the live job data,
  // and a compact job index so the browser can count matches per alert.
  const countries = getCountries()
  const jobsIndex: AlertJobRow[] = (await getJobs()).map((job) => ({
    title: job.title,
    role: job.roleSlug,
    country: countrySlug(countryOfJob(job)),
    salaryMax: job.salaryMax ?? null,
    visa: job.visaSponsorship,
  }))

  if (!STORE_READY) {
    return (
      <>
        <PageHeader
          eyebrow="Job alerts"
          title="My job alerts"
          description="Saved lists and email alerts."
          breadcrumbs={[{ label: 'My alerts', href: '/alerts' }]}
        />
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Accounts are not switched on for this deployment yet. Everything else on the board works
            as normal.
          </p>
          <LocalAlerts countries={countries} jobs={jobsIndex} />
        </div>
      </>
    )
  }

  const user = await getCurrentUser()
  if (!user) {
    return (
      <>
        <PageHeader
          eyebrow="Job alerts"
          title="My job alerts"
          description="Custom lists of structural engineering roles, emailed to you when something new appears."
          breadcrumbs={[{ label: 'My alerts', href: '/alerts' }]}
        />
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-lg border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Sign in to create alert lists and get new structural engineering roles emailed to you
              when something matching appears.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Sign in
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              No account yet?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Create one free
              </Link>
            </p>
          </div>
          <LocalAlerts countries={countries} jobs={jobsIndex} />
        </div>
      </>
    )
  }

  const lists = (await getJson<SavedList[]>(listsKey(user.id))) ?? []

  // Match counts come from the same snapshot the board renders, so the number a
  // person sees on their dashboard is the number they would see in the results.
  const counts: Record<string, number> = {}
  for (const list of lists) {
    counts[list.id] = (await getJobs(criteriaToFilters(list.criteria))).length
  }

  return (
    <>
      <PageHeader
        eyebrow="Job alerts"
        title="My job alerts"
        description="Custom lists of structural engineering roles, emailed to you when something new appears."
        breadcrumbs={[{ label: 'My alerts', href: '/alerts' }]}
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <ListsManager
          email={user.email}
          lists={lists}
          counts={counts}
          digest={{ enabled: user.digestEnabled, frequency: user.digestFrequency }}
        />
      </div>
    </>
  )
}
