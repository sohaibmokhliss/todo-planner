import { getCurrentUser } from '@/lib/actions/auth'
import { getSession } from '@/lib/auth/session'

export default async function CheckAuthPage() {
  const user = await getCurrentUser()
  const session = await getSession()

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Authentication Diagnostic</h1>

      <div className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-xl font-semibold">Authentication Type</h2>
          <p className="text-green-600 dark:text-green-400">
            ✅ Custom Username-Based Authentication
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-xl font-semibold">User Status</h2>
          <pre className="overflow-auto rounded bg-gray-100 p-4 dark:bg-gray-900">
            {JSON.stringify(
              user
                ? {
                    id: user.id,
                    username: user.username,
                    email: user.email || 'Not provided',
                    full_name: user.full_name,
                  }
                : { message: 'Not logged in' },
              null,
              2
            )}
          </pre>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-xl font-semibold">Session Status</h2>
          <pre className="overflow-auto rounded bg-gray-100 p-4 dark:bg-gray-900">
            {JSON.stringify(
              session
                ? {
                    userId: session.userId,
                    username: session.username,
                    status: 'Active',
                  }
                : { message: 'No active session' },
              null,
              2
            )}
          </pre>
        </div>

        <div className="rounded border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-2 font-semibold">Authentication Info:</h3>
          <ul className="list-inside list-disc space-y-1">
            <li>Login with username + password</li>
            <li>Email is optional (only for password recovery)</li>
            <li>Sessions managed via JWT tokens</li>
            <li>No email confirmation required</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <a
            href="/signup"
            className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
          >
            Go to Signup
          </a>
          <a
            href="/login"
            className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-500"
          >
            Go to Login
          </a>
          {user && (
            <a
              href="/app"
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-500"
            >
              Go to App
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
