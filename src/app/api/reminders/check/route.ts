import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail, generateReminderEmail } from '@/lib/services/email'

/**
 * API Route to check and send due reminders
 *
 * This endpoint can be called:
 * 1. Manually for testing: GET http://localhost:3000/api/reminders/check
 * 2. By a cron job in production (e.g., Vercel Cron, GitHub Actions)
 *
 * To set up a cron job in production:
 * - Add a vercel.json with cron configuration
 * - Or use external cron services like cron-job.org
 */

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication to prevent abuse
    // const authHeader = request.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const supabase = await createAdminClient()

    // Find reminders that are due (time is in the past or within the next 5 minutes)
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    const now = new Date().toISOString()

    const { data: dueReminders, error: remindersError } = await supabase
      .from('reminders')
      .select(`
        id,
        type,
        time,
        sent,
        tasks (
          id,
          title,
          due_date,
          users (
            id,
            username,
            email
          )
        )
      `)
      .eq('sent', false)
      .lte('time', fiveMinutesFromNow)
      .gte('time', now)

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError)
      return NextResponse.json(
        { error: 'Failed to fetch reminders', details: remindersError.message },
        { status: 500 }
      )
    }

    if (!dueReminders || dueReminders.length === 0) {
      return NextResponse.json({
        message: 'No reminders due at this time',
        checked: now,
        count: 0,
      })
    }

    const results = {
      total: dueReminders.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process each reminder
    for (const reminder of dueReminders) {
      try {
        const task = Array.isArray(reminder.tasks) ? reminder.tasks[0] : reminder.tasks
        const user = task?.users ? (Array.isArray(task.users) ? task.users[0] : task.users) : null

        if (!task || !user) {
          results.failed++
          results.errors.push(`Reminder ${reminder.id}: Task or user not found`)
          continue
        }

        let sent = false

        // Send email reminder
        if (reminder.type === 'email') {
          if (!user.email) {
            results.failed++
            results.errors.push(`Reminder ${reminder.id}: User has no email address`)
            continue
          }

          const emailContent = generateReminderEmail(task.title, task.due_date)
          sent = await sendEmail({
            to: user.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          })
        }

        // For push notifications, we can't send them from the server
        // They need to be handled by the client-side app
        // So we'll mark them as "sent" and let the client poll for them
        if (reminder.type === 'push') {
          sent = true // Mark as processed, client will handle the actual notification
        }

        if (sent) {
          // Mark reminder as sent
          await supabase
            .from('reminders')
            .update({ sent: true })
            .eq('id', reminder.id)

          results.sent++
        } else {
          results.failed++
          results.errors.push(`Reminder ${reminder.id}: Failed to send`)
        }
      } catch (error) {
        results.failed++
        results.errors.push(`Reminder ${reminder.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.error('Error processing reminder:', error)
      }
    }

    return NextResponse.json({
      message: 'Reminder check completed',
      checked: now,
      results,
    })
  } catch (error) {
    console.error('Error in reminder check:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Allow POST as well for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
