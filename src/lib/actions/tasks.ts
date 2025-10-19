'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

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

export async function getTasks() {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function getTaskById(id: string) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function createTask(taskData: Omit<TaskInsert, 'user_id'>) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...taskData,
      user_id: userId,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data, error: null }
}

export async function updateTask(id: string, taskData: TaskUpdate) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  const { data, error } = await supabase
    .from('tasks')
    .update(taskData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data, error: null }
}

export async function deleteTask(id: string) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data: true, error: null }
}

export async function toggleTaskCompletion(id: string, currentStatus: 'todo' | 'in_progress' | 'done') {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  const newStatus = currentStatus === 'done' ? 'todo' : 'done'
  const completedAt = newStatus === 'done' ? new Date().toISOString() : null

  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: newStatus,
      completed_at: completedAt,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data, error: null }
}

export async function getIncompleteTasks() {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'done')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function getCompletedTasks() {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'done')
    .order('completed_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
