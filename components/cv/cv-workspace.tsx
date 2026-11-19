'use client'

import { FileSearch, FileText, FileUp, Mail, ShieldCheck, Sparkles, Trash2, Upload } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { extractTextFromFile } from '@/lib/cv-parse'
import { clearCvDoc, getCvDoc, saveCvDoc, type CvDoc, type CvDocKind } from '@/lib/cv-store'
import { detectDisciplines, matchJobs, type JobMatch, type MatchJobInput } from '@/lib/cv-match'
import { formatDate } from '@/lib/format'

function UploadCard({
  kind,
  label,
  hint,
  doc,
  busy,
  onUpload,
  onRemove,
}: {
  kind: CvDocKind
  label: string
  hint: string
  doc: CvDoc | null
  busy: boolean
  onUpload: (kind: CvDocKind, file: File) => void
  onRemove: (kind: CvDocKind) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div
      className={`rounded-lg border bg-card p-6 ${dragOver ? 'border-primary ring-2 ring-primary/30' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragOver(false)
        const file = event.dataTransfer.files?.[0]
        if (file) onUpload(kind, file)
      }}
    >
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <FileUp className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">{label}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
        </div>
      </div>

      {doc ? (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/50 px-3 py-2.5">
            <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate">{doc.name}</span>
              <span className="shrink-0 text-xs font-normal text-muted-foreground">
                {doc.text.split(/\s+/).filter(Boolean).length} words
              </span>
            </span>
            <button
              type="button"
              onClick={() => onRemove(kind)}
              className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${doc.name}`}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Remove
            </button>
          </div>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Preview the text we read from it
            </summary>
            <p className="mt-2 max-h-48 overflow-y-auto rounded-md border bg-muted/50 p-3 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {doc.text.slice(0, 3000)}
              {doc.text.length > 3000 ? '…' : ''}
            </p>
          </details>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-dashed px-4 py-6 text-sm font-medium text-muted-foreground hover:border-primary hover:text-foreground disabled:opacity-50"
        >
          <Upload className="size-4" aria-hidden="true" />
          {busy ? 'Reading your file…' : 'Choose a file or drop it here — PDF, Word (.docx) or text'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onUpload(kind, file)
          event.target.value = ''
        }}
      />
    </div>
  )
}

export function CvWorkspace({ jobs }: { jobs: MatchJobInput[] }) {
  const [cv, setCv] = useState<CvDoc | null>(null)
  const [coverLetter, setCoverLetter] = useState<CvDoc | null>(null)
  const [busy, setBusy] = useState<CvDocKind | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [matches, setMatches] = useState<JobMatch[] | null>(null)
  const [disciplines, setDisciplines] = useState<Array<{ slug: string; name: string; hits: number }>>([])

  useEffect(() => {
    let cancelled = false
    getCvDoc('cv')
      .then((doc) => {
        if (!cancelled) setCv(doc)
      })
      .catch(() => undefined)
    getCvDoc('coverLetter')
      .then((doc) => {
        if (!cancelled) setCoverLetter(doc)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  const handleUpload = useCallback(async (kind: CvDocKind, file: File) => {
    setError(null)
    setMatches(null)
    setBusy(kind)
    const result = await extractTextFromFile(file)
    if (!result.ok) {
      setError(result.error)
      setBusy(null)
      return
    }
    try {
      const doc = await saveCvDoc(kind, file, result.text)
      if (kind === 'cv') setCv(doc)
      else setCoverLetter(doc)
    } catch {
      setError('Could not save the file in this browser. Please try a different browser.')
    }
    setBusy(null)
  }, [])

  const handleRemove = useCallback(async (kind: CvDocKind) => {
    await clearCvDoc(kind).catch(() => undefined)
    if (kind === 'cv') setCv(null)
    else setCoverLetter(null)
    setMatches(null)
  }, [])

  const handleMatch = useCallback(() => {
    if (!cv) return
    setMatches(matchJobs(cv.text, coverLetter?.text ?? '', jobs))
    setDisciplines(detectDisciplines(cv.text))
  }, [cv, coverLetter, jobs])

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        <UploadCard
          kind="cv"
          label="Your CV"
          hint="The CV we match jobs against — and the file attached to your emails, unchanged."
          doc={cv}
          busy={busy === 'cv'}
          onUpload={handleUpload}
          onRemove={handleRemove}
        />
        <UploadCard
          kind="coverLetter"
          label="Your cover letter (template)"
          hint="Used as the base for a tailored letter per job — we fill in the company and position, never rewrite it."
          doc={coverLetter}
          busy={busy === 'coverLetter'}
          onUpload={handleUpload}
          onRemove={handleRemove}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={!cv || busy !== null}
          onClick={handleMatch}
          className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          Find jobs that fit my CV
        </button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
          Your files never leave this browser — they are read on your device and stored only here.
        </p>
      </div>

      {matches && (
        <section aria-labelledby="matches" className="mt-10">
          <h2 id="matches" className="flex items-center gap-2 text-xl font-semibold">
            <FileSearch className="size-5" aria-hidden="true" />
            {matches.length > 0 ? `${matches.length} closest jobs` : 'No close matches yet'}
          </h2>
          {disciplines.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Your CV reads strongest in: {disciplines.map((d) => d.name).join(' · ')}
            </p>
          )}
          {matches.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Nothing scored closely against this CV. Try a fuller CV — more roles, skills and
              project detail give the matcher more to work with.
            </p>
          ) : (
            <ul className="mt-6 flex flex-col gap-4">
              {matches.map(({ job, score, reasons }) => (
                <li key={job.slug} className="rounded-lg border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold">
                        <Link href={`/jobs/${job.slug}`} className="hover:text-primary">
                          {job.title}
                        </Link>
                      </h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {job.organisation} · {job.location} · Posted {formatDate(job.postedAt)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      {score}% match
                    </span>
                  </div>
                  {reasons.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {reasons.map((reason) => (
                        <li key={reason} className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{job.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <p className="mt-10 flex items-start gap-2 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
        <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          When you email a company from a job page, your CV and a cover letter tailored to that
          company and role are ready to attach — named with the company and position. Mail apps
          cannot receive attachments from a website link, so you download the two files and attach
          them with one tap each.
        </span>
      </p>
    </div>
  )
}
