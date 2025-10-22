'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSearchTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { useTags } from '@/hooks/useTags'
import { TaskList } from '@/components/tasks/TaskList'
import { SearchBar } from '@/components/search/SearchBar'
import { SavedSearches } from '@/components/search/SavedSearches'
import Link from 'next/link'
import { Search as SearchIcon, Filter, X, ChevronLeft } from 'lucide-react'
import type { SearchFilters } from '@/lib/actions/tasks'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams?.get('q') || ''

  const [filters, setFilters] = useState<SearchFilters>({
    query: initialQuery,
  })
  const [showFilters, setShowFilters] = useState(false)

  const { data: tasks, isLoading } = useSearchTasks(filters)
  const { data: projects } = useProjects()
  const { data: tags } = useTags()

  useEffect(() => {
    if (initialQuery) {
      setFilters(prev => ({ ...prev, query: initialQuery }))
    }
  }, [initialQuery])

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, query }))
  }

  const handleFilterChange = (key: keyof SearchFilters, value: string | string[] | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }))
  }

  const handleLoadSavedSearch = (savedFilters: SearchFilters) => {
    setFilters(savedFilters)
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({ query: filters.query })
  }

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'query' && value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)
  ).length

  const hasResults = tasks && tasks.length > 0
  const hasQuery = filters.query || activeFilterCount > 0

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search Tasks</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Search across all your tasks and filter by project, tags, priority, and more
            </p>
          </div>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ChevronLeft size={16} />
            Back to Inbox
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search in title and description..."
              autoFocus
              showShortcut={false}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <Filter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Advanced Filters</h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Sort By */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Sort By
                </label>
                <select
                  value={filters.sortBy || 'created_at'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="created_at">Created Date</option>
                  <option value="due_date">Due Date</option>
                  <option value="title">Title</option>
                  <option value="priority">Priority</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Order
                </label>
                <select
                  value={filters.sortOrder || 'desc'}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>

              {/* Project Filter */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Project
                </label>
                <select
                  value={filters.projectId || ''}
                  onChange={(e) => handleFilterChange('projectId', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Projects</option>
                  {projects?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.emoji} {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Priority
                </label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Tags Filter */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Tags
                </label>
                <select
                  multiple
                  value={filters.tagIds || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value)
                    handleFilterChange('tagIds', selected.length > 0 ? selected : undefined)
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  size={3}
                >
                  {tags?.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center gap-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Hold Cmd/Ctrl to select multiple
                  </p>
                  {filters.tagIds && filters.tagIds.length > 1 && (
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={filters.matchAllTags || false}
                        onChange={(e) => handleFilterChange('matchAllTags', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        Match ALL tags (AND logic)
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Date From */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Due Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Due Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Active filters:</span>
                {filters.projectId && projects && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    Project: {projects.find(p => p.id === filters.projectId)?.name}
                    <button onClick={() => handleFilterChange('projectId', '')}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.status && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    Status: {filters.status}
                    <button onClick={() => handleFilterChange('status', '')}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.priority && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    Priority: {filters.priority}
                    <button onClick={() => handleFilterChange('priority', '')}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.tagIds && filters.tagIds.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    Tags: {filters.tagIds.length} {filters.matchAllTags ? '(AND)' : '(OR)'}
                    <button onClick={() => handleFilterChange('tagIds', [])}>
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Saved Searches */}
        <div className="mb-6">
          <SavedSearches onLoad={handleLoadSavedSearch} currentFilters={filters} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Searching...</div>
          </div>
        ) : hasResults ? (
          <div>
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Found {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              {filters.query && (
                <span className="ml-1">
                  matching &ldquo;<strong>{filters.query}</strong>&rdquo;
                </span>
              )}
            </div>
            <TaskList tasks={tasks} searchQuery={filters.query} />
          </div>
        ) : hasQuery ? (
          <div className="flex flex-col items-center justify-center py-12">
            <SearchIcon size={48} className="mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No tasks found</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Try adjusting your search query or filters
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <SearchIcon size={48} className="mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Start searching</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter a search query or apply filters to find tasks
            </p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Press <kbd className="rounded bg-gray-100 px-2 py-1 font-mono dark:bg-gray-700">⌘K</kbd> from anywhere to search
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
