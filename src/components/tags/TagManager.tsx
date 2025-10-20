'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Tag as TagIcon, X } from 'lucide-react'
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/useTags'

interface TagFormData {
  name: string
  color: string
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#6b7280', // gray
]

export function TagManager() {
  const { data: tags, isLoading } = useTags()
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const deleteTag = useDeleteTag()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    color: PRESET_COLORS[0],
  })

  const handleCreate = async () => {
    if (!formData.name.trim()) return

    try {
      await createTag.mutateAsync(formData)
      setFormData({ name: '', color: PRESET_COLORS[0] })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!formData.name.trim()) return

    try {
      await updateTag.mutateAsync({ id, data: formData })
      setEditingTagId(null)
      setFormData({ name: '', color: PRESET_COLORS[0] })
    } catch (error) {
      console.error('Failed to update tag:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tag? It will be removed from all tasks.')) return

    try {
      await deleteTag.mutateAsync(id)
    } catch (error) {
      console.error('Failed to delete tag:', error)
    }
  }

  const startEdit = (tag: { id: string; name: string; color: string }) => {
    setEditingTagId(tag.id)
    setFormData({ name: tag.name, color: tag.color })
    setShowCreateForm(false)
  }

  const cancelEdit = () => {
    setEditingTagId(null)
    setFormData({ name: '', color: PRESET_COLORS[0] })
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Loading tags...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Manage Tags
        </h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <Plus size={16} />
          New Tag
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Create New Tag
          </h4>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., @john, urgent, bug"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      formData.color === color
                        ? 'scale-110 border-gray-900 dark:border-white'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={createTag.isPending || !formData.name.trim()}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setFormData({ name: '', color: PRESET_COLORS[0] })
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags list */}
      <div className="space-y-2">
        {tags && tags.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No tags yet. Create your first tag!
          </p>
        ) : (
          tags?.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              {editingTagId === tag.id ? (
                // Edit mode
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                  />
                  <div className="flex flex-wrap gap-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`h-6 w-6 rounded-full border ${
                          formData.color === color ? 'ring-2 ring-gray-900 dark:ring-white' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(tag.id)}
                      className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <TagIcon size={16} style={{ color: tag.color }} />
                  <span
                    className="flex-1 rounded-full px-3 py-1 text-sm font-medium"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </span>
                  <button
                    onClick={() => startEdit(tag)}
                    className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Edit tag"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Delete tag"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
