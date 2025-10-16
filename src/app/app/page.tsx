'use client'

import { useState } from 'react'
import { Plus, Eye, EyeOff } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm } from '@/components/tasks/TaskForm'
import { QuickAddTask } from '@/components/tasks/QuickAddTask'
import { Sidebar } from '@/components/navigation/Sidebar'

export default function AppPage() {
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showCompleted, setShowCompleted] = useState(true)
  const { data: allTasks, isLoading, error } = useTasks()

  // Separate tasks into incomplete and completed
  const incompleteTasks = allTasks?.filter(task => task.status !== 'done') || []
  const completedTasks = allTasks?.filter(task => task.status === 'done') || []

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Main content */}
      <main className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Task list */}
          <div className="flex-1 overflow-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Inbox</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {incompleteTasks.length} active • {completedTasks.length} completed
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  title={showCompleted ? 'Hide completed' : 'Show completed'}
                >
                  {showCompleted ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showCompleted ? 'Hide' : 'Show'} Completed
                </button>
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  <Plus size={16} />
                  New Task
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Quick add task */}
              <QuickAddTask />

              {isLoading ? (
                <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                  <p className="text-gray-500 dark:text-gray-400">Loading tasks...</p>
                </div>
              ) : error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center dark:border-red-800 dark:bg-red-900/20">
                  <p className="text-red-600 dark:text-red-400">Failed to load tasks. Please try again.</p>
                </div>
              ) : (
                <>
                  {/* Incomplete tasks */}
                  {incompleteTasks.length > 0 ? (
                    <div className="space-y-3">
                      <TaskList tasks={incompleteTasks} emptyMessage="" />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                      <p className="text-gray-500 dark:text-gray-400">
                        No active tasks. Create your first task to get started!
                      </p>
                    </div>
                  )}

                  {/* Completed tasks */}
                  {showCompleted && completedTasks.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Completed ({completedTasks.length})
                      </h3>
                      <TaskList tasks={completedTasks} emptyMessage="" />
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
