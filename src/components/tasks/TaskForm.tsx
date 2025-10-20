'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useCreateTask } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { useSetTaskTags } from '@/hooks/useTags'
import { TagSelector } from '@/components/tags/TagSelector'
import { X } from 'lucide-react'
import type { Database } from '@/types/database'

type Tag = Database['public']['Tables']['tags']['Row']

interface TaskFormProps {
  onClose: () => void
  onSuccess?: () => void
  defaultTags?: Tag[]
}

export function TaskForm({ onClose, onSuccess, defaultTags = [] }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>('todo')
  const [dueDate, setDueDate] = useState('')
  const [projectId, setProjectId] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<Tag[]>(defaultTags)

  const defaultTagIdsKey = useMemo(() => {
    if (defaultTags.length === 0) return ''
    return defaultTags
      .map(tag => tag.id)
      .sort()
      .join(',')
  }, [defaultTags])
  const lastAppliedDefaultTagIds = useRef(defaultTagIdsKey)

  const createTask = useCreateTask()
  const { data: projects } = useProjects()
  const setTaskTags = useSetTaskTags()

  // Sync selected tags only when the default tag ids change, avoiding resets on identical arrays
  useEffect(() => {
    if (defaultTagIdsKey === lastAppliedDefaultTagIds.current) {
      return
    }

    lastAppliedDefaultTagIds.current = defaultTagIdsKey
    setSelectedTags(defaultTags)
  }, [defaultTagIdsKey, defaultTags])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    try {
      const newTask = await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        due_date: dueDate || null,
        project_id: projectId || null,
      })

      // Assign tags if any are selected
      if (newTask && selectedTags.length > 0) {
        await setTaskTags.mutateAsync({
          taskId: newTask.id,
          tagIds: selectedTags.map(tag => tag.id),
        })
      }

      setTitle('')
      setDescription('')
      setPriority('medium')
      setStatus('todo')
      setDueDate('')
      setProjectId('')
      setSelectedTags([])
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Task</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          {/* Project */}
          <div>
            <label htmlFor="project" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Project
            </label>
            <select
              id="project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">No Project</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.emoji} {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority, Status, and Due Date */}
          <div className="grid grid-cols-3 gap-4">
            {/* Priority */}
            <div>
              <label htmlFor="priority" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'todo' | 'in_progress' | 'done')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Tags */}
          <TagSelector
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />

          {/* Error message */}
          {createTask.isError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              Failed to create task. Please try again.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || createTask.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
