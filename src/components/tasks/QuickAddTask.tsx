'use client'

import { useState, KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'
import { useCreateTask } from '@/hooks/useTasks'

interface QuickAddTaskProps {
  projectId?: string
  onSuccess?: () => void
}

export function QuickAddTask({ projectId, onSuccess }: QuickAddTaskProps) {
  const [title, setTitle] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const createTask = useCreateTask()

  const handleSubmit = async () => {
    if (!title.trim()) return

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        priority: 'medium',
        project_id: projectId || null,
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
        className="group flex w-full items-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-100 px-4 py-3 text-left text-sm font-semibold text-indigo-700 shadow-md transition-all hover:scale-[1.02] hover:border-indigo-400 hover:from-indigo-100 hover:to-purple-200 hover:shadow-lg dark:border-indigo-700 dark:from-gray-800 dark:to-indigo-900 dark:text-indigo-300 dark:hover:border-indigo-600"
      >
        <Plus size={18} className="transition-transform group-hover:rotate-90" />
        Quick add task...
      </button>
    )
  }

  return (
    <div className="animate-in slide-in-from-top-2 rounded-xl border-2 border-indigo-500 bg-white p-3 shadow-lg dark:border-indigo-400 dark:bg-gray-800">
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
