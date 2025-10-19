'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { SubtaskItem } from './SubtaskItem'
import { createSubtask, getSubtasksByTaskId } from '@/lib/actions/subtasks'
import type { Database } from '@/types/database'

type Subtask = Database['public']['Tables']['subtasks']['Row']

interface SubtaskListProps {
  taskId: string
}

export function SubtaskList({ taskId }: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSubtasks = async () => {
      const { data, error } = await getSubtasksByTaskId(taskId)
      if (data && !error) {
        // Only show top-level subtasks (those without a parent)
        setSubtasks(data.filter(s => !s.parent_id))
      }
      setIsLoading(false)
    }
    loadSubtasks()
  }, [taskId])

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return

    setIsAdding(true)
    try {
      const { data, error } = await createSubtask({
        task_id: taskId,
        parent_id: null,
        title: newSubtaskTitle.trim(),
        completed: false,
      })

      if (data && !error) {
        setSubtasks([...subtasks, data])
        setNewSubtaskTitle('')
      }
    } catch (error) {
      console.error('Failed to create subtask:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddSubtask()
    }
  }

  const completedCount = subtasks.filter((s) => s.completed).length
  const totalCount = subtasks.length

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Subtasks
          </h4>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Subtasks
          {totalCount > 0 && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              {completedCount}/{totalCount} completed
            </span>
          )}
        </h4>
      </div>

      {/* Subtask List */}
      {subtasks.length > 0 && (
        <div className="space-y-2">
          {subtasks.map((subtask) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              onUpdate={async () => {
                const { data, error } = await getSubtasksByTaskId(taskId)
                if (data && !error) {
                  setSubtasks(data.filter(s => !s.parent_id))
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Add Subtask Form */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a subtask..."
          disabled={isAdding}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
        />
        <button
          type="button"
          onClick={handleAddSubtask}
          disabled={isAdding || !newSubtaskTitle.trim()}
          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
    </div>
  )
}
