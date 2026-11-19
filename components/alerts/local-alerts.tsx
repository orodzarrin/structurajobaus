'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { CountryCount } from '@/lib/jobs'
import {
  FREQUENCY_LABELS,
  addAlert,
  alertSearchUrl,
  countMatches,
  deleteAlert,
  loadAlerts,
  type AlertFrequency,
  type AlertJobRow,
  type LocalAlert,
  type VisaChoice,
} from '@/lib/local-alerts'
import { INDUSTRY_ROLES, SALARY_OPTIONS } from '@/lib/taxonomy'

const inputClass =
  'h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

function roleName(slug: string) {
  return INDUSTRY_ROLES.find((role) => role.slug === slug)?.name ?? slug
}

export function LocalAlerts({ countries, jobs }: { countries: CountryCount[]; jobs: AlertJobRow[] }) {
  const [alerts, setAlerts] = useState<LocalAlert[] | null>(null)
  const [title, setTitle] = useState('')
  const [role, setRole] = useState('any')
  const [country, setCountry] = useState('any')
  const [salary, setSalary] = useState('')
  const [visa, setVisa] = useState<VisaChoice>('any')
  const [frequency, setFrequency] = useState<AlertFrequency>('weekly')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  // localStorage only exists in the browser: read it after mount so the
  // first server render matches and nothing flashes or mismatches.
  useEffect(() => {
    setAlerts(loadAlerts(window.localStorage))
  }, [])

  function createAlert(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim() && role === 'any') {
      setError('Give the alert a job title, or pick a role.')
      return
    }
    setError(null)
    const next = addAlert(window.localStorage, {
      title: title.trim(),
      role,
      country,
      salaryMin: salary ? Number(salary) : null,
      visa,
      frequency,
      email: email.trim() || undefined,
    })
    setAlerts(next)
    setTitle('')
    setRole('any')
    setCountry('any')
    setSalary('')
    setVisa('any')
    setFrequency('weekly')
    setEmail('')
  }

  function removeAlert(id: string) {
    setAlerts(deleteAlert(window.localStorage, id))
  }

  return (
    <div className="mt-8">
      <form
        onSubmit={createAlert}
        aria-label="Create a job alert"
        className="rounded-lg border bg-card p-5"
      >
        <h2 className="font-semibold">Create a job alert</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Saved on this device — no account needed. Email delivery starts once accounts are
          switched on; the frequency you pick is saved with the alert.
        </p>

        <div className="mt-4 flex flex-col gap-4">
          <div>
            <label htmlFor="alert-title" className="mb-1.5 block text-sm font-medium">
              Job title / role
            </label>
            <input
              id="alert-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Structural Engineer"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="alert-role" className="mb-1.5 block text-sm font-medium">
              Role
            </label>
            <select
              id="alert-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className={inputClass}
            >
              <option value="any">Any role</option>
              {INDUSTRY_ROLES.map((entry) => (
                <option key={entry.slug} value={entry.slug}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="alert-country" className="mb-1.5 block text-sm font-medium">
              Country
            </label>
            <select
              id="alert-country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className={inputClass}
            >
              <option value="any">Any country</option>
              {countries.map((entry) => (
                <option key={entry.slug} value={entry.slug}>
                  {entry.country} ({entry.count} roles)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="alert-salary" className="mb-1.5 block text-sm font-medium">
              Minimum salary
            </label>
            <select
              id="alert-salary"
              value={salary}
              onChange={(event) => setSalary(event.target.value)}
              className={inputClass}
            >
              <option value="">Any salary</option>
              {SALARY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium">Visa sponsorship</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              {(
                [
                  ['any', 'Any'],
                  ['yes', 'Yes'],
                  ['no', 'No'],
                ] as [VisaChoice, string][]
              ).map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="alert-visa"
                    value={value}
                    checked={visa === value}
                    onChange={() => setVisa(value)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="alert-frequency" className="mb-1.5 block text-sm font-medium">
              Email frequency
            </label>
            <select
              id="alert-frequency"
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as AlertFrequency)}
              className={inputClass}
            >
              {(Object.keys(FREQUENCY_LABELS) as AlertFrequency[]).map((value) => (
                <option key={value} value={value}>
                  {FREQUENCY_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="alert-email" className="mb-1.5 block text-sm font-medium">
              Email <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="alert-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Only used to send the alert once email delivery is switched on.
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-5 h-10 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Create alert
        </button>
      </form>

      <div className="mt-8">
        <h2 className="font-semibold">My alerts</h2>
        {alerts === null ? (
          <p className="mt-2 text-sm text-muted-foreground">Loading your alerts…</p>
        ) : alerts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No alerts yet — create one above and new matching roles will be flagged for you.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {alerts.map((alert) => {
              const matches = countMatches(alert, jobs)
              const countryName =
                alert.country === 'any'
                  ? 'Any country'
                  : (countries.find((entry) => entry.slug === alert.country)?.country ??
                    alert.country)
              return (
                <li key={alert.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {alert.title || roleName(alert.role)}
                        {alert.title && alert.role !== 'any' ? ` · ${roleName(alert.role)}` : ''}
                      </p>
                      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{countryName}</span>
                        <span>
                          {alert.salaryMin !== null ? `$${alert.salaryMin.toLocaleString()}+` : 'Any salary'}
                        </span>
                        <span>
                          Visa:{' '}
                          {alert.visa === 'any' ? 'any' : alert.visa === 'yes' ? 'yes' : 'no'}
                        </span>
                        <span>{FREQUENCY_LABELS[alert.frequency]}</span>
                        {alert.email && <span>{alert.email}</span>}
                      </p>
                      <p className="mt-2 text-sm">
                        <Link href={alertSearchUrl(alert)} className="text-primary hover:underline">
                          {matches} matching {matches === 1 ? 'job' : 'jobs'} — view them
                        </Link>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAlert(alert.id)}
                      aria-label={`Delete alert ${alert.title || roleName(alert.role)}`}
                      className="shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-red-300 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
