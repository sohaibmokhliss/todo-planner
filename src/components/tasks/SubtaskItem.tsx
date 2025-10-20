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
      <div className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all ${
        subtask.completed
          ? 'bg-green-50/50 border border-green-200/50 dark:bg-green-900/10 dark:border-green-800/30'
          : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600'
      }`}>
        {/* Expand/Collapse button */}
        {totalChildren > 0 ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded hover:bg-gray-200/50 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700/50"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <div className="w-5 flex-shrink-0" />
        )}

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={subtask.completed}
          onChange={handleToggle}
          disabled={isLoading}
          className="h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-green-600"
        />

        {/* Title */}
        <span
          className={`flex-1 min-w-0 text-sm font-medium transition-all ${
            subtask.completed
              ? 'text-green-700/70 line-through dark:text-green-400/70'
              : 'text-gray-800 dark:text-gray-200'
          }`}
        >
          {subtask.completed && <span className="mr-2">✓</span>}
          {subtask.title}
        </span>

        {/* Children count badge - always visible */}
        {totalChildren > 0 && (
          <div className={`flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
            completedChildren === totalChildren
              ? 'bg-green-100 text-green-700 ring-1 ring-green-200 dark:bg-green-900/40 dark:text-green-300 dark:ring-green-800'
              : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-600'
          }`}>
            <span className="whitespace-nowrap">{completedChildren}/{totalChildren}</span>
          </div>
        )}

        {/* Action buttons container */}
        <div className="flex flex-shrink-0 items-center gap-1">
          {/* Add child button */}
          <button
            onClick={() => {
              setIsExpanded(true)
              setShowAddChild(true)
            }}
            className="text-gray-400 opacity-0 transition-all hover:text-green-600 group-hover:opacity-100 hover:scale-110 dark:text-gray-500 dark:hover:text-green-400"
            aria-label="Add sub-subtask"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="text-gray-400 opacity-0 transition-all hover:text-red-600 group-hover:opacity-100 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-500 dark:hover:text-red-400"
            aria-label="Delete subtask"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Nested children */}
      {isExpanded && (
        <div className="ml-4 space-y-1">
          {/* Quick add child form */}
          {showAddChild && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex-1 flex items-center gap-2 rounded-lg border-2 border-indigo-300 bg-white px-3 py-2 shadow-sm dark:border-indigo-600 dark:bg-gray-800">
                <span className="text-indigo-400 dark:text-indigo-500 text-sm">└─</span>
                <input
                  type="text"
                  value={newChildTitle}
                  onChange={(e) => setNewChildTitle(e.target.value)}
                  onKeyDown={handleChildKeyDown}
                  placeholder="Add nested subtask..."
                  disabled={isAddingChild}
                  autoFocus
                  className="flex-1 border-0 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddChild}
                disabled={isAddingChild || !newChildTitle.trim()}
                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white transition-all hover:bg-green-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
              >
                {isAddingChild ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddChild(false)
                  setNewChildTitle('')
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
              className="flex items-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
            >
              <span className="text-gray-400 dark:text-gray-500">└─</span>
              <Plus size={14} />
              Add nested subtask
            </button>
          )}
        </div>
      )}
    </div>
  )
}
