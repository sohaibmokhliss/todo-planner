'use client'

import { useState, KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'
import { useCreateTask } from '@/hooks/useTasks'

interface QuickAddTaskProps {
  onSuccess?: () => void
}

export function QuickAddTask({ onSuccess }: QuickAddTaskProps) {
  const [title, setTitle] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const createTask = useCreateTask()

  const handleSubmit = async () => {
    if (!title.trim()) return

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        priority: 'medium',
      })

      setTitle('')
      setIsExpanded(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      setTitle('')
      setIsExpanded(false)
    }
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-3 text-left text-sm text-gray-500 transition-colors hover:border-indigo-400 hover:bg-gray-50 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:bg-gray-700 dark:hover:text-indigo-400"
      >
        <Plus size={16} />
        Quick add task...
      </button>
    )
  }

  return (
    <div className="rounded-lg border-2 border-indigo-500 bg-white p-3 shadow-sm dark:border-indigo-400 dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (!title.trim()) {
              setIsExpanded(false)
            }
          }}
          placeholder="What needs to be done? (Press Enter to save, Esc to cancel)"
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-500 focus:outline-none dark:text-white dark:placeholder-gray-400"
          autoFocus
        />
        {createTask.isPending && (
          <span className="text-xs text-gray-500 dark:text-gray-400">Saving...</span>
        )}
      </div>
      {createTask.isError && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          Failed to create task. Press Enter to try again.
        </p>
      )}
    </div>
  )
}
