'use client'

import { useState } from 'react'
import { format, isPast, isToday } from 'date-fns'
import { Trash2, Calendar, Flag, Edit2, Circle, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import { useDeleteTask, useUpdateTask } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { TaskEditModal } from './TaskEditModal'
import type { Database } from '@/types/database'

type Task = Database['public']['Tables']['tasks']['Row']

interface TaskItemProps {
  task: Task
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export function TaskItem({ task }: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const { data: projects } = useProjects()

  const isCompleted = task.status === 'done'
  const isInProgress = task.status === 'in_progress'
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isCompleted
  const isDueToday = task.due_date && isToday(new Date(task.due_date))
  const project = projects?.find(p => p.id === task.project_id)

  const handleStatusChange = async (newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      const completedAt = newStatus === 'done' ? new Date().toISOString() : null
      await updateTask.mutateAsync({
        id: task.id,
        data: {
          status: newStatus,
          completed_at: completedAt,
        },
      })
      setShowStatusMenu(false)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return

    setIsDeleting(true)
    try {
      await deleteTask.mutateAsync(task.id)
    } catch (error) {
      console.error('Failed to delete task:', error)
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div
        className={`group relative rounded-lg border bg-white p-4 transition-all hover:shadow-md dark:bg-gray-800 ${
          isCompleted
            ? 'border-gray-200 opacity-75 dark:border-gray-700'
            : 'border-gray-200 dark:border-gray-700'
        } ${isDeleting ? 'opacity-50' : ''}`}
      >
        <div className="flex items-start gap-3">
        {/* Status button */}
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            disabled={updateTask.isPending || isDeleting}
            className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
              isCompleted
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : isInProgress
                  ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'border-2 border-gray-300 hover:border-indigo-500 dark:border-gray-600 dark:hover:border-indigo-400'
            }`}
            title="Change status"
          >
            {isCompleted ? (
              <CheckCircle2 size={16} />
            ) : isInProgress ? (
              <Clock size={14} />
            ) : (
              <Circle size={14} />
            )}
          </button>

          {/* Status dropdown */}
          {showStatusMenu && (
            <div className="absolute left-0 top-8 z-10 w-40 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => handleStatusChange('todo')}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Circle size={16} />
                To Do
              </button>
              <button
                onClick={() => handleStatusChange('in_progress')}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Clock size={16} />
                In Progress
              </button>
              <button
                onClick={() => handleStatusChange('done')}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <CheckCircle2 size={16} />
                Done
              </button>
            </div>
          )}
        </div>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-medium ${
              isCompleted
                ? 'text-gray-500 line-through dark:text-gray-400'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {task.title}
          </h3>

          {task.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{task.description}</p>
          )}

          {/* Meta information */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Project badge */}
            {project && (
              <Link
                href={`/app/projects/${project.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: `${project.color}20`,
                  color: project.color,
                }}
              >
                <span>{project.emoji}</span>
                <span>{project.name}</span>
              </Link>
            )}

            {/* Status badge */}
            {isInProgress && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                <Clock size={12} />
                In Progress
              </span>
            )}

            {/* Priority badge */}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                priorityColors[task.priority]
              }`}
            >
              <Flag size={12} />
              {priorityLabels[task.priority]}
            </span>

            {/* Due date */}
            {task.due_date && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isOverdue
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : isDueToday
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                <Calendar size={12} />
                {format(new Date(task.due_date), 'MMM d')}
                {isOverdue && ' (Overdue)'}
                {isDueToday && ' (Today)'}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setIsEditing(true)}
            className="rounded p-1 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
            title="Edit task"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting || deleteTask.isPending}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>

    {/* Edit modal */}
    {isEditing && <TaskEditModal task={task} onClose={() => setIsEditing(false)} />}
  </>
  )
}
