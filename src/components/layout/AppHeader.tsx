'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
import { signOut } from '@/lib/actions/auth'
import { useSidebar } from '@/hooks/useSidebar'

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
  const toggleSidebar = useSidebar((state) => state.toggle)

  return (
    <header className="border-b-2 border-indigo-200 bg-white px-3 py-2.5 shadow-md dark:border-gray-700 dark:bg-gray-800 md:px-6 md:py-4">
      <div className="flex items-center justify-between gap-1.5 md:gap-4">
        {/* Left section - Hamburger Menu */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Center section - Title (centered on mobile, left-aligned on desktop) */}
        <Link
          href="/app"
          className="absolute left-1/2 -translate-x-1/2 text-lg font-bold transition-all hover:scale-105 md:static md:translate-x-0 md:text-2xl"
        >
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
            Todo Planner
          </span>
        </Link>

        {/* Search Bar - centered and responsive */}
        <div className="hidden flex-1 max-w-md mx-auto md:block">
          <SearchBar showShortcut />
        </div>

        {/* Right section - User Menu */}
        <div className="flex items-center gap-1.5 md:gap-3">
          <Link
            href="/app/profile"
            className="hidden text-sm font-medium text-gray-600 transition-all hover:scale-105 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 sm:inline"
          >
            @{user.username}
          </Link>
          <Link
            href="/app/profile"
            className="rounded-md bg-gradient-to-r from-indigo-100 to-purple-100 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition-all hover:scale-105 hover:shadow-md dark:from-indigo-900/40 dark:to-purple-900/40 dark:text-indigo-300 md:rounded-lg md:px-4 md:py-2 md:text-sm"
          >
            Profile
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:scale-105 hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-indigo-500 dark:hover:bg-gray-600 md:rounded-lg md:border-2 md:px-4 md:py-2 md:text-sm"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
