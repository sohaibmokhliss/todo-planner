'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Plus, Tag as TagIcon } from 'lucide-react'
import { useTags, useCreateTag } from '@/hooks/useTags'
import type { Database } from '@/types/database'

type Tag = Database['public']['Tables']['tags']['Row']

interface TagSelectorProps {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#6b7280',
]

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const { data: allTags } = useTags()
  const createTag = useCreateTag()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowCreateForm(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredTags = allTags?.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedTags.some((selected) => selected.id === tag.id)
  )

  const handleToggleTag = (tag: Tag) => {
    if (selectedTags.some((t) => t.id === tag.id)) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      const result = await createTag.mutateAsync({
        name: newTagName.trim(),
        color: newTagColor,
      })
      if (result) {
        onTagsChange([...selectedTags, result])
      }
      setNewTagName('')
      setNewTagColor(PRESET_COLORS[0])
      setShowCreateForm(false)
      setSearchQuery('')
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tags
        </label>

        {/* Selected tags */}
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium"
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
              }}
            >
              {tag.name}
              <button
                onClick={() => handleToggleTag(tag)}
                className="hover:opacity-70"
                type="button"
              >
                <X size={14} />
              </button>
            </span>
          ))}
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="inline-flex items-center gap-1 rounded-full border-2 border-dashed border-gray-300 px-3 py-1 text-sm font-medium text-gray-600 transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
          >
            <Plus size={14} />
            Add tag
          </button>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-2 w-full max-w-sm rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="p-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tags or create new..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto">
              {filteredTags && filteredTags.length > 0 ? (
                <div className="space-y-1 px-2 pb-2">
                  {filteredTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        handleToggleTag(tag)
                        setSearchQuery('')
                      }}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <TagIcon size={14} style={{ color: tag.color }} />
                      <span
                        className="flex-1 rounded-full px-2 py-0.5 font-medium"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-center text-sm text-gray-500">
                  No tags found
                </div>
              )}
            </div>

            {/* Create new tag */}
            {!showCreateForm && searchQuery && (
              <div className="border-t border-gray-200 p-2 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowCreateForm(true)
                    setNewTagName(searchQuery)
                  }}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                >
                  <Plus size={16} />
                  Create &quot;{searchQuery}&quot;
                </button>
              </div>
            )}

            {showCreateForm && (
              <div className="border-t border-gray-200 p-3 dark:border-gray-700">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Tag name (e.g., @john, urgent)"
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                  <div className="flex flex-wrap gap-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        type="button"
                        className={`h-6 w-6 rounded-full border-2 ${
                          newTagColor === color
                            ? 'scale-110 border-gray-900 dark:border-white'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateTag}
                      type="button"
                      disabled={createTag.isPending || !newTagName.trim()}
                      className="flex-1 rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateForm(false)
                        setNewTagName('')
                      }}
                      type="button"
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium dark:border-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
