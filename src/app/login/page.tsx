import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-100 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
        <div className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
