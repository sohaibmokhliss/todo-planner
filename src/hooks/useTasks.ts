'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTasks,
  getIncompleteTasks,
  getCompletedTasks,
  getTasksByTags,
  searchTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  type SearchFilters,
} from '@/lib/actions/tasks'
import type { Database } from '@/types/database'

type TaskInsert = Omit<Database['public']['Tables']['tasks']['Insert'], 'user_id'>
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const result = await getTasks()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
  })
}

export function useIncompleteTasks() {
  return useQuery({
    queryKey: ['tasks', 'incomplete'],
    queryFn: async () => {
      const result = await getIncompleteTasks()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
  })
}

export function useCompletedTasks() {
  return useQuery({
    queryKey: ['tasks', 'completed'],
    queryFn: async () => {
      const result = await getCompletedTasks()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskData: TaskInsert) => {
      const result = await createTask(taskData)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TaskUpdate }) => {
      const result = await updateTask(id, data)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTask(id)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useToggleTaskCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'todo' | 'in_progress' | 'done' }) => {
      const result = await toggleTaskCompletion(id, status)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useTasksByTags(tagIds: string[], matchAll: boolean = false) {
  return useQuery({
    queryKey: ['tasks', 'by-tags', tagIds.sort(), matchAll],
    queryFn: async () => {
      const result = await getTasksByTags(tagIds, matchAll)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled: tagIds.length > 0,
  })
}

export function useSearchTasks(filters: SearchFilters) {
  return useQuery({
    queryKey: ['tasks', 'search', filters],
    queryFn: async () => {
      const result = await searchTasks(filters)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled: !!(filters.query || filters.projectId || filters.tagIds?.length || filters.status || filters.priority || filters.dateFrom || filters.dateTo),
  })
}
