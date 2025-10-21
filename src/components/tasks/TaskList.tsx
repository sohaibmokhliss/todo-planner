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
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
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
