import { NextResponse } from 'next/server'
import { unsubKey } from '@/lib/accounts'
import {
  AUTH_READY,
  createSessionToken,
  findUserByEmail,
  newId,
  sessionCookie,
  type StoredUser,
  userIdKey,
  userKey,
} from '@/lib/auth'
import { STORE_READY, setJson } from '@/lib/store'

/*
 * Google sign-in, step 2: Google redirects back here with a code.
 *
 * The state query value must match the cookie set when the flow started,
 * otherwise the redirect is rejected. The code is exchanged for tokens, the
 * profile is fetched from Google's userinfo endpoint, and the account is
 * found or created in the same Redis store the email sign-in uses — a Google
 * account has no password, so its passwordHash is empty and email/password
 * sign-in for it always fails closed. The session cookie is set exactly the
 * way the register route sets it, then the user lands on /account.
 *
 * Every failure path redirects to /login with a fixed error key the login
 * page turns into an honest message — never a stack trace, never a crash.
 */

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'

function fail(origin: string, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, origin))
}

interface GoogleUserInfo {
  sub?: string
  email?: string
  email_verified?: boolean
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin

  const state = url.searchParams.get('state')
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error || !state || !code) return fail(origin, 'google-failed')

  const stateCookie = request.headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('sja_oauth_state='))
    ?.slice('sja_oauth_state='.length)

  if (!stateCookie || stateCookie !== state) return fail(origin, 'google-failed')

  if (!STORE_READY || !AUTH_READY) return fail(origin, 'accounts-not-configured')

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return fail(origin, 'google-not-configured')

  const redirectUri = `${origin}/api/auth/google/callback`

  // Exchange the code for an access token.
  let tokenResponse: Response
  try {
    tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      cache: 'no-store',
    })
  } catch {
    return fail(origin, 'google-failed')
  }

  if (!tokenResponse.ok) return fail(origin, 'google-failed')
  const tokens = (await tokenResponse.json().catch(() => null)) as {
    access_token?: string
  } | null
  if (!tokens?.access_token) return fail(origin, 'google-failed')

  // Fetch the profile the token belongs to.
  let profileResponse: Response
  try {
    profileResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: 'no-store',
    })
  } catch {
    return fail(origin, 'google-failed')
  }

  if (!profileResponse.ok) return fail(origin, 'google-failed')
  const profile = (await profileResponse.json().catch(() => null)) as GoogleUserInfo | null
  const email = profile?.email?.trim().toLowerCase()
  if (!email) return fail(origin, 'google-failed')

  // Find the account, or create one with the same shape as email sign-up.
  let user = await findUserByEmail(email)
  if (!user) {
    const created: StoredUser = {
      id: newId(),
      email,
      // Google accounts have no password; email/password sign-in for them
      // fails closed in verifyPassword.
      passwordHash: '',
      createdAt: new Date().toISOString(),
      digestEnabled: false,
      digestFrequency: 'weekly',
      unsubscribeToken: newId(20),
    }
    const saved = await setJson(userKey(created.email), created)
    const indexed = await setJson(userIdKey(created.id), created.email)
    await setJson(unsubKey(created.unsubscribeToken), created.id)
    if (!saved || !indexed) return fail(origin, 'google-failed')
    user = created
  }

  const response = NextResponse.redirect(new URL('/account', origin))
  response.cookies.set(sessionCookie.name, createSessionToken(user.id), sessionCookie.options)
  // The state cookie has served its purpose.
  response.cookies.set('sja_oauth_state', '', { path: '/api/auth/google', maxAge: 0 })
  return response
}
