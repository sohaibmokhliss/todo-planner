/**
 * Session management utilities for HTTP-only cookies
 */

import { cookies } from 'next/headers'
import { generateAccessToken, verifyAccessToken } from './jwt'

const SESSION_COOKIE_NAME = 'session'
const MAX_AGE = 60 * 60 * 24 // 24 hours in seconds

export interface SessionData {
  userId: string
  username: string
}

/**
 * Create a new session and set the session cookie
 * @param userId - The user's ID
 * @param username - The user's username
 */
export async function createSession(
  userId: string,
  username: string
): Promise<void> {
  const token = await generateAccessToken({ userId, username })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
}

/**
 * Get the current session from cookies
 * @returns The session data or null if no valid session exists
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const payload = await verifyAccessToken(token)

  if (!payload || !payload.userId || !payload.username) {
    return null
  }

  return {
    userId: payload.userId,
    username: payload.username,
  }
}

/**
 * Delete the session cookie
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Refresh the session cookie (extend expiration)
 * @param userId - The user's ID
 * @param username - The user's username
 */
export async function refreshSession(
  userId: string,
  username: string
): Promise<void> {
  await createSession(userId, username)
}

/**
 * Get session from request cookies (for middleware)
 * @param requestCookies - The cookies from the request
 * @returns The session data or null if no valid session exists
 */
export async function getSessionFromCookies(
  requestCookies: Map<string, string>
): Promise<SessionData | null> {
  const token = requestCookies.get(SESSION_COOKIE_NAME)

  if (!token) {
    return null
  }

  const payload = await verifyAccessToken(token)

  if (!payload || !payload.userId || !payload.username) {
    return null
  }

  return {
    userId: payload.userId,
    username: payload.username,
  }
}

/**
 * Set session cookie in response (for middleware)
 * @param token - The JWT token
 * @param responseCookies - The cookies object from the response
 */
export function setSessionCookie(
  token: string,
  responseCookies: {
    set: (
      name: string,
      value: string,
      options: {
        httpOnly: boolean
        secure: boolean
        sameSite: 'lax' | 'strict' | 'none'
        maxAge: number
        path: string
      }
    ) => void
  }
): void {
  responseCookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
}
