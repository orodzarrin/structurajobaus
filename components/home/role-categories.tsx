import { ChevronRight, HardHat } from 'lucide-react'
import Link from 'next/link'
import { CIVIL_SPECIALISMS } from '@/lib/taxonomy'

interface RoleCategoriesProps {
  /** Live job counts per civil sub-discipline slug. */
  counts: Record<string, number>
}

export function RoleCategories({ counts }: RoleCategoriesProps) {
  // One row per civil discipline that actually has live jobs — Structural is
  // a single row covering every structural role regardless of seniority
  // (Structural, Senior, Principal), and every other discipline with jobs
  // is listed too: water, geotechnical, transport and roads, dams, bridges
  // (under Structural), coastal, mining, environmental, materials, surveying
  // and construction.
  const disciplines = CIVIL_SPECIALISMS.filter(
    (specialism) => (counts[specialism.slug] ?? 0) > 0,
  )

  return (
    <section aria-labelledby="browse-roles" className="border-y bg-muted/50 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-xs font-medium tracking-wider text-accent uppercase">Browse by discipline</p>
        <h2 id="browse-roles" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Civil engineering disciplines
        </h2>
        <div className="mt-8 max-w-3xl">
          <div className="rounded-lg border bg-card">
            <div className="flex items-start gap-4 border-b p-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <HardHat className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">
                  <Link href="/industry" className="hover:text-primary">
                    Industry Jobs
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">Design, consulting and delivery roles with engineering firms and contractors.</p>
              </div>
            </div>
            <ul className="divide-y">
              {disciplines.map((specialism) => (
                <li key={specialism.slug}>
                  <Link
                    href={`/industry?specialism=${specialism.slug}`}
                    className="flex items-center justify-between px-6 py-3.5 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="font-medium">{specialism.name}</span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-mono text-xs tabular-nums">{counts[specialism.slug] ?? 0} jobs</span>
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
