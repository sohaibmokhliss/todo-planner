import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export default async function DebugPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>

      <div className="mb-4">
        <h2 className="font-semibold">User Status:</h2>
        <pre className="bg-gray-100 p-4 rounded mt-2">
          {JSON.stringify({ user, error }, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">Cookies:</h2>
        <pre className="bg-gray-100 p-4 rounded mt-2">
          {JSON.stringify(allCookies, null, 2)}
        </pre>
      </div>

      <div className="mt-4">
        <a href="/app" className="text-blue-600 underline">Go to App</a>
        {' | '}
        <a href="/login" className="text-blue-600 underline">Go to Login</a>
      </div>
    </div>
  )
}
