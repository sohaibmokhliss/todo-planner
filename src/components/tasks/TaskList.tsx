'use client'

import { TaskItem } from './TaskItem'
import type { TaskWithRelations } from '@/types/tasks'

interface TaskListProps {
  tasks: TaskWithRelations[]
  emptyMessage?: string
  searchQuery?: string
}

export function TaskList({ tasks, emptyMessage = 'No tasks yet. Create your first task to get started!', searchQuery }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-100 p-12 text-center shadow-md dark:border-indigo-700 dark:from-gray-800 dark:to-indigo-900">
        <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} searchQuery={searchQuery} />
      ))}
    </div>
  )
}
