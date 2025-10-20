'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
  autoFocus?: boolean
  showShortcut?: boolean
}

export function SearchBar({
  onSearch,
  placeholder = 'Search tasks...',
  autoFocus = false,
  showShortcut = true,
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }

      // ESC to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setQuery('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()

    if (!query.trim()) return

    // Save to recent searches
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]')
    const updated = [query.trim(), ...recentSearches.filter((s: string) => s !== query.trim())].slice(0, 5)
    localStorage.setItem('recentSearches', JSON.stringify(updated))

    if (onSearch) {
      onSearch(query.trim())
    } else {
      router.push(`/app/search?q=${encodeURIComponent(query.trim())}`)
    }

    setIsOpen(false)
  }, [query, onSearch, router])

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  // Render modal version when triggered by keyboard shortcut
  if (isOpen && showShortcut) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-32">
        <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl dark:bg-gray-800">
          <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4">
            <Search className="text-gray-400" size={20} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-lg text-gray-900 placeholder-gray-500 focus:outline-none dark:text-white dark:placeholder-gray-400"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <X size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              ESC
            </button>
          </form>

          {/* Recent searches */}
          <RecentSearches onSelect={(search) => {
            setQuery(search)
            setTimeout(() => handleSubmit(), 100)
          }} />
        </div>
      </div>
    )
  }

  // Render inline version
  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-20 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          autoFocus={autoFocus}
        />
        {showShortcut && !query && (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden rounded border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 sm:inline-block">
            ⌘K
          </kbd>
        )}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </form>
  )
}

function RecentSearches({ onSelect }: { onSelect: (search: string) => void }) {
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    const searches = JSON.parse(localStorage.getItem('recentSearches') || '[]')
    setRecentSearches(searches)
  }, [])

  if (recentSearches.length === 0) return null

  return (
    <div className="border-t border-gray-200 p-4 dark:border-gray-700">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Recent Searches
      </div>
      <div className="space-y-1">
        {recentSearches.map((search, index) => (
          <button
            key={index}
            onClick={() => onSelect(search)}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Search size={14} className="mr-2 inline text-gray-400" />
            {search}
          </button>
        ))}
      </div>
    </div>
  )
}
