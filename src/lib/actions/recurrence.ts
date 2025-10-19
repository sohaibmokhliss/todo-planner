'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type RecurrenceInsert = Database['public']['Tables']['recurrence']['Insert']
type RecurrenceUpdate = Database['public']['Tables']['recurrence']['Update']

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

export async function getRecurrenceByTaskId(taskId: string) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  // First verify the task belongs to the user
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single()

  if (!task) {
    return { data: null, error: 'Task not found or access denied' }
  }

  const { data, error } = await supabase
    .from('recurrence')
    .select('*')
    .eq('task_id', taskId)
    .single()

  if (error) {
    // It's okay if recurrence doesn't exist
    if (error.code === 'PGRST116') {
      return { data: null, error: null }
    }
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function createRecurrence(recurrenceData: RecurrenceInsert) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  // Verify the task belongs to the user
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', recurrenceData.task_id)
    .eq('user_id', userId)
    .single()

  if (!task) {
    return { data: null, error: 'Task not found or access denied' }
  }

  const { data, error } = await supabase
    .from('recurrence')
    .insert(recurrenceData)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data, error: null }
}

export async function updateRecurrence(
  taskId: string,
  recurrenceData: RecurrenceUpdate
) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  // Verify the task belongs to the user
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single()

  if (!task) {
    return { data: null, error: 'Task not found or access denied' }
  }

  const { data, error } = await supabase
    .from('recurrence')
    .update(recurrenceData)
    .eq('task_id', taskId)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data, error: null }
}

export async function deleteRecurrence(taskId: string) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { error: authContext.error }
  }
  const { supabase, userId } = authContext

  // Verify the task belongs to the user
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single()

  if (!task) {
    return { error: 'Task not found or access denied' }
  }

  const { error } = await supabase
    .from('recurrence')
    .delete()
    .eq('task_id', taskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { error: null }
}
