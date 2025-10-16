'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm } from '@/components/tasks/TaskForm'
import { QuickAddTask } from '@/components/tasks/QuickAddTask'
import { Sidebar } from '@/components/navigation/Sidebar'
import { format, isFuture, isToday, startOfDay, addDays } from 'date-fns'

export default function UpcomingPage() {
  const [showTaskForm, setShowTaskForm] = useState(false)
  const { data: allTasks, isLoading, error } = useTasks()

  // Group tasks by due date
  const groupedTasks: Record<string, typeof allTasks> = {}

  allTasks?.forEach(task => {
    if (task.status === 'done' || !task.due_date) return

    const dueDate = new Date(task.due_date)
    if (isToday(dueDate) || !isFuture(startOfDay(dueDate))) return

    const dateKey = format(dueDate, 'yyyy-MM-dd')
    if (!groupedTasks[dateKey]) {
      groupedTasks[dateKey] = []
    }
    groupedTasks[dateKey].push(task)
  })

  // Get next 7 days
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i + 1)
    return format(date, 'yyyy-MM-dd')
  })

  const totalUpcoming = Object.values(groupedTasks).flat().length

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <main className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upcoming</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {totalUpcoming} upcoming tasks
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
          ) : totalUpcoming === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">
                No upcoming tasks scheduled.
              </p>
            </div>
          ) : (
            <>
              {/* Next 7 days */}
              {next7Days.map(dateKey => {
                const tasks = groupedTasks[dateKey]
                if (!tasks || tasks.length === 0) return null

                const date = new Date(dateKey)
                const dayLabel = format(date, 'EEEE, MMM d')

                return (
                  <div key={dateKey} className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {dayLabel} ({tasks.length})
                    </h3>
                    <TaskList tasks={tasks} emptyMessage="" />
                  </div>
                )
              })}

              {/* Tasks beyond 7 days */}
              {Object.entries(groupedTasks)
                .filter(([dateKey]) => !next7Days.includes(dateKey))
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dateKey, tasks]) => {
                  const date = new Date(dateKey)
                  const dayLabel = format(date, 'EEEE, MMM d, yyyy')

                  return (
                    <div key={dateKey} className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {dayLabel} ({tasks.length})
                      </h3>
                      <TaskList tasks={tasks} emptyMessage="" />
                    </div>
                  )
                })}
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
