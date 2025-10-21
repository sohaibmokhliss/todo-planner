'use client'

import { useState, useEffect } from 'react'
import { useUpdateTask } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { useTaskTags, useSetTaskTags } from '@/hooks/useTags'
import { X } from 'lucide-react'
import { SubtaskList } from './SubtaskList'
import { TagSelector } from '@/components/tags/TagSelector'
import { ReminderManager } from '@/components/reminders/ReminderManager'
import { TaskNotes } from './TaskNotes'
import { RecurrenceSettings } from './RecurrenceSettings'
import { DependencySelector } from './DependencySelector'
import type { Database } from '@/types/database'

type Task = Database['public']['Tables']['tasks']['Row']
type Tag = Database['public']['Tables']['tags']['Row']

interface TaskEditModalProps {
  task: Task
  onClose: () => void
  onSuccess?: () => void
}

export function TaskEditModal({ task, onClose, onSuccess }: TaskEditModalProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [notes, setNotes] = useState(task.notes_html || '')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task.priority)
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>(task.status)
  const [dueDate, setDueDate] = useState(
    task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
  )
  const [projectId, setProjectId] = useState<string>(task.project_id || '')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])

  const updateTask = useUpdateTask()
  const { data: projects } = useProjects()
  const { data: taskTags } = useTaskTags(task.id)
  const setTaskTags = useSetTaskTags()

  // Load existing tags when component mounts
  useEffect(() => {
    if (taskTags) {
      setSelectedTags(taskTags)
    }
  }, [taskTags])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    try {
      const completedAt = status === 'done' ? (task.completed_at || new Date().toISOString()) : null
      await updateTask.mutateAsync({
        id: task.id,
        data: {
          title: title.trim(),
          description: description.trim() || null,
          notes_html: notes.trim() || null,
          priority,
          status,
          due_date: dueDate || null,
          project_id: projectId || null,
          completed_at: completedAt,
        },
      })

      // Update tags
      await setTaskTags.mutateAsync({
        taskId: task.id,
        tagIds: selectedTags.map(tag => tag.id),
      })

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg my-8 rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Task</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-4 space-y-4">
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

          {/* Notes */}
          <TaskNotes
            value={notes}
            onChange={setNotes}
          />

          {/* Dependencies */}
          <DependencySelector taskId={task.id} />

          {/* Recurrence */}
          <RecurrenceSettings taskId={task.id} />

          {/* Reminders */}
          <ReminderManager taskId={task.id} taskDueDate={task.due_date} />

          {/* Subtasks */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
            <SubtaskList taskId={task.id} />
          </div>
          </div>

          {/* Fixed Footer */}
          <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
            {/* Error message */}
            {updateTask.isError && (
              <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                Failed to update task. Please try again.
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || updateTask.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {updateTask.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
