'use client'

import { useTasksByTags } from '@/hooks/useTasks'
import { useTags } from '@/hooks/useTags'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm } from '@/components/tasks/TaskForm'
import { Plus, Tag as TagIcon, X, ChevronLeft } from 'lucide-react'
import { useState, useMemo, use } from 'react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default function TagFilterPage({ params }: PageProps) {
  const { slug } = use(params)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [matchAll, setMatchAll] = useState(false)

  const { data: allTags, isLoading: tagsLoading } = useTags()

  // Find the primary tag from the slug
  const primaryTag = useMemo(() => {
    if (!allTags) return null
    return allTags.find(tag => tag.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug)
  }, [allTags, slug])

  // Determine which tags to filter by
  const tagIdsToFilter = useMemo(() => {
    if (selectedTagIds.length > 0) {
      return selectedTagIds
    }
    return primaryTag ? [primaryTag.id] : []
  }, [selectedTagIds, primaryTag])

  const { data: tasks, isLoading: tasksLoading } = useTasksByTags(tagIdsToFilter, matchAll)

  if (tagsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!primaryTag) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tag not found</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The tag you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
        <Link
          href="/app/tags"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          View All Tags
        </Link>
      </div>
    )
  }

  const taskCount = tasks?.length || 0
  const completedCount = tasks?.filter(task => task.status === 'done').length || 0

  // Get available tags for multi-select (exclude already selected)
  const availableTags = allTags?.filter(tag =>
    !selectedTagIds.includes(tag.id) && tag.id !== primaryTag.id
  ) || []

  const handleAddTag = (tagId: string) => {
    setSelectedTagIds(prev => [...prev, tagId])
  }

  const handleRemoveTag = (tagId: string) => {
    setSelectedTagIds(prev => prev.filter(id => id !== tagId))
  }

  const selectedTags = allTags?.filter(tag => selectedTagIds.includes(tag.id)) || []
  const activeTagCount = selectedTagIds.length > 0 ? selectedTagIds.length + 1 : 1

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${primaryTag.color}20` }}
            >
              <TagIcon size={20} style={{ color: primaryTag.color }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {primaryTag.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                {taskCount > 0 && ` • ${completedCount} completed`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/app"
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={16} />
              Back to Inbox
            </Link>
            <button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={18} />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Multi-tag filter controls */}
        <div className="mt-4 space-y-3">
          {/* Selected additional tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Also filtering by:
              </span>
              {selectedTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleRemoveTag(tag.id)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    borderWidth: '1px',
                    borderColor: `${tag.color}40`,
                  }}
                >
                  {tag.name}
                  <X size={14} />
                </button>
              ))}
            </div>
          )}

          {/* Filter controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Add tag dropdown */}
            {availableTags.length > 0 && (
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddTag(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <option value="">+ Add another tag</option>
                  {availableTags.map(tag => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Match all toggle */}
            {activeTagCount > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Match:</span>
                <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
                  <button
                    onClick={() => setMatchAll(false)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      !matchAll
                        ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    Any
                  </button>
                  <button
                    onClick={() => setMatchAll(true)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      matchAll
                        ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    All
                  </button>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({matchAll ? `Has all ${activeTagCount} tags` : `Has any of ${activeTagCount} tags`})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-6">
        {tasksLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading tasks...</div>
          </div>
        ) : tasks && tasks.length > 0 ? (
          <TaskList tasks={tasks} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <TagIcon size={48} className="mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              No tasks with {activeTagCount > 1 ? 'these tags' : 'this tag'}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Create a task and assign it the &ldquo;{primaryTag.name}&rdquo; tag to see it here.
            </p>
            <button
              onClick={() => setShowTaskForm(true)}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Create Task
            </button>
          </div>
        )}
      </div>

      {/* Task form modal */}
      {showTaskForm && (
        <TaskForm
          onClose={() => setShowTaskForm(false)}
          defaultTags={[primaryTag, ...selectedTags]}
        />
      )}
    </div>
  )
}
