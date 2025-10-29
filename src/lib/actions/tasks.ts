'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'
import type { TaskWithRelations, TaskDependencyWithDetails } from '@/types/tasks'

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

async function enrichTasksWithRelations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tasks: Database['public']['Tables']['tasks']['Row'][] | null
): Promise<{ data: TaskWithRelations[]; error: string | null }> {
  if (!tasks || tasks.length === 0) {
    return { data: [], error: null }
  }

  const taskIds = tasks.map(task => task.id)

  // Fetch all related data in a single parallel batch to avoid N+1 queries
  const [
    { data: recurrences, error: recurrenceError },
    { data: dependencies, error: dependenciesError },
    { data: subtasks, error: subtasksError }
  ] = await Promise.all([
    supabase
      .from('recurrence')
      .select('*')
      .in('task_id', taskIds),
    supabase
      .from('task_dependencies')
      .select(`
        *,
        depends_on:tasks!task_dependencies_depends_on_task_id_fkey (
          id,
          title,
          status,
          priority,
          due_date
        )
      `)
      .in('task_id', taskIds),
    supabase
      .from('subtasks')
      .select('*')
      .in('task_id', taskIds)
      .order('position', { ascending: true })
  ])

  if (recurrenceError) {
    return { data: [], error: recurrenceError.message }
  }

  if (dependenciesError) {
    return { data: [], error: dependenciesError.message }
  }

  if (subtasksError) {
    return { data: [], error: subtasksError.message }
  }

  // Build lookup maps for O(1) access
  const recurrenceByTask = new Map<string, Database['public']['Tables']['recurrence']['Row']>()
  recurrences?.forEach(recurrence => {
    recurrenceByTask.set(recurrence.task_id, recurrence)
  })

  const dependenciesByTask = new Map<string, TaskDependencyWithDetails[]>()
  ;(dependencies as TaskDependencyWithDetails[] | null)?.forEach(dependency => {
    const existing = dependenciesByTask.get(dependency.task_id) || []
    existing.push(dependency)
    dependenciesByTask.set(dependency.task_id, existing)
  })

  const subtasksByTask = new Map<string, Database['public']['Tables']['subtasks']['Row'][]>()
  subtasks?.forEach(subtask => {
    const existing = subtasksByTask.get(subtask.task_id) || []
    existing.push(subtask)
    subtasksByTask.set(subtask.task_id, existing)
  })

  const enrichedTasks: TaskWithRelations[] = tasks.map(task => ({
    ...task,
    recurrence: recurrenceByTask.get(task.id) ?? null,
    dependencies: dependenciesByTask.get(task.id) ?? [],
    subtasks: subtasksByTask.get(task.id) ?? [],
  }))

  return { data: enrichedTasks, error: null }
}

export async function getTasks(): Promise<{ data: TaskWithRelations[] | null; error: string | null }> {
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

  const { data: enrichedTasks, error: enrichmentError } = await enrichTasksWithRelations(supabase, data)

  if (enrichmentError) {
    return { data: null, error: enrichmentError }
  }

  return { data: enrichedTasks, error: null }
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

export async function getIncompleteTasks(): Promise<{ data: TaskWithRelations[] | null; error: string | null }> {
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

  const { data: enrichedTasks, error: enrichmentError } = await enrichTasksWithRelations(supabase, data)

  if (enrichmentError) {
    return { data: null, error: enrichmentError }
  }

  return { data: enrichedTasks, error: null }
}

export async function getCompletedTasks(): Promise<{ data: TaskWithRelations[] | null; error: string | null }> {
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

  const { data: enrichedTasks, error: enrichmentError } = await enrichTasksWithRelations(supabase, data)

  if (enrichmentError) {
    return { data: null, error: enrichmentError }
  }

  return { data: enrichedTasks, error: null }
}

export async function getTasksByTags(
  tagIds: string[],
  matchAll: boolean = false
): Promise<{ data: TaskWithRelations[] | null; error: string | null }> {
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

  const { data: enrichedTasks, error: enrichmentError } = await enrichTasksWithRelations(supabase, data)

  if (enrichmentError) {
    return { data: null, error: enrichmentError }
  }

  return { data: enrichedTasks, error: null }
}

export interface SearchFilters {
  query?: string
  projectId?: string
  tagIds?: string[]
  matchAllTags?: boolean // AND logic if true, OR logic if false (default)
  status?: 'todo' | 'in_progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  dateFrom?: string
  dateTo?: string
  sortBy?: 'created_at' | 'due_date' | 'title' | 'priority'
  sortOrder?: 'asc' | 'desc'
}

export async function searchTasks(
  filters: SearchFilters
): Promise<{ data: TaskWithRelations[] | null; error: string | null }> {
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

  // Apply sorting
  const sortBy = filters.sortBy || 'created_at'
  const sortOrder = filters.sortOrder || 'desc'
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  const { data: tasks, error } = await query

  if (error) {
    return { data: null, error: error.message }
  }

  const baseTasks = tasks ?? []
  let filteredTasks = baseTasks

  // If tag filters are provided, filter tasks by tags
  if (filters.tagIds && filters.tagIds.length > 0 && baseTasks.length > 0) {
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

    // Filter tasks based on matchAllTags setting
    if (filters.matchAllTags) {
      // AND logic: tasks must have ALL specified tags
      filteredTasks = baseTasks.filter(task => taskIdCounts.get(task.id) === filters.tagIds!.length)
    } else {
      // OR logic: tasks must have at least ONE of the specified tags
      filteredTasks = baseTasks.filter(task => taskIdCounts.has(task.id))
    }
  }

  const { data: enrichedTasks, error: enrichmentError } = await enrichTasksWithRelations(supabase, filteredTasks)

  if (enrichmentError) {
    return { data: null, error: enrichmentError }
  }

  return { data: enrichedTasks, error: null }
}
