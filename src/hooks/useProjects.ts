'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectTasks,
} from '@/lib/actions/projects'
import type { Database } from '@/types/database'

type ProjectInsert = Omit<Database['public']['Tables']['projects']['Insert'], 'user_id'>
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const result = await getProjects()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const result = await getProjectById(id)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled: !!id,
  })
}

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: async () => {
      const result = await getProjectTasks(projectId)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled: !!projectId,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectData: ProjectInsert) => {
      const result = await createProject(projectData)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProjectUpdate }) => {
      const result = await updateProject(id, data)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', data.id] })
      }
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteProject(id)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
