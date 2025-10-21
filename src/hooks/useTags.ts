'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTags,
  getTagsWithStats,
  createTag,
  updateTag,
  deleteTag,
  addTagToTask,
  removeTagFromTask,
  setTaskTags,
  getTaskTags,
} from '@/lib/actions/tags'
import type { Database } from '@/types/database'

type TagInsert = Omit<Database['public']['Tables']['tags']['Insert'], 'user_id'>
type TagUpdate = Database['public']['Tables']['tags']['Update']

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const result = await getTags()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
  })
}

export function useTagsWithStats() {
  return useQuery({
    queryKey: ['tags', 'with-stats'],
    queryFn: async () => {
      const result = await getTagsWithStats()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
  })
}

export function useTaskTags(taskId: string) {
  return useQuery({
    queryKey: ['task-tags', taskId],
    queryFn: async () => {
      const result = await getTaskTags(taskId)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tagData: TagInsert) => {
      const result = await createTag(tagData)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TagUpdate }) => {
      const result = await updateTag(id, data)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTag(id)
      if (result.error) {
        throw new Error(result.error)
      }
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useAddTagToTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, tagId }: { taskId: string; tagId: string }) => {
      const result = await addTagToTask(taskId, tagId)
      if (result.error) {
        throw new Error(result.error)
      }
      return true
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['task-tags', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tags', 'with-stats'] })
    },
  })
}

export function useRemoveTagFromTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, tagId }: { taskId: string; tagId: string }) => {
      const result = await removeTagFromTask(taskId, tagId)
      if (result.error) {
        throw new Error(result.error)
      }
      return true
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['task-tags', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tags', 'with-stats'] })
    },
  })
}

export function useSetTaskTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, tagIds }: { taskId: string; tagIds: string[] }) => {
      const result = await setTaskTags(taskId, tagIds)
      if (result.error) {
        throw new Error(result.error)
      }
      return true
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['task-tags', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tags', 'with-stats'] })
    },
  })
}
