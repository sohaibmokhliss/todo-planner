/**
 * Password reset token generation and validation
 */

import { nanoid } from 'nanoid'

/**
 * Generate a secure random token for password reset
 * @returns A random token string
 */
export function generateResetToken(): string {
  // Generate a 32-character random token
  return nanoid(32)
}

/**
 * Get the expiration time for reset tokens (1 hour from now)
 * @returns The expiration date
 */
export function getResetTokenExpiration(): Date {
  const expiresIn = 60 * 60 * 1000 // 1 hour in milliseconds
  return new Date(Date.now() + expiresIn)
}

/**
 * Check if a reset token has expired
 * @param expiresAt - The expiration date of the token
 * @returns True if the token has expired, false otherwise
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}
