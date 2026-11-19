import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { AuthForm } from '@/components/account/auth-form'
import { AUTH_READY, getSessionUserId } from '@/lib/auth'
import { STORE_READY } from '@/lib/store'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to save job lists and get new structural engineering roles emailed to you.',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: true },
}

const LOGIN_ERRORS: Record<string, string> = {
  'google-not-configured':
    'Google sign-in is not set up for this site yet. The site owner needs to add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel.',
  'google-failed':
    'Google sign-in did not complete. Please try again, or sign in with email below.',
  'accounts-not-configured':
    'Accounts are not switched on for this deployment yet. Everything else on the board works as normal.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>
}) {
  if (await getSessionUserId()) redirect('/account')

  const error = (await searchParams)?.error
  const errorMessage = error ? LOGIN_ERRORS[error] : undefined

  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title="Sign in"
        description="Saved lists and email alerts for new structural engineering roles."
        breadcrumbs={[{ label: 'Sign in', href: '/login' }]}
      />
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6 lg:px-8">
        {errorMessage && (
          <p
            role="alert"
            className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {errorMessage}
          </p>
        )}
        {!STORE_READY || !AUTH_READY ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Accounts are not switched on for this deployment yet. Everything else on the board works
            as normal.
          </p>
        ) : (
          <AuthForm mode="login" />
        )}
      </div>
    </>
  )
}
