import { getUser, signOut } from '@/lib/actions/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  // Temporarily allow access without auth for testing
  const displayEmail = user?.email || 'demo@example.com (no auth)'

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Todo Planner</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">{displayEmail}</span>
            {user && (
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Sign out
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
