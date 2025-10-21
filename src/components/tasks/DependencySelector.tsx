'use client'

import { useState } from 'react'
import { Link2, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useTaskDependencies, useAddTaskDependency, useRemoveTaskDependency } from '@/hooks/useDependencies'
import { useTasks } from '@/hooks/useTasks'

interface DependencySelectorProps {
  taskId: string
}

export function DependencySelector({ taskId }: DependencySelectorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: dependencies, isLoading } = useTaskDependencies(taskId)
  const { data: allTasks } = useTasks()
  const addDependency = useAddTaskDependency()
  const removeDependency = useRemoveTaskDependency()

  // Filter out current task and already dependent tasks
  const availableTasks = allTasks?.filter(task => {
    if (task.id === taskId) return false
    if (dependencies?.some(dep => dep.depends_on_task_id === task.id)) return false
    return true
  })

  const handleAdd = async () => {
    if (!selectedTaskId) return

    setError(null)
    try {
      await addDependency.mutateAsync({
        taskId,
        dependsOnTaskId: selectedTaskId,
      })
      setSelectedTaskId('')
      setIsAdding(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add dependency')
    }
  }

  const handleRemove = async (dependencyId: string) => {
    try {
      await removeDependency.mutateAsync(dependencyId)
    } catch (err) {
      console.error('Failed to remove dependency:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">Loading dependencies...</div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Link2 size={16} />
          Dependencies
        </label>
      </div>

      {/* Existing Dependencies */}
      {dependencies && dependencies.length > 0 && (
        <div className="space-y-2">
          {dependencies.map((dep) => {
            const task = dep.tasks as any
            if (!task) return null

            return (
              <div
                key={dep.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {task.status === 'done' ? (
                    <CheckCircle2 size={16} className="flex-shrink-0 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle size={16} className="flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {task.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {task.status === 'done' ? (
                        <span className="text-green-600 dark:text-green-400">Completed</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">
                          {task.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                        </span>
                      )}
                      {task.priority && (
                        <span className="ml-2">
                          • Priority: {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(dep.id)}
                  className="ml-2 flex-shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title="Remove dependency"
                >
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add New Dependency */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          disabled={!availableTasks || availableTasks.length === 0}
          className="w-full rounded-lg border-2 border-dashed border-gray-300 p-3 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
        >
          <Link2 size={16} className="inline mr-2" />
          {availableTasks && availableTasks.length > 0
            ? 'Add dependency'
            : 'No tasks available'}
        </button>
      )}

      {isAdding && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3 dark:border-gray-700 dark:bg-gray-900">
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              This task depends on
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a task...</option>
              {availableTasks?.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} {task.status === 'done' ? '✓' : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This task cannot be completed until the selected task is done
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedTaskId || addDependency.isPending}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {addDependency.isPending ? 'Adding...' : 'Add Dependency'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false)
                setSelectedTaskId('')
                setError(null)
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {dependencies && dependencies.length === 0 && !isAdding && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No dependencies. This task can be completed at any time.
        </p>
      )}
    </div>
  )
}
