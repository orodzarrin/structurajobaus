/**
 * Browser-only storage for the user's CV and cover-letter template, plus the
 * filename and tailoring helpers for the email step.
 *
 * NOTHING here ever leaves the browser: files are kept in IndexedDB on the
 * user's own device, parsed in the browser, and never uploaded to any
 * server. The site has no backend email send for application emails (Brevo
 * is only used by the GitHub Actions digest script), so the email step works
 * with ready-named downloads + a prefilled mailto link instead.
 */

import { PDFDocument, StandardFonts } from 'pdf-lib'

export type CvDocKind = 'cv' | 'coverLetter'

export interface CvDoc {
  kind: CvDocKind
  name: string
  type: string
  size: number
  addedAt: number
  text: string
  blob: Blob
}

const DB_NAME = 'civil-jobs-cv'
const STORE_NAME = 'docs'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser does not support local file storage.'))
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Could not open local file storage.'))
  })
}

export async function saveCvDoc(kind: CvDocKind, file: File, text: string): Promise<CvDoc> {
  const db = await openDb()
  const doc: CvDoc = {
    kind,
    name: file.name,
    type: file.type,
    size: file.size,
    addedAt: Date.now(),
    text,
    blob: file,
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(doc, kind)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(new Error('Could not save the file in this browser.'))
  })
  db.close()
  return doc
}

export async function getCvDoc(kind: CvDocKind): Promise<CvDoc | null> {
  const db = await openDb()
  const doc = await new Promise<CvDoc | undefined>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(kind)
    request.onsuccess = () => resolve(request.result as CvDoc | undefined)
    request.onerror = () => reject(new Error('Could not read the saved file.'))
  })
  db.close()
  return doc ?? null
}

export async function clearCvDoc(kind: CvDocKind): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(kind)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(new Error('Could not remove the saved file.'))
  })
  db.close()
}

/** "Senior Structural Engineer, Rail & Metro" -> "Senior-Structural-Engineer-Rail-Metro". */
export function slugPart(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'document'
  )
}

/**
 * Attachment name for the email step, e.g.
 * "SMEC-Senior-Structural-Engineer-Rail-Metro-CV.pdf".
 * The CV keeps its original extension; the tailored cover letter is always
 * generated as a PDF.
 */
export function attachmentName(
  kind: 'CV' | 'Cover-Letter',
  company: string,
  title: string,
  originalName: string,
): string {
  const dot = originalName.lastIndexOf('.')
  const ext = kind === 'Cover-Letter' ? '.pdf' : dot > 0 ? originalName.slice(dot).toLowerCase() : '.pdf'
  return `${slugPart(company)}-${slugPart(title)}-${kind}${ext}`
}

export interface TailorResult {
  text: string
  changes: string[]
}

/**
 * Tailors the user's OWN uploaded cover letter for one specific job. Only
 * the user's words are rearranged — nothing new is invented:
 *  - explicit placeholders ([Company], [Position], {company}, …) are filled in
 *  - a generic greeting ("Dear Hiring Manager", "To whom it may concern")
 *    becomes "Dear {Company} Hiring Manager,"
 *  - the first generic role mention ("this position", "the advertised role")
 *    becomes "the {Title} role"
 *  - the first "your company" becomes the company name
 * Anything already specific in the letter is left exactly as written.
 */
export function tailorCoverLetter(template: string, company: string, title: string): TailorResult {
  const changes: string[] = []
  let text = template.replace(/\r\n?/g, '\n')

  const companyTokens: RegExp[] = [
    /\[company name\]/gi,
    /\[company\]/gi,
    /\{\{company\}\}/gi,
    /\{company\}/gi,
    /<company>/gi,
  ]
  for (const pattern of companyTokens) {
    const count = text.match(pattern)?.length ?? 0
    if (count > 0) {
      text = text.replace(pattern, company)
      changes.push(`Placeholder [Company] → ${company} (×${count})`)
    }
  }

  const titleTokens: RegExp[] = [
    /\[job title\]/gi,
    /\[position\]/gi,
    /\[role\]/gi,
    /\{\{position\}\}/gi,
    /\{position\}/gi,
    /\[job\]/gi,
  ]
  for (const pattern of titleTokens) {
    const count = text.match(pattern)?.length ?? 0
    if (count > 0) {
      text = text.replace(pattern, title)
      changes.push(`Placeholder [Position] → ${title} (×${count})`)
    }
  }

  // Generic greeting -> addressed to this company.
  const greetingPattern =
    /^\s*(dear\s+(hiring manager|hiring team|recruitment team|recruiting team|sir or madam|sir\/madam|sir|madam)|to whom it may concern)\s*,?\s*$/im
  if (greetingPattern.test(text)) {
    text = text.replace(greetingPattern, `Dear ${company} Hiring Manager,`)
    changes.push(`Greeting → Dear ${company} Hiring Manager`)
  }

  // First generic role mention -> the specific role.
  const rolePattern = /\b(the|this)\s+(advertised\s+)?(role|position|vacancy|opportunity)\b/i
  if (rolePattern.test(text)) {
    text = text.replace(rolePattern, `the ${title} role`)
    changes.push(`Role mention → the ${title} role`)
  }

  // First "your company" -> the company name.
  const yourCompanyPattern = /\byour (company|organisation|organization)\b/i
  if (yourCompanyPattern.test(text)) {
    text = text.replace(yourCompanyPattern, company)
    changes.push(`"your company" → ${company}`)
  }

  return { text, changes }
}

/** Renders the tailored letter as a simple A4 PDF (Helvetica, wrapped). */
export async function coverLetterPdf(text: string): Promise<Blob> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const size = 11
  const lineHeight = 16
  const margin = 64
  const pageWidth = 595.28
  const pageHeight = 841.89
  const maxWidth = pageWidth - margin * 2

  const wrap = (paragraph: string): string[] => {
    const words = paragraph.split(/\s+/).filter(Boolean)
    const lines: string[] = []
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate
      } else {
        if (line) lines.push(line)
        line = word
      }
    }
    if (line) lines.push(line)
    return lines.length > 0 ? lines : ['']
  }

  let page = doc.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin
  const drawLine = (line: string) => {
    if (y < margin + lineHeight) {
      page = doc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }
    page.drawText(line, { x: margin, y, size, font })
    y -= lineHeight
  }

  for (const paragraph of text.split('\n')) {
    if (paragraph.trim() === '') {
      y -= lineHeight / 2
      continue
    }
    for (const line of wrap(paragraph)) drawLine(line)
    y -= lineHeight / 2
  }

  const bytes = await doc.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

/** Triggers a browser download of a blob with the given filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
