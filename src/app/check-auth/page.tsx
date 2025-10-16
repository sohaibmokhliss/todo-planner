import { createClient } from '@/lib/supabase/server'

export default async function CheckAuthPage() {
  const supabase = await createClient()

  // Check if we can connect to Supabase
  const { data: tables, error: tablesError } = await supabase
    .from('tasks')
    .select('*')
    .limit(1)

  // Try to get user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  // Check auth session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Authentication Diagnostic</h1>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Supabase Connection</h2>
          <div className="space-y-2">
            <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            <p><strong>Key (first 20 chars):</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
            <p><strong>Can query tables:</strong> {tablesError ? '❌ No - ' + tablesError.message : '✅ Yes'}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">User Status</h2>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto">
            {JSON.stringify({ user, error: userError }, null, 2)}
          </pre>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Session Status</h2>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto">
            {JSON.stringify({
              session: session ? {
                access_token: session.access_token?.substring(0, 20) + '...',
                refresh_token: session.refresh_token?.substring(0, 20) + '...',
                expires_at: session.expires_at,
                user: session.user?.email
              } : null,
              error: sessionError
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded">
          <h3 className="font-semibold mb-2">Next Steps:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>If "Can query tables" is ❌, run the database migration in Supabase SQL Editor</li>
            <li>If user is null, check Supabase Dashboard → Authentication → Users</li>
            <li>Try signing up at <a href="/signup" className="text-blue-600 underline">/signup</a></li>
            <li>Check email confirmation settings in Supabase Dashboard → Authentication → Providers</li>
          </ol>
        </div>

        <div className="flex gap-4">
          <a href="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500">
            Go to Signup
          </a>
          <a href="/login" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500">
            Go to Login
          </a>
          <a href="/debug" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500">
            Debug Page
          </a>
        </div>
      </div>
    </div>
  )
}
