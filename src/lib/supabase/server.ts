import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth/session'

/**
 * Create a Supabase client for server-side usage with custom authentication
 * This client automatically sets the user context for RLS policies
 *
 * NOTE: For create/update/delete operations with explicit user_id checks,
 * prefer using createAdminClient() to avoid the RPC overhead.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch {
            // The `remove` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  // Set user context for RLS policies
  // This is only needed for SELECT queries that rely on RLS policies
  const session = await getSession()
  if (session?.userId) {
    // Set the user_id in the database session for RLS to use
    try {
      await client.rpc('set_user_context', { user_id: session.userId })
    } catch (error) {
      // Silently fail - RLS policies will still work with explicit user_id in queries
      console.error('Failed to set user context:', error)
    }
  }

  return client
}

/**
 * Create a Supabase client without user context (for public operations)
 * Use this for operations that don't require authentication
 */
export async function createPublicClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // Ignore
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch {
            // Ignore
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase admin client with service role key
 * This bypasses RLS - use only for trusted server-side operations
 * where you explicitly control user_id
 */
export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // Ignore
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch {
            // Ignore
          }
        },
      },
    }
  )
}
