'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
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
  const session = await getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  // Use admin client to bypass RLS since we're explicitly setting user_id
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...taskData,
      user_id: session.userId,
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
  const session = await getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  // Use admin client to bypass RLS since we're explicitly checking user_id
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('tasks')
    .update(taskData)
    .eq('id', id)
    .eq('user_id', session.userId)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data, error: null }
}

export async function deleteTask(id: string) {
  const session = await getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  // Use admin client to bypass RLS since we're explicitly checking user_id
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', session.userId)

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data: true, error: null }
}

export async function toggleTaskCompletion(id: string, currentStatus: 'todo' | 'in_progress' | 'done') {
  const session = await getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  // Use admin client to bypass RLS since we're explicitly checking user_id
  const supabase = await createAdminClient()

  const newStatus = currentStatus === 'done' ? 'todo' : 'done'
  const completedAt = newStatus === 'done' ? new Date().toISOString() : null

  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: newStatus,
      completed_at: completedAt,
    })
    .eq('id', id)
    .eq('user_id', session.userId)
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

export async function getTasksByTags(tagIds: string[], matchAll: boolean = false) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  if (tagIds.length === 0) {
    return { data: [], error: null }
  }

  // Get all tasks that have at least one of the specified tags
  const { data: taskTags, error: taskTagsError } = await supabase
    .from('task_tags')
    .select('task_id')
    .in('tag_id', tagIds)

  if (taskTagsError) {
    return { data: null, error: taskTagsError.message }
  }

  if (!taskTags || taskTags.length === 0) {
    return { data: [], error: null }
  }

  // Count how many tags each task has
  const taskIdCounts = new Map<string, number>()
  taskTags.forEach(({ task_id }) => {
    taskIdCounts.set(task_id, (taskIdCounts.get(task_id) || 0) + 1)
  })

  // Filter task IDs based on matchAll logic
  let taskIds: string[]
  if (matchAll) {
    // Only include tasks that have all specified tags
    taskIds = Array.from(taskIdCounts.entries())
      .filter(([, count]) => count === tagIds.length)
      .map(([taskId]) => taskId)
  } else {
    // Include tasks that have at least one tag
    taskIds = Array.from(taskIdCounts.keys())
  }

  if (taskIds.length === 0) {
    return { data: [], error: null }
  }

  // Get the actual tasks
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .in('id', taskIds)
    .eq('user_id', userId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export interface SearchFilters {
  query?: string
  projectId?: string
  tagIds?: string[]
  status?: 'todo' | 'in_progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  dateFrom?: string
  dateTo?: string
}

export async function searchTasks(filters: SearchFilters) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)

  // Apply text search if query is provided
  if (filters.query && filters.query.trim()) {
    const searchTerm = filters.query.trim()
    // Search in title and description using OR logic
    query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
  }

  // Apply project filter
  if (filters.projectId) {
    query = query.eq('project_id', filters.projectId)
  }

  // Apply status filter
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  // Apply priority filter
  if (filters.priority) {
    query = query.eq('priority', filters.priority)
  }

  // Apply date range filters
  if (filters.dateFrom) {
    query = query.gte('due_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('due_date', filters.dateTo)
  }

  // Order results
  query = query.order('created_at', { ascending: false })

  const { data: tasks, error } = await query

  if (error) {
    return { data: null, error: error.message }
  }

  // If tag filters are provided, filter tasks by tags
  if (filters.tagIds && filters.tagIds.length > 0 && tasks) {
    const { data: taskTags, error: taskTagsError } = await supabase
      .from('task_tags')
      .select('task_id, tag_id')
      .in('tag_id', filters.tagIds)

    if (taskTagsError) {
      return { data: null, error: taskTagsError.message }
    }

    // Group task IDs by tag count
    const taskIdCounts = new Map<string, number>()
    taskTags?.forEach(({ task_id }) => {
      taskIdCounts.set(task_id, (taskIdCounts.get(task_id) || 0) + 1)
    })

    // Filter tasks that have at least one of the specified tags
    const filteredTasks = tasks.filter(task => taskIdCounts.has(task.id))
    return { data: filteredTasks, error: null }
  }

  return { data: tasks, error: null }
}
