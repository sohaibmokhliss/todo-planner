'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getRecurrenceByTaskId,
  createRecurrence,
  updateRecurrence,
  deleteRecurrence,
} from '@/lib/actions/recurrence'
import type { Database } from '@/types/database'

type RecurrenceInsert = Omit<Database['public']['Tables']['recurrence']['Insert'], 'id' | 'created_at' | 'updated_at'>
type RecurrenceUpdate = Database['public']['Tables']['recurrence']['Update']

export function useRecurrence(taskId: string) {
  return useQuery({
    queryKey: ['recurrence', taskId],
    queryFn: async () => {
      const result = await getRecurrenceByTaskId(taskId)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
  })
}

export function useCreateRecurrence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RecurrenceInsert) => {
      const result = await createRecurrence(data)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recurrence', variables.task_id] })
    },
  })
}

export function useUpdateRecurrence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: RecurrenceUpdate }) => {
      const result = await updateRecurrence(taskId, data)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recurrence', variables.taskId] })
    },
  })
}

export function useDeleteRecurrence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const result = await deleteRecurrence(taskId)
      if (result.error) {
        throw new Error(result.error)
      }
      return true
    },
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['recurrence', taskId] })
    },
  })
}
