import { FileSearch } from 'lucide-react'
import Link from 'next/link'

/** Home-page entry point for CV upload + job matching. */
export function CvPromo() {
  return (
    <section aria-labelledby="match-cv" className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 rounded-lg border bg-card p-6 sm:flex-row sm:items-center md:p-8">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileSearch className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs font-medium tracking-wider text-accent uppercase">My CV</p>
            <h2 id="match-cv" className="mt-1 text-2xl font-semibold tracking-tight">
              Match jobs to your CV
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Upload your CV and cover letter and we rank the jobs closest to your experience first —
              and get your files ready to attach when you email a company. Everything is read in
              your browser; your files are never uploaded anywhere.
            </p>
          </div>
          <Link
            href="/my-cv"
            className="flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Upload your CV
          </Link>
        </div>
      </div>
    </section>
  )
}
