'use client'

import Link from 'next/link'
import { SearchBar } from '@/components/search/SearchBar'
import { signOut } from '@/lib/actions/auth'

interface User {
  id: string
  username: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
}

interface AppHeaderProps {
  user: User
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/app"
          className="text-2xl font-bold text-gray-900 dark:text-white shrink-0 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          Todo Planner
        </Link>

        {/* Search Bar - centered and responsive */}
        <div className="hidden md:block flex-1 max-w-md mx-auto">
          <SearchBar showShortcut />
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/app/profile"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hidden sm:inline"
          >
            @{user.username}
          </Link>
          <Link
            href="/app/profile"
            className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Profile
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
