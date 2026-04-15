/**
 * JWT token generation and verification using jose
 */

import { SignJWT, jwtVerify } from 'jose'

const FALLBACK_JWT_SECRET = 'your-secret-key-change-this-in-production'

let hasWarnedAboutFallbackSecret = false

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET

  if (secret) {
    return new TextEncoder().encode(secret)
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production')
  }

  if (!hasWarnedAboutFallbackSecret) {
    hasWarnedAboutFallbackSecret = true
    console.warn('JWT_SECRET is not set. Falling back to the development default secret.')
  }

  return new TextEncoder().encode(FALLBACK_JWT_SECRET)
}

// Token expiration times
const ACCESS_TOKEN_EXPIRES_IN = '24h' // 24 hours

export interface JWTPayload {
  userId: string
  username: string
  iat?: number
  exp?: number
}

/**
 * Generate a JWT access token
 * @param payload - The payload to encode in the token
 * @returns The signed JWT token
 */
export async function generateAccessToken(payload: {
  userId: string
  username: string
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    username: payload.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(getJwtSecret())
}

/**
 * Verify and decode a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded payload or null if invalid
 */
export async function verifyAccessToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    // Validate payload has required fields
    if (payload && typeof payload.userId === 'string' && typeof payload.username === 'string') {
      return payload as unknown as JWTPayload
    }
    return null
  } catch {
    // Token is invalid or expired
    return null
  }
}

/**
 * Get the expiration time for access tokens in seconds
 * @returns The expiration time in seconds
 */
export function getAccessTokenExpiresIn(): number {
  // 24 hours in seconds
  return 24 * 60 * 60
}

/**
 * Get the expiration date for access tokens
 * @returns The expiration date
 */
export function getAccessTokenExpirationDate(): Date {
  const expiresIn = getAccessTokenExpiresIn()
  return new Date(Date.now() + expiresIn * 1000)
}
