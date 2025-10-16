'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export async function getTasks() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Temporarily use a mock user ID for development
  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

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
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

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
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

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
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

  const { data, error} = await supabase
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
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

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
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

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
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

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
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

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
