/**
 * Reads the text out of an uploaded CV or cover letter, entirely in the
 * browser. The file is never uploaded to any server.
 *
 * Supported: PDF (pdfjs-dist), Word .docx (mammoth), plain text. Old binary
 * .doc files cannot be read in the browser — the user is asked to save as
 * .docx or PDF instead.
 */

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import * as mammoth from 'mammoth'

export type ParseResult = { ok: true; text: string } | { ok: false; error: string }

let workerConfigured = false

function ensurePdfWorker(): void {
  if (workerConfigured) return
  // Bundled worker, resolved by webpack at build time.
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
  workerConfigured = true
}

async function extractPdf(file: File): Promise<ParseResult> {
  try {
    ensurePdfWorker()
    const data = await file.arrayBuffer()
    const pdf = await getDocument({ data }).promise
    const pages: string[] = []
    const total = Math.min(pdf.numPages, 30)
    for (let pageNumber = 1; pageNumber <= total; pageNumber++) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      const text = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (text) pages.push(text)
    }
    const text = pages.join('\n\n').trim()
    return text ? { ok: true, text } : { ok: false, error: 'No readable text found in this PDF.' }
  } catch {
    return { ok: false, error: 'This PDF could not be read. Try exporting it again as a PDF.' }
  }
}

async function extractDocx(file: File): Promise<ParseResult> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    const text = result.value.trim()
    return text ? { ok: true, text } : { ok: false, error: 'No readable text found in this document.' }
  } catch {
    return { ok: false, error: 'This Word document could not be read. Try saving it as .docx again.' }
  }
}

export async function extractTextFromFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return extractPdf(file)
  if (name.endsWith('.docx')) return extractDocx(file)
  if (name.endsWith('.doc')) {
    return {
      ok: false,
      error: 'Old .doc files cannot be read in the browser. Please save the file as .docx or PDF and try again.',
    }
  }
  if (name.endsWith('.txt') || name.endsWith('.md') || file.type.startsWith('text/')) {
    const text = (await file.text()).trim()
    return text ? { ok: true, text } : { ok: false, error: 'This file has no readable text.' }
  }
  return {
    ok: false,
    error: 'Unsupported file type. Please upload a PDF, Word (.docx) or plain-text file.',
  }
}
