'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTaskReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  getUpcomingReminders,
} from '@/lib/actions/reminders'
import type { Database } from '@/types/database'

type ReminderInsert = Omit<Database['public']['Tables']['reminders']['Insert'], 'sent'>
type ReminderUpdate = Database['public']['Tables']['reminders']['Update']

export function useTaskReminders(taskId: string) {
  return useQuery({
    queryKey: ['reminders', 'task', taskId],
    queryFn: async () => {
      const result = await getTaskReminders(taskId)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled: !!taskId,
  })
}

export function useCreateReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reminderData: ReminderInsert) => {
      const result = await createReminder(reminderData)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reminders', 'task', variables.task_id] })
      queryClient.invalidateQueries({ queryKey: ['reminders', 'upcoming'] })
    },
  })
}

export function useUpdateReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReminderUpdate }) => {
      const result = await updateReminder(id, data)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })
}

export function useDeleteReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteReminder(id)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })
}

export function useUpcomingReminders() {
  return useQuery({
    queryKey: ['reminders', 'upcoming'],
    queryFn: async () => {
      const result = await getUpcomingReminders()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
  })
}
