import Link from 'next/link'
import { Logo } from '@/components/logo'
import { SOURCE_ATTRIBUTION } from '@/lib/format'
import { DATA_UPDATED_AT, IS_DEMO_DATA } from '@/lib/jobs'
import { CITIES, INDUSTRY_ROLES } from '@/lib/taxonomy'

const updatedLabel = DATA_UPDATED_AT
  ? new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Australia/Sydney',
    }).format(new Date(DATA_UPDATED_AT))
  : null

export function SiteFooter() {
  const columns = [
    {
      title: 'Industry Jobs',
      links: INDUSTRY_ROLES.map((role) => ({ href: `/industry?role=${role.slug}`, label: role.name })),
    },
    {
      title: 'Jobs by City',
      links: CITIES.map((city) => ({ href: `/cities/${city.slug}`, label: `${city.name} jobs` })),
    },
  ]

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2">
          <Logo inverted />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-primary-foreground/80">
            The specialist job board connecting civil engineers with engineering
            firms, consultancies and contractors.
          </p>
          {updatedLabel && (
            <p className="mt-4 font-mono text-xs text-primary-foreground/70">
              Listings refreshed {updatedLabel} (Sydney)
            </p>
          )}
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="font-mono text-xs font-medium tracking-wider text-accent uppercase">
              {column.title}
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-primary-foreground/75 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Civil Jobs Australia. All rights reserved.</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link href="/privacy" className="hover:text-primary-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary-foreground">
              Terms
            </Link>
            {IS_DEMO_DATA ? (
              <span>Preview listings are sample data.</span>
            ) : (
              <span>
                Listings aggregated from{' '}
                {Object.values(SOURCE_ATTRIBUTION).map((source, index) => (
                  <span key={source.label}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="hover:text-primary-foreground"
                    >
                      {source.label}
                    </a>
                    {index < Object.values(SOURCE_ATTRIBUTION).length - 1 ? ', ' : '.'}
                  </span>
                ))}
              </span>
            )}
          </p>
        </div>
      </div>
    </footer>
  )
}
