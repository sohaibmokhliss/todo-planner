import { getCurrentUser } from '@/lib/actions/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function Home() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/app')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="mb-4 text-5xl font-bold text-gray-900 dark:text-white">Todo Planner</h1>
        <p className="mb-8 text-xl text-gray-600 dark:text-gray-400">
          A modern to-do & personal planning web app
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  )
}
