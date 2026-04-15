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
type TaskList = TaskWithRelations[] | null

interface CreateTaskContext {
  previousTasks: TaskList | undefined
}

interface ToggleTaskContext {
  previousTasks: TaskList | undefined
  previousIncompleteTasks: TaskList | undefined
  previousCompletedTasks: TaskList | undefined
}

function buildOptimisticTask(task: TaskInsert, position: number): TaskWithRelations {
  const timestamp = new Date().toISOString()

  return {
    id: `temp-${Date.now()}`,
    title: task.title,
    description: task.description ?? null,
    due_date: task.due_date ?? null,
    notes_html: task.notes_html ?? null,
    priority: task.priority ?? 'medium',
    project_id: task.project_id ?? null,
    start_date: task.start_date ?? null,
    status: task.status ?? 'todo',
    completed_at: task.completed_at ?? null,
    user_id: 'temp',
    created_at: timestamp,
    updated_at: timestamp,
    position: task.position ?? position,
    recurrence: null,
    dependencies: [],
    subtasks: [],
  }
}

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
    onMutate: async (newTask): Promise<CreateTaskContext> => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      const previousTasks = queryClient.getQueryData<TaskList>(['tasks'])

      // Optimistically add the task
      queryClient.setQueryData<TaskList>(['tasks'], (old) => {
        if (!old) return old

        const optimisticTask = buildOptimisticTask(newTask, old.length)

        return [...old, optimisticTask]
      })

      return { previousTasks }
    },
    onError: (_err, _newTask, context) => {
      if (context?.previousTasks !== undefined) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['tags', 'with-stats'] })
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
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['tags', 'with-stats'] })
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-tags', variables.id] })
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
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['tags', 'with-stats'] })
    },
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: ['task-tags', id] })
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
    onMutate: async ({ id, status }): Promise<ToggleTaskContext> => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      const previousTasks = queryClient.getQueryData<TaskList>(['tasks'])
      const previousIncompleteTasks = queryClient.getQueryData<TaskList>(['tasks', 'incomplete'])
      const previousCompletedTasks = queryClient.getQueryData<TaskList>(['tasks', 'completed'])
      const newStatus = status === 'done' ? 'todo' : 'done'
      const completedAt = newStatus === 'done' ? new Date().toISOString() : null

      // Optimistically update all task queries
      queryClient.setQueryData<TaskList>(['tasks'], (old) => {
        if (!old) return old
        return old.map((task) =>
          task.id === id ? { ...task, status: newStatus, completed_at: completedAt } : task
        )
      })

      queryClient.setQueryData<TaskList>(['tasks', 'incomplete'], (old) => {
        if (!old) return old
        if (newStatus === 'done') {
          return old.filter((task) => task.id !== id)
        }
        return old
      })

      queryClient.setQueryData<TaskList>(['tasks', 'completed'], (old) => {
        if (!old) return old
        if (newStatus === 'done') {
          const task = previousTasks?.find((existingTask) => existingTask.id === id)
          return task ? [...old, { ...task, status: 'done', completed_at: completedAt }] : old
        }
        return old.filter((task) => task.id !== id)
      })

      return { previousTasks, previousIncompleteTasks, previousCompletedTasks }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks !== undefined) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
      if (context?.previousIncompleteTasks !== undefined) {
        queryClient.setQueryData(['tasks', 'incomplete'], context.previousIncompleteTasks)
      }
      if (context?.previousCompletedTasks !== undefined) {
        queryClient.setQueryData(['tasks', 'completed'], context.previousCompletedTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useTasksByTags(tagIds: string[], matchAll: boolean = false) {
  const sortedTagIds = [...tagIds].sort()

  return useQuery<TaskWithRelations[] | null>({
    queryKey: ['tasks', 'by-tags', sortedTagIds, matchAll],
    queryFn: async () => {
      const result = await getTasksByTags(sortedTagIds, matchAll)
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
