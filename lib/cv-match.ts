/**
 * Matches an uploaded CV (plus optional cover letter) against the live job
 * data, entirely in the browser. Scores each job by skills, titles,
 * disciplines and experience keywords found in the CV text, and returns the
 * closest jobs first with a short reason for each match.
 */

import { CIVIL_SPECIALISMS, getSpecialism } from './taxonomy'

/** The compact job index the /my-cv page passes to the browser. */
export interface MatchJobInput {
  slug: string
  title: string
  organisation: string
  location: string
  country?: string
  summary: string
  tags: string[]
  /** Civil sub-discipline slugs, computed server-side from the job text. */
  specialisms: string[]
  postedAt: string
  closingDate: string
}

export interface JobMatch {
  job: MatchJobInput
  score: number
  reasons: string[]
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'have', 'has', 'had',
  'will', 'would', 'been', 'were', 'are', 'was', 'our', 'your', 'their',
  'about', 'into', 'over', 'under', 'between', 'through', 'during', 'before',
  'after', 'above', 'below', 'within', 'without', 'including', 'also', 'than',
  'then', 'them', 'they', 'she', 'his', 'her', 'its', 'you', 'we', 'who',
  'what', 'when', 'where', 'which', 'while', 'upon', 'per', 'via', 'etc',
  'work', 'role', 'team', 'years', 'year', 'experience', 'skills', 'ability',
  'strong', 'excellent', 'including', 'various', 'range', 'based', 'using',
  'used', 'use', 'working', 'worked', 'project', 'projects', 'client',
  'clients', 'across', 'well', 'high', 'across', 'ensure', 'support',
  'provide', 'provides', 'deliver', 'delivery', 'management', 'technical',
])

function tokenize(text: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const word of text.toLowerCase().match(/[a-z][a-z\-]{2,}/g) ?? []) {
    if (STOPWORDS.has(word)) continue
    counts.set(word, (counts.get(word) ?? 0) + 1)
  }
  return counts
}

/** Top civil disciplines the CV talks about, by keyword hits. */
export function detectDisciplines(cvText: string): Array<{ slug: string; name: string; hits: number }> {
  const lower = cvText.toLowerCase()
  return CIVIL_SPECIALISMS.map((specialism) => ({
    slug: specialism.slug,
    name: specialism.short,
    hits: specialism.keywords.filter((keyword) => lower.includes(keyword)).length,
  }))
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3)
}

function seniorityOf(text: string): 'senior' | 'early' | null {
  const lower = text.toLowerCase()
  if (/\b(senior|principal|lead|associate|manager)\b/.test(lower)) return 'senior'
  if (/\b(graduate|junior|entry[\s-]?level|intern)\b/.test(lower)) return 'early'
  return null
}

export function matchJobs(cvText: string, coverText: string, jobs: MatchJobInput[]): JobMatch[] {
  const combined = `${cvText}\n${coverText}`
  const lower = combined.toLowerCase()
  const cvTokens = tokenize(combined)
  const cvSeniority = seniorityOf(cvText)

  const results: JobMatch[] = []

  for (const job of jobs) {
    let points = 0
    const reasons: string[] = []

    // Job title words in the CV — the strongest signal.
    const titleWords = [...tokenize(job.title).keys()]
    const titleHits = titleWords.filter((word) => cvTokens.has(word))
    if (titleHits.length > 0) {
      points += Math.min(42, 14 * titleHits.length)
      reasons.push(`Title match: ${titleHits.slice(0, 4).join(', ')}`)
    }

    // Civil disciplines: the job's disciplines, when the CV talks about them.
    let disciplinePoints = 0
    for (const slug of job.specialisms) {
      const specialism = getSpecialism(slug)
      if (!specialism) continue
      const hits = specialism.keywords.filter((keyword) => lower.includes(keyword))
      if (hits.length > 0) {
        disciplinePoints += 12
        reasons.push(specialism.short)
      }
    }
    points += Math.min(24, disciplinePoints)

    // Shared skill tags.
    const tagWords = job.tags.flatMap((tag) => [...tokenize(tag).keys()])
    const sharedTags = [...new Set(tagWords)].filter((word) => cvTokens.has(word))
    if (sharedTags.length > 0) {
      points += Math.min(20, 5 * sharedTags.length)
      if (sharedTags.length >= 2) reasons.push(`Shared skills: ${sharedTags.slice(0, 5).join(', ')}`)
    }

    // Summary keywords.
    const summaryWords = [...tokenize(job.summary).keys()].filter((word) => word.length >= 4)
    const summaryHits = summaryWords.filter((word) => cvTokens.has(word))
    points += Math.min(15, Math.round(1.5 * summaryHits.length))

    // Seniority alignment (a small nudge, never a penalty).
    const jobSeniority = seniorityOf(job.title)
    if (cvSeniority && jobSeniority && cvSeniority === jobSeniority) {
      points += 6
      reasons.push(cvSeniority === 'senior' ? 'Senior-level match' : 'Graduate / early-career match')
    }

    // Same city mentioned in the CV.
    const city = job.location.split(',')[0].trim().toLowerCase()
    if (city.length >= 3 && lower.includes(city)) {
      points += 5
      reasons.push(`In ${job.location.split(',')[0].trim()}`)
    }

    if (points >= 12) {
      results.push({ job, score: Math.min(97, Math.round(points)), reasons: reasons.slice(0, 4) })
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 15)
}
