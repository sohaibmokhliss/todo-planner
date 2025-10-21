'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTaskDependencies,
  getTaskDependents,
  addTaskDependency,
  removeTaskDependency,
  canCompleteTask,
} from '@/lib/actions/dependencies'

export function useTaskDependencies(taskId: string) {
  return useQuery({
    queryKey: ['task-dependencies', taskId],
    queryFn: async () => {
      const result = await getTaskDependencies(taskId)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
  })
}

export function useTaskDependents(taskId: string) {
  return useQuery({
    queryKey: ['task-dependents', taskId],
    queryFn: async () => {
      const result = await getTaskDependents(taskId)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
  })
}

export function useAddTaskDependency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, dependsOnTaskId }: { taskId: string; dependsOnTaskId: string }) => {
      const result = await addTaskDependency(taskId, dependsOnTaskId)
      if (result.error) {
        throw new Error(result.error)
      }
      return true
    },
    onSuccess: (_, { taskId, dependsOnTaskId }) => {
      queryClient.invalidateQueries({ queryKey: ['task-dependencies', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-dependents', dependsOnTaskId] })
    },
  })
}

export function useRemoveTaskDependency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dependencyId: string) => {
      const result = await removeTaskDependency(dependencyId)
      if (result.error) {
        throw new Error(result.error)
      }
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-dependencies'] })
      queryClient.invalidateQueries({ queryKey: ['task-dependents'] })
    },
  })
}

export function useCanCompleteTask(taskId: string) {
  return useQuery({
    queryKey: ['can-complete-task', taskId],
    queryFn: async () => {
      const result = await canCompleteTask(taskId)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
  })
}
