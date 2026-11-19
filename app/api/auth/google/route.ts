import { NextResponse } from 'next/server'
import { newId } from '@/lib/auth'

/*
 * Google sign-in, step 1: send the browser to Google's authorization page.
 *
 * The state value is a random token kept in a short-lived HttpOnly cookie so
 * the callback can tell a real Google redirect from a forged one. The
 * redirect_uri is built from this request's own origin, so the same code runs
 * on localhost and on Vercel — the value must be registered as an authorized
 * redirect URI in the Google Cloud OAuth client.
 *
 * Without GOOGLE_CLIENT_ID there is nothing to send Google, so the user is
 * sent back to /login with an honest explanation instead of a dead button.
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const origin = new URL(request.url).origin

  if (!clientId) {
    return NextResponse.redirect(
      new URL('/login?error=google-not-configured', origin),
    )
  }

  const state = newId()
  const redirectUri = `${origin}/api/auth/google/callback`
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  })

  const response = NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params}`)
  response.cookies.set('sja_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth/google',
    maxAge: 600,
  })
  return response
}
