/**
 * Password hashing and verification utilities using bcrypt
 */

import bcrypt from 'bcryptjs'

// Number of salt rounds for bcrypt (higher = more secure but slower)
const SALT_ROUNDS = 12

/**
 * Hash a plain text password
 * @param password - The plain text password to hash
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 * @param password - The plain text password to verify
 * @param hash - The hashed password to verify against
 * @returns True if the password matches the hash, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Validate password strength
 * @param password - The password to validate
 * @returns An object with isValid and error message
 */
export function validatePassword(password: string): {
  isValid: boolean
  error?: string
} {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters long',
    }
  }

  if (password.length > 128) {
    return {
      isValid: false,
      error: 'Password must be less than 128 characters',
    }
  }

  // Optional: Add more strength requirements
  // const hasUpperCase = /[A-Z]/.test(password)
  // const hasLowerCase = /[a-z]/.test(password)
  // const hasNumbers = /\d/.test(password)
  // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  return { isValid: true }
}

/**
 * Validate username format
 * @param username - The username to validate
 * @returns An object with isValid and error message
 */
export function validateUsername(username: string): {
  isValid: boolean
  error?: string
} {
  if (!username || username.length < 3) {
    return {
      isValid: false,
      error: 'Username must be at least 3 characters long',
    }
  }

  if (username.length > 30) {
    return {
      isValid: false,
      error: 'Username must be less than 30 characters',
    }
  }

  // Only allow alphanumeric and underscores
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, and underscores',
    }
  }

  return { isValid: true }
}

/**
 * Validate email format (optional field)
 * @param email - The email to validate
 * @returns An object with isValid and error message
 */
export function validateEmail(email: string | null | undefined): {
  isValid: boolean
  error?: string
} {
  // Email is optional
  if (!email) {
    return { isValid: true }
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Invalid email format',
    }
  }

  return { isValid: true }
}
