'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTasks,
  getIncompleteTasks,
  getCompletedTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
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
