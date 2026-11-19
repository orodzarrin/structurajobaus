'use client'

import { useEffect, useState } from 'react'
import { Bookmark, ChevronDown, Mail, Star, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useDropdown } from './use-dropdown'
import { useLiveStore } from '@/lib/live-store'

/**
 * Profile menu in the header, modelled on the reference panel.
 *
 * Signed out, it shows "Not signed in" with "Continue with Google" and
 * "Email sign-in". Google goes straight to /api/auth/google, which redirects
 * to Google when GOOGLE_CLIENT_ID is set and back to /login with an honest
 * explanation when it is not. Email sign-in goes to the site's sign-in page
 * (/login). That page is honest about accounts: without Upstash/Auth keys it
 * shows the setup notice, so nothing here pretends a sign-in happened.
 *
 * Counts are real: "Favourite roles" is the bookmarked jobs on this device
 * (localStorage); "Saved lists" is the signed-in account's server lists
 * (fetched from /api/lists, 0 when signed out).
 */
export function ProfileMenu({ email }: { email: string | null | undefined }) {
  const { open, setOpen, ref } = useDropdown()
  const { savedIds } = useLiveStore()
  const [listCount, setListCount] = useState<number | null>(null)

  useEffect(() => {
    if (!open || !email) return
    let active = true
    fetch('/api/lists', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : { lists: [] }))
      .then((payload: { lists?: unknown[] }) => {
        if (active) setListCount(Array.isArray(payload.lists) ? payload.lists.length : 0)
      })
      .catch(() => {
        if (active) setListCount(0)
      })
    return () => {
      active = false
    }
  }, [open, email ])

  if (email === undefined) {
    return (
      <span
        className="hidden h-9 w-24 animate-pulse rounded-md bg-muted sm:block"
        aria-hidden="true"
      />
    )
  }

  const accountName = email ? email.split('@')[0] : null

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={email ? `Profile — signed in as ${email}` : 'Profile — not signed in'}
        title={email ? `Signed in as ${email}` : 'Profile'}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border bg-card px-3 text-sm font-medium whitespace-nowrap transition-colors hover:border-primary/40"
      >
        <UserRound className="size-4" aria-hidden="true" />
        {/* Text label hidden on phones: with the theme toggle, settings,
            profile and hamburger, the header row overflows 390px screens
            and pushes the hamburger off-screen. The button keeps its
            aria-label, so it stays identifiable without the text. */}
        <span className="hidden max-w-[8rem] truncate sm:inline">{accountName ?? 'Profile'}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Profile"
          className="absolute top-11 right-0 z-50 w-[19rem] max-w-[calc(100vw-2rem)] rounded-xl border bg-popover p-4 text-popover-foreground shadow-xl"
        >
          {email ? (
            <>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
                >
                  {accountName?.charAt(0).toUpperCase() ?? '?'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{accountName}</p>
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-1">
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted"
                >
                  My account
                </Link>
                <Link
                  href="/alerts"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted"
                >
                  Job alerts
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                  <UserRound className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Not signed in</p>
                  <p className="text-xs text-muted-foreground">
                    Sign in to keep favourites and filters on every device.
                  </p>
                </div>
              </div>
              <Link
                href="/api/auth/google"
                onClick={() => setOpen(false)}
                className="mt-4 flex h-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Continue with Google
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-2 flex h-10 items-center justify-center gap-2 rounded-full border text-sm font-medium transition-colors hover:bg-muted"
              >
                <Mail className="size-4" aria-hidden="true" />
                Email sign-in
              </Link>
              <p className="mt-3 text-xs text-muted-foreground">
                Daily email alerts for your saved filters &amp; favourites come with an account.
              </p>
            </>
          )}

          <div className="mt-4 border-t pt-3">
            <Link
              href="/saved"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-md px-1 py-1.5 text-sm hover:bg-muted"
            >
              <span className="inline-flex items-center gap-2">
                <Star className="size-4 text-muted-foreground" aria-hidden="true" />
                Favourite roles
              </span>
              <span className="font-mono text-sm tabular-nums">{savedIds.length}</span>
            </Link>
            <Link
              href="/alerts"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-md px-1 py-1.5 text-sm hover:bg-muted"
            >
              <span className="inline-flex items-center gap-2">
                <Bookmark className="size-4 text-muted-foreground" aria-hidden="true" />
                Saved lists
              </span>
              <span className="font-mono text-sm tabular-nums">
                {email ? (listCount ?? '…') : 0}
              </span>
            </Link>
            <p className="mt-2 px-1 text-xs text-muted-foreground">Saved on this device.</p>
          </div>
        </div>
      )}
    </div>
  )
}
