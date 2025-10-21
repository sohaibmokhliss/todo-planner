'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type ReminderInsert = Database['public']['Tables']['reminders']['Insert']
type ReminderUpdate = Database['public']['Tables']['reminders']['Update']
type Reminder = Database['public']['Tables']['reminders']['Row']

type AuthenticatedContext =
  | {
      supabase: Awaited<ReturnType<typeof createClient>>
      userId: string
    }
  | { error: string }

async function getAuthenticatedContext(): Promise<AuthenticatedContext> {
  const session = await getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  const supabase = await createClient()
  return { supabase, userId: session.userId }
}

export async function getTaskReminders(taskId: string) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  // First verify the task belongs to the user
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single()

  if (taskError || !task) {
    return { data: null, error: 'Task not found or access denied' }
  }

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('task_id', taskId)
    .order('time', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function createReminder(reminderData: Omit<ReminderInsert, 'sent'>) {
  const session = await getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  // Verify the task belongs to the user
  const supabase = await createClient()
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', reminderData.task_id)
    .eq('user_id', session.userId)
    .single()

  if (taskError || !task) {
    return { data: null, error: 'Task not found or access denied' }
  }

  // Use admin client to create the reminder
  const adminClient = await createAdminClient()
  const { data, error } = await adminClient
    .from('reminders')
    .insert({
      ...reminderData,
      sent: false,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data, error: null }
}

export async function updateReminder(id: string, reminderData: ReminderUpdate) {
  const session = await getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  // Verify the reminder belongs to a task owned by the user
  const supabase = await createClient()
  const { data: reminder, error: reminderError } = await supabase
    .from('reminders')
    .select('task_id')
    .eq('id', id)
    .single()

  if (reminderError || !reminder) {
    return { data: null, error: 'Reminder not found' }
  }

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', reminder.task_id)
    .eq('user_id', session.userId)
    .single()

  if (taskError || !task) {
    return { data: null, error: 'Access denied' }
  }

  // Use admin client to update the reminder
  const adminClient = await createAdminClient()
  const { data, error } = await adminClient
    .from('reminders')
    .update(reminderData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data, error: null }
}

export async function deleteReminder(id: string) {
  const session = await getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  // Verify the reminder belongs to a task owned by the user
  const supabase = await createClient()
  const { data: reminder, error: reminderError } = await supabase
    .from('reminders')
    .select('task_id')
    .eq('id', id)
    .single()

  if (reminderError || !reminder) {
    return { data: null, error: 'Reminder not found' }
  }

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', reminder.task_id)
    .eq('user_id', session.userId)
    .single()

  if (taskError || !task) {
    return { data: null, error: 'Access denied' }
  }

  // Use admin client to delete the reminder
  const adminClient = await createAdminClient()
  const { error } = await adminClient.from('reminders').delete().eq('id', id)

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data: true, error: null }
}

export async function getUpcomingReminders() {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  // Get all reminders for the user's tasks that haven't been sent yet
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select(
      `
      *,
      tasks!inner (
        id,
        title,
        user_id
      )
    `
    )
    .eq('tasks.user_id', userId)
    .eq('sent', false)
    .gte('time', new Date().toISOString())
    .order('time', { ascending: true })
    .limit(10)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: reminders as (Reminder & { tasks: { id: string; title: string; user_id: string } })[], error: null }
}
