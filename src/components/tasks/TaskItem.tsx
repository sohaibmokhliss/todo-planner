'use client'

import { useState, useEffect } from 'react'
import { format, isPast, isToday } from 'date-fns'
import { Trash2, Calendar, Flag, Edit2, Circle, CheckCircle2, Clock, ChevronRight, ChevronDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { useDeleteTask, useUpdateTask } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { useTaskTags } from '@/hooks/useTags'
import { TaskEditModal } from './TaskEditModal'
import { SubtaskItem } from './SubtaskItem'
import { getSubtasksByTaskId, createSubtask } from '@/lib/actions/subtasks'
import type { Database } from '@/types/database'

type Task = Database['public']['Tables']['tasks']['Row']
type Subtask = Database['public']['Tables']['subtasks']['Row']

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
  const [isExpanded, setIsExpanded] = useState(false)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const { data: projects } = useProjects()
  const { data: taskTags } = useTaskTags(task.id)

  const isCompleted = task.status === 'done'
  const isInProgress = task.status === 'in_progress'
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isCompleted
  const isDueToday = task.due_date && isToday(new Date(task.due_date))
  const project = projects?.find(p => p.id === task.project_id)

  useEffect(() => {
    // Load subtasks on mount to show count
    const loadSubtasks = async () => {
      const { data, error } = await getSubtasksByTaskId(task.id)
      if (data && !error) {
        // Only show top-level subtasks (those without a parent)
        setSubtasks(data.filter(s => !s.parent_id))
      }
    }
    loadSubtasks()
  }, [task.id])

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

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return

    setIsAddingSubtask(true)
    try {
      const { data, error } = await createSubtask({
        task_id: task.id,
        parent_id: null,
        title: newSubtaskTitle.trim(),
        completed: false,
      })

      if (data && !error) {
        setSubtasks([...subtasks, data])
        setNewSubtaskTitle('')
        setShowAddSubtask(false)
      }
    } catch (error) {
      console.error('Failed to create subtask:', error)
    } finally {
      setIsAddingSubtask(false)
    }
  }

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddSubtask()
    } else if (e.key === 'Escape') {
      setShowAddSubtask(false)
      setNewSubtaskTitle('')
    }
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const completedSubtasks = subtasks.filter(s => s.completed).length
  const totalSubtasks = subtasks.length

  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  return (
    <>
      <div className={`${isDeleting ? 'opacity-50' : ''}`}>
        <div
          className={`group relative rounded-lg border bg-white p-4 transition-all hover:shadow-md dark:bg-gray-800 ${
            isCompleted
              ? 'border-green-300 bg-green-50/30 dark:border-green-800 dark:bg-green-900/10'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          {/* Completion celebration indicator */}
          {isCompleted && (
            <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white shadow-lg animate-in zoom-in duration-300">
              <CheckCircle2 size={20} />
            </div>
          )}
          <div className="flex items-start gap-3">
            {/* Expand/Collapse button */}
            <button
              onClick={toggleExpanded}
              className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {/* Status button */}
            <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            disabled={updateTask.isPending || isDeleting}
            className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-all ${
              isCompleted
                ? 'bg-green-500 text-white shadow-md hover:bg-green-600 hover:shadow-lg scale-110'
                : isInProgress
                  ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 dark:border-gray-600 dark:hover:border-indigo-400 dark:hover:bg-indigo-900/20'
            }`}
            title="Change status"
          >
            {isCompleted ? (
              <CheckCircle2 size={18} className="animate-in zoom-in duration-300" />
            ) : isInProgress ? (
              <Clock size={15} />
            ) : (
              <Circle size={15} />
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
            className={`text-base font-semibold transition-all ${
              isCompleted
                ? 'text-green-700 line-through dark:text-green-400'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {isCompleted && <span className="mr-2 text-lg">✓</span>}
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
                {format(new Date(task.due_date), 'dd/MM/yyyy')}
                {isOverdue && ' (Overdue)'}
                {isDueToday && ' (Today)'}
              </span>
            )}

            {/* Subtasks count with progress indicator */}
            {totalSubtasks > 0 && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                completedSubtasks === totalSubtasks
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
              }`}>
                {completedSubtasks === totalSubtasks ? (
                  <CheckCircle2 size={12} className="text-green-600 dark:text-green-400" />
                ) : (
                  <Circle size={12} className="text-indigo-600 dark:text-indigo-400" />
                )}
                {completedSubtasks}/{totalSubtasks} subtasks
              </span>
            )}

            {/* Tags */}
            {taskTags && taskTags.length > 0 && taskTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  borderWidth: '1px',
                  borderColor: `${tag.color}40`,
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>

          {/* Progress bar for subtasks */}
          {totalSubtasks > 0 && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  Subtask Progress
                </span>
                <span className={`font-semibold ${
                  completedSubtasks === totalSubtasks
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}>
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full transition-all duration-500 ease-out ${
                    completedSubtasks === totalSubtasks
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => {
                  setIsExpanded(true)
                  setShowAddSubtask(true)
                }}
                className="rounded p-1 text-gray-400 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                title="Add subtask"
              >
                <Plus size={16} />
              </button>
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

        {/* Subtasks tree view */}
        {isExpanded && (
          <div className="ml-9 mt-3 space-y-2">
            {/* Quick add subtask form */}
            {showAddSubtask && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex-1 flex items-center gap-2 rounded-lg border-2 border-indigo-300 bg-white px-3 py-2.5 shadow-sm dark:border-indigo-600 dark:bg-gray-800">
                  <span className="text-indigo-400 dark:text-indigo-500">└─</span>
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={handleSubtaskKeyDown}
                    placeholder="New subtask..."
                    disabled={isAddingSubtask}
                    autoFocus
                    className="flex-1 border-0 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  disabled={isAddingSubtask || !newSubtaskTitle.trim()}
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-green-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
                >
                  {isAddingSubtask ? 'Adding...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubtask(false)
                    setNewSubtaskTitle('')
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Subtasks list */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5">
                {subtasks.map((subtask, index) => (
                  <div key={subtask.id} className="flex items-start gap-2">
                    <span className="mt-2 text-gray-400 dark:text-gray-500">
                      {index === subtasks.length - 1 ? '└─' : '├─'}
                    </span>
                    <div className="flex-1">
                      <SubtaskItem
                        subtask={subtask}
                        onUpdate={async () => {
                          const { data, error } = await getSubtasksByTaskId(task.id)
                          if (data && !error) {
                            setSubtasks(data.filter(s => !s.parent_id))
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!showAddSubtask && subtasks.length === 0 && (
              <button
                onClick={() => setShowAddSubtask(true)}
                className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
              >
                <span className="text-gray-400 dark:text-gray-500">└─</span>
                <Plus size={16} />
                Add first subtask
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {isEditing && <TaskEditModal task={task} onClose={() => setIsEditing(false)} />}
    </>
  )
}
