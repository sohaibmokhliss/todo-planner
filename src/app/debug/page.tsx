import { getCurrentUser } from '@/lib/actions/auth'
import { getSession } from '@/lib/auth/session'
import { cookies } from 'next/headers'

export default async function DebugPage() {
  const user = await getCurrentUser()
  const session = await getSession()
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Custom Auth Debug</h1>

      <div className="mb-4">
        <h2 className="font-semibold">User Status:</h2>
        <pre className="mt-2 rounded bg-gray-100 p-4">
          {JSON.stringify(
            user
              ? {
                  id: user.id,
                  username: user.username,
                  email: user.email || 'Not provided',
                  full_name: user.full_name,
                  created_at: user.created_at,
                }
              : { message: 'Not logged in' },
            null,
            2
          )}
        </pre>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">Session:</h2>
        <pre className="mt-2 rounded bg-gray-100 p-4">
          {JSON.stringify(session || { message: 'No active session' }, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">Cookies:</h2>
        <pre className="mt-2 rounded bg-gray-100 p-4">
          {JSON.stringify(
            allCookies.map((c) => ({
              name: c.name,
              value: c.value.substring(0, 20) + '...',
            })),
            null,
            2
          )}
        </pre>
      </div>

      <div className="mt-4">
        <a href="/app" className="text-blue-600 underline">
          Go to App
        </a>
        {' | '}
        <a href="/login" className="text-blue-600 underline">
          Go to Login
        </a>
        {' | '}
        <a href="/check-auth" className="text-blue-600 underline">
          Check Auth
        </a>
      </div>
    </div>
  )
}
