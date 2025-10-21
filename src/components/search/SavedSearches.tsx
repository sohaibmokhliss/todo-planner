'use client'

import { useState, useEffect } from 'react'
import { Search, Star, Trash2, X } from 'lucide-react'
import type { SearchFilters } from '@/lib/actions/tasks'

export interface SavedSearch {
  id: string
  name: string
  filters: SearchFilters
  createdAt: string
}

interface SavedSearchesProps {
  onLoad: (filters: SearchFilters) => void
  currentFilters?: SearchFilters
}

export function SavedSearches({ onLoad, currentFilters }: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [searchName, setSearchName] = useState('')

  useEffect(() => {
    loadSavedSearches()
  }, [])

  const loadSavedSearches = () => {
    const saved = localStorage.getItem('savedSearches')
    if (saved) {
      setSavedSearches(JSON.parse(saved))
    }
  }

  const saveSearch = () => {
    if (!searchName.trim() || !currentFilters) return

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName.trim(),
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    }

    const updated = [newSearch, ...savedSearches]
    localStorage.setItem('savedSearches', JSON.stringify(updated))
    setSavedSearches(updated)
    setSearchName('')
    setShowSaveDialog(false)
  }

  const deleteSearch = (id: string) => {
    const updated = savedSearches.filter(s => s.id !== id)
    localStorage.setItem('savedSearches', JSON.stringify(updated))
    setSavedSearches(updated)
  }

  const hasActiveFilters = currentFilters && (
    currentFilters.query ||
    currentFilters.projectId ||
    currentFilters.status ||
    currentFilters.priority ||
    (currentFilters.tagIds && currentFilters.tagIds.length > 0) ||
    currentFilters.dateFrom ||
    currentFilters.dateTo
  )

  if (savedSearches.length === 0 && !hasActiveFilters) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Save Current Search Button */}
      {hasActiveFilters && !showSaveDialog && (
        <button
          onClick={() => setShowSaveDialog(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
        >
          <Star size={14} />
          Save this search
        </button>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="rounded-lg border border-indigo-300 bg-indigo-50 p-4 dark:border-indigo-700 dark:bg-indigo-900/20">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">Save Search</h4>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveSearch()}
              placeholder="Enter a name for this search..."
              className="flex-1 rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-indigo-600 dark:bg-gray-800 dark:text-white"
              autoFocus
            />
            <button
              onClick={saveSearch}
              disabled={!searchName.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Saved Searches List */}
      {savedSearches.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Saved Searches</h4>
          <div className="space-y-2">
            {savedSearches.map((saved) => (
              <div
                key={saved.id}
                className="group flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20"
              >
                <button
                  onClick={() => onLoad(saved.filters)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <Star size={14} className="flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {saved.name}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                      {formatFiltersSummary(saved.filters)}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => deleteSearch(saved.id)}
                  className="ml-2 flex-shrink-0 rounded p-1 text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title="Delete saved search"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatFiltersSummary(filters: SearchFilters): string {
  const parts: string[] = []

  if (filters.query) parts.push(`"${filters.query}"`)
  if (filters.status) parts.push(filters.status)
  if (filters.priority) parts.push(filters.priority)
  if (filters.tagIds && filters.tagIds.length > 0) {
    parts.push(`${filters.tagIds.length} tag${filters.tagIds.length > 1 ? 's' : ''}`)
  }
  if (filters.dateFrom || filters.dateTo) parts.push('date range')

  return parts.length > 0 ? parts.join(', ') : 'All tasks'
}
