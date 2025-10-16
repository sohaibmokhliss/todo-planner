'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export async function getProjects() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function getProjectById(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function createProject(projectData: Omit<ProjectInsert, 'user_id'>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...projectData,
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

export async function updateProject(id: string, projectData: ProjectUpdate) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

  const { data, error } = await supabase
    .from('projects')
    .update(projectData)
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

export async function deleteProject(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data: true, error: null }
}

export async function getProjectTasks(projectId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user?.id || '00000000-0000-0000-0000-000000000000'

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
