'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ProfileMenu } from '@/components/live/profile-menu'
import { SavedRolesPill } from '@/components/live/saved-roles-pill'
import { SettingsMenu } from '@/components/live/settings-menu'
import { ThemeToggle } from '@/components/live/theme-toggle'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/industry', label: 'Industry Jobs' },
  { href: '/countries', label: 'Browse by Country' },
  // The home page's "Browse by discipline" section (all civil disciplines
  // with live counts) and the visa-sponsored filtered jobs list.
  { href: '/#disciplines', label: 'Browse by Discipline' },
  { href: '/jobs?visa=1', label: 'Visa Sponsored' },
  { href: '/alerts', label: 'Job alerts' },
]

/**
 * Sign-up and sign-in sit in the Profile menu in the top-right corner, where
 * people look for an account button: its panel holds "Continue with Google"
 * and "Email sign-in" — Google to /api/auth/google, email to the sign-in page.
 *
 * The header is the same for every page, so it asks the server who is signed in
 * from the browser (/api/auth/me) instead of reading the session cookie in the
 * layout - that would make every page dynamic. Until the answer arrives the
 * account slot holds its width, so nothing jumps.
 */
const MOBILE_LINKS = [
  { href: '/jobs', label: 'Search all jobs' },
  { href: '/saved', label: 'Saved jobs' },
  { href: '/signup', label: 'Create account' },
  { href: '/login', label: 'Sign in' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    let active = true
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : { email: null }))
      .then((payload: { email?: string | null }) => {
        if (active) setEmail(payload?.email ?? null)
      })
      .catch(() => {
        if (active) setEmail(null)
      })
    return () => {
      active = false
    }
  }, [pathname])

  const accountName = email ? email.split('@')[0] : null
  const mobileLinks = email
    ? [
        { href: '/jobs', label: 'Search all jobs' },
        { href: '/saved', label: 'Saved jobs' },
        { href: '/account', label: 'My account' },
      ]
    : [...MOBILE_LINKS]

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Logo />

        {/*
         * Five links plus the account controls only fit on one line from
         * 1280px up, so the nav appears at xl and the hamburger covers
         * everything narrower. Everything is nowrap: a wrapped label is
         * what made the bar look ragged.
         */}
        <nav aria-label="Main" className="hidden items-center gap-0.5 xl:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-md px-2 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted hover:text-foreground',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/*
         * Right cluster: saved-roles count, day/night toggle, settings and
         * profile — the live-careers header controls. The nav is hidden below
         * xl, so on narrow screens these stay visible next to the hamburger.
         */}
        <div className="flex shrink-0 items-center gap-1.5">
          <SavedRolesPill />
          <ThemeToggle />
          <SettingsMenu />
          <ProfileMenu email={email} />

          <button
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t bg-background xl:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {[...NAV_ITEMS, ...mobileLinks].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium whitespace-nowrap hover:bg-muted"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {email && (
              <li className="px-3 py-2 text-xs text-muted-foreground">Signed in as {email}</li>
            )}
          </ul>
        </nav>
      )}
    </header>
  )
}
