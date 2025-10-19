'use client'

import { useState, useEffect } from 'react'
import { Trash2, Plus, ChevronRight, ChevronDown } from 'lucide-react'
import { toggleSubtaskCompletion, deleteSubtask, getSubtasksByParentId, createSubtask } from '@/lib/actions/subtasks'
import type { Database } from '@/types/database'

type Subtask = Database['public']['Tables']['subtasks']['Row']

interface SubtaskItemProps {
  subtask: Subtask
  onUpdate?: () => void
  depth?: number
}

export function SubtaskItem({ subtask, onUpdate, depth = 0 }: SubtaskItemProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [children, setChildren] = useState<Subtask[]>([])
  const [showAddChild, setShowAddChild] = useState(false)
  const [newChildTitle, setNewChildTitle] = useState('')
  const [isAddingChild, setIsAddingChild] = useState(false)

  useEffect(() => {
    // Always load children to show count
    const loadChildren = async () => {
      const { data, error } = await getSubtasksByParentId(subtask.id)
      if (data && !error) {
        setChildren(data)
      }
    }
    loadChildren()
  }, [subtask.id])

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      await toggleSubtaskCompletion(subtask.id)
      onUpdate?.()
    } catch (error) {
      console.error('Failed to toggle subtask:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this subtask and all its children?')) return

    setIsLoading(true)
    try {
      await deleteSubtask(subtask.id)
      onUpdate?.()
    } catch (error) {
      console.error('Failed to delete subtask:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddChild = async () => {
    if (!newChildTitle.trim()) return

    setIsAddingChild(true)
    try {
      const { data, error } = await createSubtask({
        task_id: subtask.task_id,
        parent_id: subtask.id,
        title: newChildTitle.trim(),
        completed: false,
      })

      if (error) {
        console.error('Error creating child subtask:', error)
        alert(`Failed to create subtask: ${error}`)
        return
      }

      if (data) {
        // Reload children to get fresh data
        const { data: updatedChildren } = await getSubtasksByParentId(subtask.id)
        if (updatedChildren) {
          setChildren(updatedChildren)
        }
        setNewChildTitle('')
        setShowAddChild(false)
        setIsExpanded(true)
      }
    } catch (error) {
      console.error('Failed to create child subtask:', error)
      alert(`Failed to create subtask: ${error}`)
    } finally {
      setIsAddingChild(false)
    }
  }

  const handleChildKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddChild()
    } else if (e.key === 'Escape') {
      setShowAddChild(false)
      setNewChildTitle('')
    }
  }

  const completedChildren = children.filter(c => c.completed).length
  const totalChildren = children.length

  return (
    <div className="space-y-1">
      <div className="group flex items-center gap-2 rounded-md bg-gray-50 px-2 py-1.5 transition-colors hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-700/50">
        {/* Expand/Collapse button */}
        {totalChildren > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        )}
        {totalChildren === 0 && <div className="w-4" />}

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={subtask.completed}
          onChange={handleToggle}
          disabled={isLoading}
          className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
        />

        {/* Title */}
        <span
          className={`flex-1 text-sm ${
            subtask.completed
              ? 'text-gray-500 line-through dark:text-gray-400'
              : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {subtask.title}
        </span>

        {/* Children count */}
        {totalChildren > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {completedChildren}/{totalChildren}
          </span>
        )}

        {/* Add child button */}
        <button
          onClick={() => {
            setIsExpanded(true)
            setShowAddChild(true)
          }}
          className="text-gray-400 opacity-0 transition-opacity hover:text-green-600 group-hover:opacity-100 dark:text-gray-500 dark:hover:text-green-400"
          aria-label="Add sub-subtask"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="text-gray-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-500 dark:hover:text-red-400"
          aria-label="Delete subtask"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Nested children */}
      {isExpanded && (
        <div className="ml-4 space-y-1">
          {/* Quick add child form */}
          {showAddChild && (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-md border border-gray-300 bg-white px-2 py-1 dark:border-gray-600 dark:bg-gray-800">
                <span className="text-gray-400 dark:text-gray-500 text-xs">└─</span>
                <input
                  type="text"
                  value={newChildTitle}
                  onChange={(e) => setNewChildTitle(e.target.value)}
                  onKeyDown={handleChildKeyDown}
                  placeholder="Add subtask..."
                  disabled={isAddingChild}
                  autoFocus
                  className="flex-1 border-0 bg-transparent text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddChild}
                disabled={isAddingChild || !newChildTitle.trim()}
                className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddChild(false)
                  setNewChildTitle('')
                }}
                className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Child subtasks - recursive! */}
          {children.length > 0 && (
            <div className="space-y-1">
              {children.map((child, index) => (
                <div key={child.id} className="flex items-start gap-1.5">
                  <span className="mt-1.5 text-gray-400 dark:text-gray-500 text-xs">
                    {index === children.length - 1 ? '└─' : '├─'}
                  </span>
                  <div className="flex-1">
                    <SubtaskItem
                      subtask={child}
                      onUpdate={() => {
                        // Reload children when a child updates
                        getSubtasksByParentId(subtask.id).then(({ data }) => {
                          if (data) setChildren(data)
                        })
                      }}
                      depth={depth + 1}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showAddChild && children.length === 0 && (
            <button
              onClick={() => setShowAddChild(true)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
            >
              <span className="text-gray-400 dark:text-gray-500">└─</span>
              <Plus size={12} />
              Add subtask
            </button>
          )}
        </div>
      )}
    </div>
  )
}
