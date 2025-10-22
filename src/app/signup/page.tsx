import { Suspense } from 'react'
import { SignupForm } from './SignupForm'

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
