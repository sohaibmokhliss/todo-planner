'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useCompletedTasks } from '@/hooks/useTasks'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm } from '@/components/tasks/TaskForm'
import { Sidebar } from '@/components/navigation/Sidebar'
import { isToday, isYesterday, startOfWeek, endOfWeek } from 'date-fns'

export default function CompletedPage() {
  const [showTaskForm, setShowTaskForm] = useState(false)
  const { data: completedTasks, isLoading, error } = useCompletedTasks()

  // Group completed tasks by completion date
  const today = completedTasks?.filter(task =>
    task.completed_at && isToday(new Date(task.completed_at))
  ) || []

  const yesterday = completedTasks?.filter(task =>
    task.completed_at && isYesterday(new Date(task.completed_at))
  ) || []

  const thisWeek = completedTasks?.filter(task => {
    if (!task.completed_at) return false
    const date = new Date(task.completed_at)
    return !isToday(date) && !isYesterday(date) &&
           date >= startOfWeek(new Date()) && date <= endOfWeek(new Date())
  }) || []

  const older = completedTasks?.filter(task => {
    if (!task.completed_at) return false
    const date = new Date(task.completed_at)
    return date < startOfWeek(new Date())
  }) || []

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <main className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Completed</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {completedTasks?.length || 0} completed tasks
            </p>
          </div>
          <button
            onClick={() => setShowTaskForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">Loading tasks...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center dark:border-red-800 dark:bg-red-900/20">
              <p className="text-red-600 dark:text-red-400">Failed to load tasks. Please try again.</p>
            </div>
          ) : !completedTasks || completedTasks.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">
                No completed tasks yet. Complete some tasks to see them here!
              </p>
            </div>
          ) : (
            <>
              {/* Today */}
              {today.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Today ({today.length})
                  </h3>
                  <TaskList tasks={today} emptyMessage="" />
                </div>
              )}

              {/* Yesterday */}
              {yesterday.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Yesterday ({yesterday.length})
                  </h3>
                  <TaskList tasks={yesterday} emptyMessage="" />
                </div>
              )}

              {/* This Week */}
              {thisWeek.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    This Week ({thisWeek.length})
                  </h3>
                  <TaskList tasks={thisWeek} emptyMessage="" />
                </div>
              )}

              {/* Older */}
              {older.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Older ({older.length})
                  </h3>
                  <TaskList tasks={older} emptyMessage="" />
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </main>

      {/* Task form modal */}
      {showTaskForm && <TaskForm onClose={() => setShowTaskForm(false)} />}
    </div>
  )
}
