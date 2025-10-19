'use server'

import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type SubtaskInsert = Database['public']['Tables']['subtasks']['Insert']
type SubtaskUpdate = Database['public']['Tables']['subtasks']['Update']

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

export async function getSubtasksByTaskId(taskId: string) {
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
    .from('subtasks')
    .select('*')
    .eq('task_id', taskId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function getSubtasksByParentId(parentId: string) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  // First verify the parent subtask's task belongs to the user
  const { data: parentSubtask } = await supabase
    .from('subtasks')
    .select('task_id, tasks!inner(user_id)')
    .eq('id', parentId)
    .single()

  if (!parentSubtask || parentSubtask.tasks.user_id !== userId) {
    return { data: null, error: 'Parent subtask not found or access denied' }
  }

  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('parent_id', parentId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function createSubtask(
  subtaskData: Omit<SubtaskInsert, 'position'>
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
    .eq('id', subtaskData.task_id)
    .eq('user_id', userId)
    .single()

  if (!task) {
    return { data: null, error: 'Task not found or access denied' }
  }

  // Get the max position for this task/parent combo
  let query = supabase
    .from('subtasks')
    .select('position')
    .eq('task_id', subtaskData.task_id)

  if (subtaskData.parent_id) {
    query = query.eq('parent_id', subtaskData.parent_id)
  } else {
    query = query.is('parent_id', null)
  }

  const { data: existingSubtasks } = await query
    .order('position', { ascending: false })
    .limit(1)

  const newPosition =
    existingSubtasks && existingSubtasks.length > 0
      ? (existingSubtasks[0].position || 0) + 1
      : 0

  const { data, error } = await supabase
    .from('subtasks')
    .insert({
      ...subtaskData,
      position: newPosition,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data, error: null }
}

export async function updateSubtask(id: string, subtaskData: SubtaskUpdate) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  // Verify the subtask's parent task belongs to the user
  const { data: subtask } = await supabase
    .from('subtasks')
    .select('task_id, tasks!inner(user_id)')
    .eq('id', id)
    .single()

  if (!subtask || subtask.tasks.user_id !== userId) {
    return { data: null, error: 'Subtask not found or access denied' }
  }

  const { data, error } = await supabase
    .from('subtasks')
    .update(subtaskData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data, error: null }
}

export async function toggleSubtaskCompletion(id: string) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  // Get current subtask with task ownership check
  const { data: subtask } = await supabase
    .from('subtasks')
    .select('completed, task_id, tasks!inner(user_id)')
    .eq('id', id)
    .single()

  if (!subtask || subtask.tasks.user_id !== userId) {
    return { data: null, error: 'Subtask not found or access denied' }
  }

  const { data, error } = await supabase
    .from('subtasks')
    .update({ completed: !subtask.completed })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data, error: null }
}

export async function deleteSubtask(id: string) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  // Verify the subtask's parent task belongs to the user
  const { data: subtask } = await supabase
    .from('subtasks')
    .select('task_id, tasks!inner(user_id)')
    .eq('id', id)
    .single()

  if (!subtask || subtask.tasks.user_id !== userId) {
    return { data: null, error: 'Subtask not found or access denied' }
  }

  const { error } = await supabase.from('subtasks').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { error: null }
}

export async function reorderSubtasks(
  taskId: string,
  subtaskIds: string[]
) {
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

  // Update positions for all subtasks
  const updates = subtaskIds.map((id, index) =>
    supabase.from('subtasks').update({ position: index }).eq('id', id)
  )

  try {
    await Promise.all(updates)
    revalidatePath('/app')
    return { error: null }
  } catch (error) {
    return { error: 'Failed to reorder subtasks' }
  }
}
