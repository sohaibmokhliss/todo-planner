'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import type { Database } from '@/types/database'

type Tag = Database['public']['Tables']['tags']['Row']
type TagInsert = Database['public']['Tables']['tags']['Insert']
type TagUpdate = Database['public']['Tables']['tags']['Update']

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

export async function getTags() {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching tags:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Get all tags with task count statistics
 */
export async function getTagsWithStats() {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  // Get all tags for the user with task counts
  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (tagsError) {
    console.error('Error fetching tags:', tagsError)
    return { data: null, error: tagsError.message }
  }

  if (!tags || tags.length === 0) {
    return { data: [], error: null }
  }

  // Get task counts for each tag
  const tagIds = tags.map(tag => tag.id)
  const { data: taskCounts, error: countsError } = await supabase
    .from('task_tags')
    .select('tag_id')
    .in('tag_id', tagIds)

  if (countsError) {
    console.error('Error fetching task counts:', countsError)
    return { data: null, error: countsError.message }
  }

  // Count tasks per tag
  const countMap = new Map<string, number>()
  taskCounts?.forEach(item => {
    const count = countMap.get(item.tag_id) || 0
    countMap.set(item.tag_id, count + 1)
  })

  // Combine tags with counts
  const tagsWithStats = tags.map(tag => ({
    ...tag,
    taskCount: countMap.get(tag.id) || 0,
  }))

  return { data: tagsWithStats, error: null }
}

export async function getTagById(id: string) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching tag:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function createTag(tagData: Omit<TagInsert, 'user_id'>) {
  const session = await getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  const supabase = await createAdminClient()

  const { data, error} = await supabase
    .from('tags')
    .insert({
      ...tagData,
      user_id: session.userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating tag:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data, error: null }
}

export async function updateTag(id: string, tagData: TagUpdate) {
  const session = await getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('tags')
    .update(tagData)
    .eq('id', id)
    .eq('user_id', session.userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating tag:', error)
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data, error: null }
}

export async function deleteTag(id: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'Not authenticated' }
  }

  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)
    .eq('user_id', session.userId)

  if (error) {
    console.error('Error deleting tag:', error)
    return { error: error.message }
  }

  revalidatePath('/app')
  return { error: null }
}

export async function getTaskTags(taskId: string) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

  const { data, error } = await supabase
    .from('task_tags')
    .select('tag_id, tags(*)')
    .eq('task_id', taskId)
    .eq('tags.user_id', userId)

  if (error) {
    console.error('Error fetching task tags:', error)
    return { data: null, error: error.message }
  }

  const tags = data?.map(item => item.tags).filter(Boolean) as unknown as Tag[] | undefined
  return { data: tags ?? [], error: null }
}

export async function addTagToTask(taskId: string, tagId: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'Not authenticated' }
  }

  const supabase = await createClient()
  const adminClient = await createAdminClient()

  const [{ data: tag, error: tagError }, { data: task, error: taskError }] = await Promise.all([
    supabase.from('tags').select('id').eq('id', tagId).eq('user_id', session.userId).single(),
    supabase.from('tasks').select('id').eq('id', taskId).eq('user_id', session.userId).single(),
  ])

  if (tagError || taskError || !tag || !task) {
    console.error('Error validating tag/task ownership:', tagError ?? taskError)
    return { error: 'Cannot modify tag for this task' }
  }

  const { error } = await adminClient.from('task_tags').insert({
    task_id: taskId,
    tag_id: tagId,
  })

  if (error) {
    console.error('Error adding tag to task:', error)
    return { error: error.message }
  }

  revalidatePath('/app')
  return { error: null }
}

export async function removeTagFromTask(taskId: string, tagId: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'Not authenticated' }
  }

  const supabase = await createClient()
  const adminClient = await createAdminClient()

  const { error: ownershipError } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', session.userId)
    .single()

  if (ownershipError) {
    console.error('Error validating task ownership for removal:', ownershipError)
    return { error: 'Cannot modify tags for this task' }
  }

  const { error } = await adminClient
    .from('task_tags')
    .delete()
    .eq('task_id', taskId)
    .eq('tag_id', tagId)

  if (error) {
    console.error('Error removing tag from task:', error)
    return { error: error.message }
  }

  revalidatePath('/app')
  return { error: null }
}

export async function setTaskTags(taskId: string, tagIds: string[]) {
  const session = await getSession()
  if (!session) {
    return { error: 'Not authenticated' }
  }

  const supabase = await createClient()
  const adminClient = await createAdminClient()

  const { error: taskOwnershipError } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', session.userId)
    .single()

  if (taskOwnershipError) {
    console.error('Error validating task ownership:', taskOwnershipError)
    return { error: 'Cannot modify tags for this task' }
  }

  const { error: deleteError } = await adminClient.from('task_tags').delete().eq('task_id', taskId)

  if (deleteError) {
    console.error('Error clearing task tags:', deleteError)
    return { error: deleteError.message }
  }

  if (tagIds.length > 0) {
    const { error } = await adminClient
      .from('task_tags')
      .insert(tagIds.map(tagId => ({ task_id: taskId, tag_id: tagId })))

    if (error) {
      console.error('Error setting task tags:', error)
      return { error: error.message }
    }
  }

  revalidatePath('/app')
  return { error: null }
}
