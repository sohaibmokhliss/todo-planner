'use client'

import { signUp } from '@/lib/actions/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    // Validate password confirmation
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.hasSession) {
      // Email confirmation disabled - redirect to app
      await new Promise(resolve => setTimeout(resolve, 100))
      window.location.href = '/app'
    } else {
      // Email confirmation enabled - show success message
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                We&apos;ve sent you a confirmation link. Please check your email and click the link to
                verify your account.
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start planning and organizing your tasks
          </p>
        </div>

        <div className="mt-8 rounded-lg bg-white p-8 shadow dark:bg-gray-800">
          <form action={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Full name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 sm:text-sm"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 sm:text-sm"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirm_password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Confirm password
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
