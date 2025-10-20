import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth/session'

/**
 * Create a Supabase client for server-side usage with custom authentication
 * This client automatically sets the user context for RLS policies
 */
export async function createClient() {
  const cookieStore = await cookies()

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  // Set user context for RLS policies
  const session = await getSession()
  if (session?.userId) {
    // Set the user_id in the database session for RLS to use
    // Note: We catch and ignore errors here because set_user_context might fail
    // in some connection pooling scenarios. The RLS policies should still work
    // because we explicitly set user_id in queries.
    try {
      await client.rpc('set_user_context', { user_id: session.userId })
    } catch (error) {
      // Log but don't throw - we'll rely on explicit user_id in queries
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
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
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
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ignore
          }
        },
      },
    }
  )
}
