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
import type { TaskWithRelations } from '@/types/tasks'

type TaskInsert = Omit<Database['public']['Tables']['tasks']['Insert'], 'user_id'>
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export function useTasks() {
  return useQuery<TaskWithRelations[] | null>({
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
  return useQuery<TaskWithRelations[] | null>({
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
  return useQuery<TaskWithRelations[] | null>({
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
    // Optimistic update for task creation
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      const previousTasks = queryClient.getQueryData(['tasks'])

      // Optimistically add the task
      queryClient.setQueryData(['tasks'], (old: any) => {
        if (!old) return old

        const optimisticTask: TaskWithRelations = {
          id: `temp-${Date.now()}`,
          ...newTask,
          user_id: 'temp',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          position: old.length,
          recurrence: null,
          dependencies: [],
          subtasks: [],
        } as any

        return [...old, optimisticTask]
      })

      return { previousTasks }
    },
    onError: (err, newTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSettled: () => {
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
    // Optimistic toggle for instant feedback
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      const previousTasks = queryClient.getQueryData(['tasks'])
      const newStatus = status === 'done' ? 'todo' : 'done'
      const completedAt = newStatus === 'done' ? new Date().toISOString() : null

      // Optimistically update all task queries
      queryClient.setQueryData(['tasks'], (old: any) => {
        if (!old) return old
        return old.map((task: any) =>
          task.id === id ? { ...task, status: newStatus, completed_at: completedAt } : task
        )
      })

      queryClient.setQueryData(['tasks', 'incomplete'], (old: any) => {
        if (!old) return old
        if (newStatus === 'done') {
          return old.filter((task: any) => task.id !== id)
        }
        return old
      })

      queryClient.setQueryData(['tasks', 'completed'], (old: any) => {
        if (!old) return old
        if (newStatus === 'done') {
          const task = previousTasks && (previousTasks as any[]).find((t: any) => t.id === id)
          return task ? [...old, { ...task, status: 'done', completed_at: completedAt }] : old
        } else {
          return old.filter((task: any) => task.id !== id)
        }
      })

      return { previousTasks }
    },
    onError: (err, { id, status }, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useTasksByTags(tagIds: string[], matchAll: boolean = false) {
  return useQuery<TaskWithRelations[] | null>({
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
  return useQuery<TaskWithRelations[] | null>({
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
