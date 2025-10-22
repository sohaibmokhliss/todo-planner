'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
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

  const tasks = parentSubtask?.tasks as unknown as { user_id: string } | undefined
  if (!parentSubtask || !tasks || tasks.user_id !== userId) {
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
  const session = await getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  const supabase = await createClient()
  const adminClient = await createAdminClient()

  // Verify the task belongs to the user
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', subtaskData.task_id)
    .eq('user_id', session.userId)
    .single()

  if (!task) {
    return { data: null, error: 'Task not found or access denied' }
  }

  // Get the max position for this task/parent combo
  let query = adminClient
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

  // Use admin client to bypass RLS for INSERT
  const { data, error } = await adminClient
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
  const session = await getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  const supabase = await createClient()
  const adminClient = await createAdminClient()

  // Verify the subtask's parent task belongs to the user
  const { data: subtask } = await supabase
    .from('subtasks')
    .select('task_id, tasks!inner(user_id)')
    .eq('id', id)
    .single()

  const tasks = subtask?.tasks as unknown as { user_id: string } | undefined
  if (!subtask || !tasks || tasks.user_id !== session.userId) {
    return { data: null, error: 'Subtask not found or access denied' }
  }

  // Use admin client to bypass RLS for UPDATE
  const { data, error } = await adminClient
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
  const session = await getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  const supabase = await createClient()
  const adminClient = await createAdminClient()

  // Get current subtask with task ownership check
  const { data: subtask } = await supabase
    .from('subtasks')
    .select('completed, task_id, tasks!inner(user_id)')
    .eq('id', id)
    .single()

  const tasks = subtask?.tasks as unknown as { user_id: string } | undefined
  if (!subtask || !tasks || tasks.user_id !== session.userId) {
    return { data: null, error: 'Subtask not found or access denied' }
  }

  // Use admin client to bypass RLS for UPDATE
  const { data, error } = await adminClient
    .from('subtasks')
    .update({ completed: !subtask.completed })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  // Auto-complete parent task if all subtasks are now completed
  if (data?.completed) {
    // Get all subtasks for this task
    const { data: allSubtasks } = await adminClient
      .from('subtasks')
      .select('completed')
      .eq('task_id', subtask.task_id)

    // Check if all subtasks are completed
    const allCompleted = allSubtasks?.every(st => st.completed) ?? false

    if (allCompleted && allSubtasks && allSubtasks.length > 0) {
      // Auto-complete the parent task
      await adminClient
        .from('tasks')
        .update({
          status: 'done',
          completed_at: new Date().toISOString(),
        })
        .eq('id', subtask.task_id)
        .eq('user_id', session.userId)
    }
  }

  revalidatePath('/app')
  return { data, error: null }
}

export async function deleteSubtask(id: string) {
  const session = await getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  const supabase = await createClient()
  const adminClient = await createAdminClient()

  // Verify the subtask's parent task belongs to the user
  const { data: subtask } = await supabase
    .from('subtasks')
    .select('task_id, tasks!inner(user_id)')
    .eq('id', id)
    .single()

  const tasks = subtask?.tasks as unknown as { user_id: string } | undefined
  if (!subtask || !tasks || tasks.user_id !== session.userId) {
    return { data: null, error: 'Subtask not found or access denied' }
  }

  // Use admin client to bypass RLS for DELETE
  const { error } = await adminClient.from('subtasks').delete().eq('id', id)

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
  const session = await getSession()
  if (!session) {
    return { error: 'Not authenticated' }
  }

  const supabase = await createClient()
  const adminClient = await createAdminClient()

  // Verify the task belongs to the user
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', session.userId)
    .single()

  if (!task) {
    return { error: 'Task not found or access denied' }
  }

  // Use admin client to bypass RLS for UPDATE
  const updates = subtaskIds.map((id, index) =>
    adminClient.from('subtasks').update({ position: index }).eq('id', id)
  )

  try {
    await Promise.all(updates)
    revalidatePath('/app')
    return { error: null }
  } catch {
    return { error: 'Failed to reorder subtasks' }
  }
}
