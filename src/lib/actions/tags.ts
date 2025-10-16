'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Tag = Database['public']['Tables']['tags']['Row']
type TagInsert = Database['public']['Tables']['tags']['Insert']
type TagUpdate = Database['public']['Tables']['tags']['Update']

// Get all tags for the current user
export async function getTags() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userId = user?.id || '00000000-0000-0000-0000-000000000000'

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching tags:', error)
    return { data: null, error }
  }
}

// Get a single tag by ID
export async function getTagById(id: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching tag:', error)
    return { data: null, error }
  }
}

// Create a new tag
export async function createTag(tagData: Omit<TagInsert, 'user_id'>) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userId = user?.id || '00000000-0000-0000-0000-000000000000'

    const { data, error } = await supabase
      .from('tags')
      .insert({
        ...tagData,
        user_id: userId,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/app')
    return { data, error: null }
  } catch (error) {
    console.error('Error creating tag:', error)
    return { data: null, error }
  }
}

// Update a tag
export async function updateTag(id: string, tagData: TagUpdate) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tags')
      .update(tagData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/app')
    return { data, error: null }
  } catch (error) {
    console.error('Error updating tag:', error)
    return { data: null, error }
  }
}

// Delete a tag
export async function deleteTag(id: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/app')
    return { error: null }
  } catch (error) {
    console.error('Error deleting tag:', error)
    return { error }
  }
}

// Get tags for a specific task
export async function getTaskTags(taskId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('task_tags')
      .select('tag_id, tags(*)')
      .eq('task_id', taskId)

    if (error) throw error

    const tags = data?.map(item => item.tags).filter(Boolean) as Tag[]
    return { data: tags, error: null }
  } catch (error) {
    console.error('Error fetching task tags:', error)
    return { data: null, error }
  }
}

// Add a tag to a task
export async function addTagToTask(taskId: string, tagId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('task_tags')
      .insert({
        task_id: taskId,
        tag_id: tagId,
      })

    if (error) throw error

    revalidatePath('/app')
    return { error: null }
  } catch (error) {
    console.error('Error adding tag to task:', error)
    return { error }
  }
}

// Remove a tag from a task
export async function removeTagFromTask(taskId: string, tagId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('task_tags')
      .delete()
      .eq('task_id', taskId)
      .eq('tag_id', tagId)

    if (error) throw error

    revalidatePath('/app')
    return { error: null }
  } catch (error) {
    console.error('Error removing tag from task:', error)
    return { error }
  }
}

// Set tags for a task (replaces all existing tags)
export async function setTaskTags(taskId: string, tagIds: string[]) {
  try {
    const supabase = await createClient()

    // First, remove all existing tags
    await supabase
      .from('task_tags')
      .delete()
      .eq('task_id', taskId)

    // Then, add the new tags
    if (tagIds.length > 0) {
      const { error } = await supabase
        .from('task_tags')
        .insert(
          tagIds.map(tagId => ({
            task_id: taskId,
            tag_id: tagId,
          }))
        )

      if (error) throw error
    }

    revalidatePath('/app')
    return { error: null }
  } catch (error) {
    console.error('Error setting task tags:', error)
    return { error }
  }
}
