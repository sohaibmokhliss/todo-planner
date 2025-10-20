'use client'

import Link from 'next/link'
import { SearchBar } from '@/components/search/SearchBar'
import { signOut } from '@/lib/actions/auth'
import type { Database } from '@/types/database'

type User = Database['public']['Tables']['users']['Row']

interface AppHeaderProps {
  user: User
}

export function AppHeader({ user }: AppHeaderProps) {
  const displayName = user.full_name || user.username

  const handleSignOut = async () => {
    await signOut()
  }

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
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">@{user.username}</span>
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
