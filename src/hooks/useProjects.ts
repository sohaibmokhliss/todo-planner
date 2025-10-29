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
    // Optimistic update: immediately add the project to the UI
    onMutate: async (newProject) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['projects'] })

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(['projects'])

      // Optimistically update to the new value
      queryClient.setQueryData(['projects'], (old: any) => {
        if (!old) return old

        // Create optimistic project with temporary ID
        const optimisticProject = {
          id: `temp-${Date.now()}`,
          ...newProject,
          user_id: 'temp',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          position: old.length,
        }

        return [...old, optimisticProject]
      })

      // Return context with the snapshot
      return { previousProjects }
    },
    // If mutation fails, use the context returned from onMutate to roll back
    onError: (err, newProject, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects)
      }
    },
    // Always refetch after error or success to ensure data consistency
    onSettled: () => {
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
    // Optimistic update for project modifications
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      await queryClient.cancelQueries({ queryKey: ['projects', id] })

      const previousProjects = queryClient.getQueryData(['projects'])
      const previousProject = queryClient.getQueryData(['projects', id])

      // Optimistically update projects list
      queryClient.setQueryData(['projects'], (old: any) => {
        if (!old) return old
        return old.map((project: any) =>
          project.id === id ? { ...project, ...data, updated_at: new Date().toISOString() } : project
        )
      })

      // Optimistically update individual project
      queryClient.setQueryData(['projects', id], (old: any) => {
        if (!old) return old
        return { ...old, ...data, updated_at: new Date().toISOString() }
      })

      return { previousProjects, previousProject }
    },
    onError: (err, { id }, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects)
      }
      if (context?.previousProject) {
        queryClient.setQueryData(['projects', id], context.previousProject)
      }
    },
    onSettled: (data) => {
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
    // Optimistic delete
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] })

      const previousProjects = queryClient.getQueryData(['projects'])

      // Optimistically remove the project
      queryClient.setQueryData(['projects'], (old: any) => {
        if (!old) return old
        return old.filter((project: any) => project.id !== id)
      })

      return { previousProjects }
    },
    onError: (err, id, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
