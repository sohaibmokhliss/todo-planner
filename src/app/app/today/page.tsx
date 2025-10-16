'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm } from '@/components/tasks/TaskForm'
import { QuickAddTask } from '@/components/tasks/QuickAddTask'
import { Sidebar } from '@/components/navigation/Sidebar'
import { isToday, isPast, startOfDay } from 'date-fns'

export default function TodayPage() {
  const [showTaskForm, setShowTaskForm] = useState(false)
  const { data: allTasks, isLoading, error } = useTasks()

  // Filter tasks for today
  const todayTasks = allTasks?.filter(task => {
    if (task.status === 'done') return false
    if (!task.due_date) return false
    return isToday(new Date(task.due_date))
  }) || []

  // Overdue tasks
  const overdueTasks = allTasks?.filter(task => {
    if (task.status === 'done') return false
    if (!task.due_date) return false
    return isPast(startOfDay(new Date(task.due_date))) && !isToday(new Date(task.due_date))
  }) || []

  // Tasks without due dates
  const noDueDateTasks = allTasks?.filter(task => {
    if (task.status === 'done') return false
    return !task.due_date
  }) || []

  const totalTasks = todayTasks.length + overdueTasks.length
  const completedToday = allTasks?.filter(task => {
    if (task.status !== 'done') return false
    if (!task.completed_at) return false
    return isToday(new Date(task.completed_at))
  }).length || 0

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <main className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Today</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {totalTasks} tasks • {completedToday} completed today
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
              {/* Overdue section */}
              {overdueTasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
                    Overdue ({overdueTasks.length})
                  </h3>
                  <TaskList tasks={overdueTasks} emptyMessage="" />
                </div>
              )}

              {/* Today section */}
              {todayTasks.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Due Today ({todayTasks.length})
                  </h3>
                  <TaskList tasks={todayTasks} emptyMessage="" />
                </div>
              ) : (
                !overdueTasks.length && (
                  <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-gray-500 dark:text-gray-400">
                      No tasks due today. Enjoy your day!
                    </p>
                  </div>
                )
              )}

              {/* No due date section */}
              {noDueDateTasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    No Due Date ({noDueDateTasks.length})
                  </h3>
                  <TaskList tasks={noDueDateTasks} emptyMessage="" />
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
