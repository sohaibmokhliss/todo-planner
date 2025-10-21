'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  validateUsername,
  validateEmail,
} from '@/lib/auth/password'
import { createSession, deleteSession, getSession } from '@/lib/auth/session'
import { generateResetToken, getResetTokenExpiration } from '@/lib/auth/tokens'

/**
 * Sign up a new user with username and password
 * Email is optional and only used for password recovery
 */
export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const username = (formData.get('username') as string)?.trim()
  const password = formData.get('password') as string
  const email = (formData.get('email') as string)?.trim() || null
  const fullName = (formData.get('full_name') as string)?.trim() || null

  // Validate username
  const usernameValidation = validateUsername(username)
  if (!usernameValidation.isValid) {
    return { error: usernameValidation.error }
  }

  // Validate password
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.error }
  }

  // Validate email if provided
  const emailValidation = validateEmail(email)
  if (!emailValidation.isValid) {
    return { error: emailValidation.error }
  }

  // Check if username already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (existingUser) {
    return { error: 'Username already taken' }
  }

  // Check if email already exists (if provided)
  if (email) {
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingEmail) {
      return { error: 'Email already registered' }
    }
  }

  // Hash the password
  const passwordHash = await hashPassword(password)

  // Create the user
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      username,
      password_hash: passwordHash,
      email,
      full_name: fullName,
    })
    .select('id, username')
    .single()

  if (error) {
    console.error('Error creating user:', error)
    return { error: 'Failed to create account. Please try again.' }
  }

  // Create a session for the new user
  await createSession(newUser.id, newUser.username)

  revalidatePath('/', 'layout')
  return { success: true }
}

/**
 * Sign in a user with username and password
 */
export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const username = (formData.get('username') as string)?.trim()
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'Username and password are required' }
  }

  // Get the user by username
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, password_hash')
    .eq('username', username)
    .single()

  if (error || !user) {
    return { error: 'Invalid username or password' }
  }

  // Verify the password
  const isValidPassword = await verifyPassword(password, user.password_hash)

  if (!isValidPassword) {
    return { error: 'Invalid username or password' }
  }

  // Create a session
  await createSession(user.id, user.username)

  revalidatePath('/', 'layout')
  return { success: true }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  await deleteSession()
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Get the current user from the session
 */
export async function getCurrentUser() {
  const session = await getSession()

  if (!session) {
    return null
  }

  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, email, full_name, avatar_url, created_at')
    .eq('id', session.userId)
    .single()

  if (error || !user) {
    // Session exists but user not found
    // We can't delete the session here because this function might be called from a Server Component
    // The session will be automatically invalid and cleaned up on next login
    return null
  }

  return user
}

/**
 * Request a password reset (sends reset token via email)
 */
export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    return { error: 'Email is required' }
  }

  // Validate email format
  const emailValidation = validateEmail(email)
  if (!emailValidation.isValid) {
    return { error: emailValidation.error }
  }

  // Find user by email
  const { data: user } = await supabase
    .from('users')
    .select('id, username, email')
    .eq('email', email)
    .single()

  // Always return success to prevent email enumeration
  // Even if the user doesn't exist
  if (!user) {
    return {
      success: true,
      message: 'If that email is registered, a reset link will be sent',
    }
  }

  // Generate reset token
  const token = generateResetToken()
  const expiresAt = getResetTokenExpiration()

  // Store the reset token
  const { error } = await supabase.from('password_reset_tokens').insert({
    user_id: user.id,
    token,
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    console.error('Error creating reset token:', error)
    return { error: 'Failed to create reset token. Please try again.' }
  }

  // TODO: Send email with reset link
  // For now, we'll just return the token in development
  // In production, you would send an email with a link like:
  // https://yourapp.com/reset-password?token={token}

  console.log('Password reset token:', token)
  console.log('Reset link:', `/reset-password?token=${token}`)

  return {
    success: true,
    message: 'If that email is registered, a reset link will be sent',
    // Remove this in production:
    devToken: process.env.NODE_ENV === 'development' ? token : undefined,
  }
}

/**
 * Reset password using a reset token
 */
export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const token = formData.get('token') as string
  const newPassword = formData.get('password') as string

  if (!token || !newPassword) {
    return { error: 'Token and new password are required' }
  }

  // Validate new password
  const passwordValidation = validatePassword(newPassword)
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.error }
  }

  // Find the reset token
  const { data: resetToken, error: tokenError } = await supabase
    .from('password_reset_tokens')
    .select('id, user_id, expires_at, used')
    .eq('token', token)
    .single()

  if (tokenError || !resetToken) {
    return { error: 'Invalid or expired reset token' }
  }

  // Check if token has been used
  if (resetToken.used) {
    return { error: 'This reset token has already been used' }
  }

  // Check if token has expired
  const expiresAt = new Date(resetToken.expires_at)
  if (new Date() > expiresAt) {
    return { error: 'Reset token has expired' }
  }

  // Hash the new password
  const passwordHash = await hashPassword(newPassword)

  // Update the user's password
  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', resetToken.user_id)

  if (updateError) {
    console.error('Error updating password:', updateError)
    return { error: 'Failed to update password. Please try again.' }
  }

  // Mark the token as used
  await supabase
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('id', resetToken.id)

  return {
    success: true,
    message: 'Password has been reset successfully',
  }
}

/**
 * Update user profile
 */
export async function updateProfile(formData: FormData) {
  const session = await getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  const supabase = await createClient()

  const fullName = (formData.get('full_name') as string)?.trim() || null
  const avatarUrl = (formData.get('avatar_url') as string)?.trim() || null
  const email = (formData.get('email') as string)?.trim() || null

  // Validate email if provided
  const emailValidation = validateEmail(email)
  if (!emailValidation.isValid) {
    return { error: emailValidation.error }
  }

  // Check if email already exists (if provided and different from current)
  if (email) {
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', session.userId)
      .single()

    if (existingEmail) {
      return { error: 'Email already in use by another account' }
    }
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name: fullName,
      avatar_url: avatarUrl,
      email,
    })
    .eq('id', session.userId)

  if (error) {
    console.error('Error updating profile:', error)
    return { error: 'Failed to update profile' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

/**
 * Change password (when user is already authenticated)
 */
export async function changePassword(formData: FormData) {
  const session = await getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  const supabase = await createClient()

  const currentPassword = formData.get('current_password') as string
  const newPassword = formData.get('new_password') as string

  if (!currentPassword || !newPassword) {
    return { error: 'Current password and new password are required' }
  }

  // Validate new password
  const passwordValidation = validatePassword(newPassword)
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.error }
  }

  // Get current user with password hash
  const { data: user, error } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', session.userId)
    .single()

  if (error || !user) {
    return { error: 'User not found' }
  }

  // Verify current password
  const isValidPassword = await verifyPassword(
    currentPassword,
    user.password_hash
  )

  if (!isValidPassword) {
    return { error: 'Current password is incorrect' }
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword)

  // Update password
  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: newPasswordHash })
    .eq('id', session.userId)

  if (updateError) {
    console.error('Error updating password:', updateError)
    return { error: 'Failed to update password' }
  }

  return {
    success: true,
    message: 'Password changed successfully',
  }
}
