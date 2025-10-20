'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

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

export async function getProjects() {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

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
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

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
  const session = await getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  // Use admin client to bypass RLS since we're explicitly setting user_id
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...projectData,
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

export async function updateProject(id: string, projectData: ProjectUpdate) {
  const session = await getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  // Use admin client to bypass RLS since we're explicitly checking user_id
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('projects')
    .update(projectData)
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

export async function deleteProject(id: string) {
  const session = await getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  // Use admin client to bypass RLS since we're explicitly checking user_id
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', session.userId)

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath('/app')
  return { data: true, error: null }
}

export async function getProjectTasks(projectId: string) {
  const authContext = await getAuthenticatedContext()
  if ('error' in authContext) {
    return { data: null, error: authContext.error }
  }
  const { supabase, userId } = authContext

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
