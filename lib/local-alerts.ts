/**
 * Job alerts that work without an account.
 *
 * Accounts (Upstash + Brevo) are not switched on for this deployment yet, so
 * alerts created here live in the browser's localStorage on this device only
 * — the same approach as bookmarks and settings in lib/live-store.ts. When
 * accounts are switched on, these alerts can be moved into the server-side
 * lists in lib/accounts.ts; until then the email frequency is saved with the
 * alert and honoured once email delivery exists.
 *
 * The helpers take a Storage-like object so they can be unit-tested without a
 * browser; the component passes window.localStorage.
 */

export type AlertFrequency = 'daily' | 'weekly' | 'monthly'
export type VisaChoice = 'any' | 'yes' | 'no'

export interface LocalAlert {
  id: string
  createdAt: string
  /** Free-text job title / keywords, e.g. "Structural Engineer". */
  title: string
  /** Role slug from INDUSTRY_ROLES, or 'any'. */
  role: string
  /** Country slug from the job data (e.g. 'australia'), or 'any'. */
  country: string
  /** Minimum salary in dollars, or null for "any salary". */
  salaryMin: number | null
  visa: VisaChoice
  frequency: AlertFrequency
  /** Optional email — used for delivery once email alerts are switched on. */
  email?: string
}

export const LOCAL_ALERTS_KEY = 'structurajobaus:local-alerts:v1'

export const FREQUENCY_LABELS: Record<AlertFrequency, string> = {
  daily: 'Daily — every morning',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

export type NewLocalAlert = Omit<LocalAlert, 'id' | 'createdAt'>

export function loadAlerts(storage: Pick<Storage, 'getItem'>): LocalAlert[] {
  try {
    const raw = storage.getItem(LOCAL_ALERTS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is LocalAlert =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as LocalAlert).id === 'string' &&
        typeof (entry as LocalAlert).title === 'string',
    )
  } catch {
    return []
  }
}

export function saveAlerts(storage: Pick<Storage, 'setItem'>, alerts: LocalAlert[]): void {
  try {
    storage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(alerts))
  } catch {
    // Private mode / full storage: the list just does not persist.
  }
}

export function addAlert(storage: Pick<Storage, 'getItem' | 'setItem'>, input: NewLocalAlert): LocalAlert[] {
  const alert: LocalAlert = {
    ...input,
    id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }
  const alerts = [alert, ...loadAlerts(storage)]
  saveAlerts(storage, alerts)
  return alerts
}

export function deleteAlert(storage: Pick<Storage, 'getItem' | 'setItem'>, id: string): LocalAlert[] {
  const alerts = loadAlerts(storage).filter((entry) => entry.id !== id)
  saveAlerts(storage, alerts)
  return alerts
}

/** Compact job row the client uses to count matches per alert. */
export interface AlertJobRow {
  title: string
  role: string
  country: string
  salaryMax: number | null
  visa: boolean
}

export function countMatches(alert: LocalAlert, jobs: AlertJobRow[]): number {
  return jobs.filter((job) => {
    if (alert.role !== 'any' && job.role !== alert.role) return false
    if (alert.country !== 'any' && job.country !== alert.country) return false
    if (alert.salaryMin !== null && (job.salaryMax === null || job.salaryMax < alert.salaryMin))
      return false
    if (alert.visa === 'yes' && !job.visa) return false
    if (alert.visa === 'no' && job.visa) return false
    if (alert.title.trim()) {
      const terms = alert.title.toLowerCase().split(/\s+/).filter(Boolean)
      const haystack = `${job.title} ${job.role}`.toLowerCase()
      if (!terms.every((term) => haystack.includes(term))) return false
    }
    return true
  }).length
}

/** Search URL for an alert, so "View matching jobs" opens the real results. */
export function alertSearchUrl(alert: LocalAlert): string {
  const params = new URLSearchParams()
  if (alert.role !== 'any') params.set('role', alert.role)
  if (alert.country !== 'any') params.set('country', alert.country)
  if (alert.salaryMin !== null) params.set('salary', String(alert.salaryMin))
  if (alert.visa === 'yes') params.set('visa', '1')
  if (alert.title.trim()) params.set('q', alert.title.trim())
  const query = params.toString()
  return query ? `/jobs?${query}` : '/jobs'
}
