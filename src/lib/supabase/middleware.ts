import { NextResponse, type NextRequest } from 'next/server'
import { generateAccessToken } from '@/lib/auth/jwt'
import { setSessionCookie } from '@/lib/auth/session'
import { verifyAccessToken } from '@/lib/auth/jwt'

const SESSION_COOKIE_NAME = 'session'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search
  const isProtectedRoute = pathname.startsWith('/app')
  const isAuthRoute = pathname === '/login' || pathname === '/signup'

  // Get session token from cookies
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  // Verify the token
  let user: { userId: string; username: string } | null = null
  let shouldClearInvalidSessionCookie = false
  if (token) {
    const payload = await verifyAccessToken(token)
    if (payload?.userId && payload?.username) {
      user = {
        userId: payload.userId,
        username: payload.username,
      }
    } else {
      shouldClearInvalidSessionCookie = true
    }
  }

  let response: NextResponse

  // Redirect logic
  if (!user && isProtectedRoute) {
    // User is not authenticated and trying to access protected route
    const redirectTarget = `${pathname}${search}`
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', redirectTarget)
    response = NextResponse.redirect(loginUrl)
  } else if (user && isAuthRoute) {
    // User is authenticated and trying to access auth pages
    const redirectParam = request.nextUrl.searchParams.get('redirect')
    const safeRedirect =
      redirectParam && redirectParam.startsWith('/') ? redirectParam : '/app'
    response = NextResponse.redirect(new URL(safeRedirect, request.url))
  } else {
    // Allow the request to proceed
    response = NextResponse.next()
  }

  // Refresh active sessions to avoid abrupt hard expiry for users
  // who continue using the app throughout the day.
  if (user) {
    const refreshedToken = await generateAccessToken(user)
    setSessionCookie(refreshedToken, response.cookies)
  } else if (shouldClearInvalidSessionCookie) {
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
  }

  return response
}
