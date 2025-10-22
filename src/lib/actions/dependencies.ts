'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'

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

/**
 * Get all dependencies for a task (tasks that this task depends on)
 */
export async function getTaskDependencies(taskId: string) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  // Verify task ownership
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single()

  if (!task) {
    return { data: null, error: 'Task not found or access denied' }
  }

  // Get dependencies with task details
  const { data, error } = await supabase
    .from('task_dependencies')
    .select(`
      id,
      depends_on_task_id,
      tasks!task_dependencies_depends_on_task_id_fkey (
        id,
        title,
        status,
        priority,
        due_date
      )
    `)
    .eq('task_id', taskId)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Get all tasks that depend on this task
 */
export async function getTaskDependents(taskId: string) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  // Verify task ownership
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single()

  if (!task) {
    return { data: null, error: 'Task not found or access denied' }
  }

  // Get tasks that depend on this one
  const { data, error } = await supabase
    .from('task_dependencies')
    .select(`
      id,
      task_id,
      tasks!task_dependencies_task_id_fkey (
        id,
        title,
        status,
        priority,
        due_date
      )
    `)
    .eq('depends_on_task_id', taskId)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Check if adding a dependency would create a circular dependency
 */
async function wouldCreateCircularDependency(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  dependsOnTaskId: string,
  visited = new Set<string>()
): Promise<boolean> {
  // If we've visited this task before, we have a cycle
  if (visited.has(taskId)) {
    return true
  }

  // If the task we depend on is the original task, that's circular
  if (dependsOnTaskId === taskId) {
    return true
  }

  visited.add(taskId)

  // Get all tasks that dependsOnTaskId depends on
  const { data: dependencies } = await supabase
    .from('task_dependencies')
    .select('depends_on_task_id')
    .eq('task_id', dependsOnTaskId)

  if (!dependencies || dependencies.length === 0) {
    return false
  }

  // Recursively check each dependency
  for (const dep of dependencies) {
    if (await wouldCreateCircularDependency(supabase, taskId, dep.depends_on_task_id, visited)) {
      return true
    }
  }

  return false
}

/**
 * Add a dependency (task depends on another task)
 */
export async function addTaskDependency(taskId: string, dependsOnTaskId: string) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { error: authContext.error }
  }
  const { supabase, userId } = authContext

  // Verify both tasks belong to the user
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id')
    .in('id', [taskId, dependsOnTaskId])
    .eq('user_id', userId)

  if (!tasks || tasks.length !== 2) {
    return { error: 'One or both tasks not found or access denied' }
  }

  // Check for circular dependencies
  const isCircular = await wouldCreateCircularDependency(supabase, taskId, dependsOnTaskId)
  if (isCircular) {
    return { error: 'This would create a circular dependency' }
  }

  // Add the dependency
  const { error } = await supabase
    .from('task_dependencies')
    .insert({
      task_id: taskId,
      depends_on_task_id: dependsOnTaskId,
    })

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return { error: 'This dependency already exists' }
    }
    return { error: error.message }
  }

  revalidatePath('/app')
  return { error: null }
}

/**
 * Remove a dependency
 */
export async function removeTaskDependency(dependencyId: string) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { error: authContext.error }
  }
  const { supabase, userId } = authContext

  // Verify the dependency exists and belongs to user's task
  const { data: dependency } = await supabase
    .from('task_dependencies')
    .select('task_id, tasks!task_dependencies_task_id_fkey(user_id)')
    .eq('id', dependencyId)
    .single()

  if (!dependency || (dependency.tasks as unknown as { user_id: string } | null)?.user_id !== userId) {
    return { error: 'Dependency not found or access denied' }
  }

  const { error } = await supabase
    .from('task_dependencies')
    .delete()
    .eq('id', dependencyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { error: null }
}

/**
 * Check if a task can be completed (all dependencies are done)
 */
export async function canCompleteTask(taskId: string) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: false, error: authContext.error }
  }
  const { supabase, userId } = authContext

  // Verify task ownership
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single()

  if (!task) {
    return { data: false, error: 'Task not found or access denied' }
  }

  // Get all dependencies
  const { data: dependencies, error } = await supabase
    .from('task_dependencies')
    .select('depends_on_task_id, tasks!task_dependencies_depends_on_task_id_fkey(status)')
    .eq('task_id', taskId)

  if (error) {
    return { data: false, error: error.message }
  }

  // If no dependencies, task can be completed
  if (!dependencies || dependencies.length === 0) {
    return { data: true, error: null }
  }

  // Check if all dependencies are done
  const allDone = dependencies.every(dep => (dep.tasks as unknown as { status: string } | null)?.status === 'done')

  return { data: allDone, error: null, blockedBy: dependencies.filter(dep => (dep.tasks as unknown as { status: string } | null)?.status !== 'done') }
}
