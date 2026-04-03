import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Daily keepalive endpoint for Vercel Cron.
 *
 * Vercel automatically sends `Authorization: Bearer <CRON_SECRET>`
 * when the CRON_SECRET environment variable is configured.
 *
 * Strategy:
 * 1. Prefer a dedicated heartbeat upsert if `project_heartbeat` exists.
 * 2. Fall back to a lightweight read from `users` so the route still works
 *    even if the heartbeat table has not been added yet.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured' },
      { status: 500 }
    )
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createAdminClient()
    const checkedAt = new Date().toISOString()

    const { error: heartbeatError } = await supabase
      .from('project_heartbeat')
      .upsert(
        {
          id: 'vercel-cron',
          last_seen: checkedAt,
        },
        { onConflict: 'id' }
      )

    if (!heartbeatError) {
      return NextResponse.json({
        ok: true,
        mode: 'write',
        checkedAt,
      })
    }

    // Fall back to a lightweight read so the keepalive still works
    // even if the optional heartbeat table has not been added yet.
    if (heartbeatError.code === '42P01') {
      const { count, error: readError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .limit(1)

      if (readError) {
        console.error('Heartbeat read failed:', readError)
        return NextResponse.json(
          {
            error: 'Heartbeat fallback failed',
            details: readError.message,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        ok: true,
        mode: 'read',
        checkedAt,
        userCount: count ?? 0,
        note: 'Add the optional project_heartbeat table for a dedicated write-based keepalive.',
      })
    }

    console.error('Heartbeat write failed:', heartbeatError)
    return NextResponse.json(
      {
        error: 'Heartbeat failed',
        details: heartbeatError.message,
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('Heartbeat route failed:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
