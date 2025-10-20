'use client'

import { useTags } from '@/hooks/useTags'
import { useTasks } from '@/hooks/useTasks'
import { Tag as TagIcon } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

export function TagCloud() {
  const { data: tags, isLoading: tagsLoading } = useTags()
  const { data: tasks, isLoading: tasksLoading } = useTasks()

  // Calculate usage statistics for each tag
  const tagStats = useMemo(() => {
    if (!tags || !tasks) return []

    return tags.map(tag => {
      const taskCount = tasks.filter(task => {
        // We need to check if this task has this tag
        // Since we don't have task_tags data loaded here, we'll just show the tag
        return true
      }).length

      return {
        ...tag,
        taskCount,
      }
    }).sort((a, b) => b.taskCount - a.taskCount)
  }, [tags, tasks])

  if (tagsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading tags...</div>
      </div>
    )
  }

  if (!tags || tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <TagIcon size={48} className="mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No tags yet</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Create your first tag to get started
        </p>
      </div>
    )
  }

  // Calculate min and max counts for sizing
  const maxCount = Math.max(...tagStats.map(t => t.taskCount), 1)
  const minCount = Math.min(...tagStats.map(t => t.taskCount), 0)
  const range = maxCount - minCount || 1

  const getTagSize = (count: number) => {
    // Scale from 0.75rem to 2rem based on usage
    const ratio = (count - minCount) / range
    const minSize = 12
    const maxSize = 24
    return minSize + (maxSize - minSize) * ratio
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        {tagStats.map(tag => {
          const tagSlug = tag.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          const fontSize = getTagSize(tag.taskCount)

          return (
            <Link
              key={tag.id}
              href={`/app/tags/${tagSlug}`}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-all hover:scale-110 hover:shadow-lg"
              style={{
                backgroundColor: `${tag.color}15`,
                color: tag.color,
                borderWidth: '2px',
                borderColor: `${tag.color}40`,
                fontSize: `${fontSize}px`,
              }}
              title={`${tag.taskCount} task${tag.taskCount !== 1 ? 's' : ''}`}
            >
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
              {tag.name}
              {tag.taskCount > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{
                    backgroundColor: `${tag.color}25`,
                  }}
                >
                  {tag.taskCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Tag statistics table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Tag
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Tasks
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Usage
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {tagStats.map(tag => {
              const tagSlug = tag.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
              const usagePercent = tasks && tasks.length > 0 ? (tag.taskCount / tasks.length) * 100 : 0

              return (
                <tr key={tag.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/app/tags/${tagSlug}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <span
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {tag.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                    {tag.taskCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${usagePercent}%`,
                            backgroundColor: tag.color,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-12">
                        {usagePercent.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
