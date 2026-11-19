'use client'

import { Download, FileText, Mail, Paperclip } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  attachmentName,
  coverLetterPdf,
  downloadBlob,
  getCvDoc,
  tailorCoverLetter,
  type CvDoc,
} from '@/lib/cv-store'

function mailtoHref(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/**
 * The email step on a job page. A mailto: link cannot carry attachments —
 * no website can do that — so the flow is honest about it:
 *  1. your CV downloads unchanged, named with the company and position
 *  2. your cover letter is tailored to this company and role (from YOUR
 *     uploaded template — never rewritten from scratch) and downloads as a
 *     PDF with the same naming
 *  3. your mail app opens with the email ready, and you attach the two
 *     files with one tap each
 */
export function EmailApplication({
  title,
  organisation,
  contactEmail,
}: {
  title: string
  organisation: string
  contactEmail: string | null
}) {
  const [cv, setCv] = useState<CvDoc | null>(null)
  const [coverLetter, setCoverLetter] = useState<CvDoc | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [tailorChanges, setTailorChanges] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getCvDoc('cv'), getCvDoc('coverLetter')])
      .then(([cvDoc, coverDoc]) => {
        if (cancelled) return
        setCv(cvDoc)
        setCoverLetter(coverDoc)
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!contactEmail) return null

  const cvName = cv ? attachmentName('CV', organisation, title, cv.name) : null
  const coverName = attachmentName('Cover-Letter', organisation, title, '.pdf')

  const applyHref = mailtoHref(
    contactEmail,
    `Application — ${title} (${organisation})`,
    `Dear ${organisation} Hiring Manager,\n\nI am applying for the ${title} position. Please find my CV and cover letter attached.\n\nKind regards,\n[Your Name]`,
  )
  const followUpHref = mailtoHref(
    contactEmail,
    `Application status enquiry — ${title} (${organisation})`,
    `Dear ${organisation} Recruitment Team,\n\nI recently applied for the ${title} role and would like to enquire about the status of my application.\n\nThank you for your time.\n\nKind regards,\n[Your Name]`,
  )

  const handleDownloadCv = () => {
    if (!cv) return
    downloadBlob(cv.blob, cvName ?? cv.name)
  }

  const handleDownloadCover = async () => {
    if (!coverLetter) return
    setError(null)
    setBusy(true)
    try {
      const tailored = tailorCoverLetter(coverLetter.text, organisation, title)
      const pdf = await coverLetterPdf(tailored.text)
      downloadBlob(pdf, coverName)
      setTailorChanges(tailored.changes)
    } catch {
      setError('The tailored cover letter could not be generated. Please try again.')
    }
    setBusy(false)
  }

  return (
    <div className="mt-4 rounded-lg border bg-muted/50 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Paperclip className="size-4" aria-hidden="true" />
        Email your application
      </h3>

      {!loaded ? null : !cv && !coverLetter ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Upload your CV and cover letter on{' '}
          <Link href="/my-cv" className="font-medium text-primary underline hover:text-primary/80">
            My CV
          </Link>{' '}
          first — then they will be ready here, named for this company and role.
        </p>
      ) : (
        <>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Mail apps cannot receive attachments from a website link, so download the files below
            first, then attach them in your mail app — one tap each.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {cv && cvName && (
              <button
                type="button"
                onClick={handleDownloadCv}
                className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-left text-sm font-medium hover:border-primary"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{cvName}</span>
                </span>
                <Download className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </button>
            )}
            {coverLetter ? (
              <button
                type="button"
                onClick={handleDownloadCover}
                disabled={busy}
                className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-left text-sm font-medium hover:border-primary disabled:opacity-50"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{busy ? 'Tailoring your letter…' : coverName}</span>
                </span>
                <Download className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </button>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                No cover letter uploaded yet — add one on{' '}
                <Link href="/my-cv" className="font-medium text-primary underline hover:text-primary/80">
                  My CV
                </Link>{' '}
                and it will be tailored to {organisation} and this role.
              </p>
            )}
          </div>
          {tailorChanges && (
            <div className="mt-3 rounded-md border bg-card px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              {tailorChanges.length > 0 ? (
                <>
                  <span className="font-medium text-foreground">Tailored from your letter:</span>{' '}
                  {tailorChanges.join(' · ')}
                </>
              ) : (
                'No generic placeholders found in your letter, so it was used exactly as uploaded. Add [Company] and [Position] to your template to have them filled in per job.'
              )}
            </div>
          )}
          {error && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </>
      )}

      <div className="mt-3 flex flex-col gap-2">
        <a
          href={applyHref}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Mail className="size-4" aria-hidden="true" />
          Apply by email
        </a>
        <a
          href={followUpHref}
          className="flex items-center justify-center gap-2 rounded-md border bg-card px-4 py-2 text-sm font-medium hover:border-primary"
        >
          <Mail className="size-4" aria-hidden="true" />
          Ask about my application
        </a>
      </div>
    </div>
  )
}
