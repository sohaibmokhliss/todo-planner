'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useCreateProject, useUpdateProject } from '@/hooks/useProjects'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

interface ProjectFormProps {
  project?: Project
  onClose: () => void
  onSuccess?: () => void
}

const projectColors = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Cyan', value: '#06b6d4' },
]

export function ProjectForm({ project, onClose, onSuccess }: ProjectFormProps) {
  const [name, setName] = useState(project?.name || '')
  const [description, setDescription] = useState(project?.description || '')
  const [color, setColor] = useState(project?.color || '#6366f1')
  const [emoji, setEmoji] = useState(project?.emoji || '📁')

  const createProject = useCreateProject()
  const updateProject = useUpdateProject()

  const isEdit = !!project

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    try {
      if (isEdit) {
        await updateProject.mutateAsync({
          id: project.id,
          data: {
            name: name.trim(),
            description: description.trim() || null,
            color,
            emoji,
          },
        })
      } else {
        await createProject.mutateAsync({
          name: name.trim(),
          description: description.trim() || null,
          color,
          emoji,
        })
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to save project:', error)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-in zoom-in-95 rounded-2xl border-2 border-indigo-300 bg-white p-6 shadow-2xl dark:border-indigo-700 dark:bg-gray-800">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent dark:from-indigo-400 dark:to-purple-400">
            {isEdit ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-all hover:scale-110 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name and Emoji */}
          <div className="flex gap-3">
            {/* Emoji Picker */}
            <div>
              <label htmlFor="emoji" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Icon
              </label>
              <input
                type="text"
                id="emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
                className="w-16 rounded-lg border-2 border-indigo-200 bg-white px-3 py-2 text-center text-2xl shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/30"
                maxLength={2}
              />
            </div>

            {/* Name */}
            <div className="flex-1">
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Work, Personal, Fitness"
                className="w-full rounded-lg border-2 border-indigo-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/30"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={2}
              className="w-full rounded-lg border-2 border-indigo-200 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/30"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {projectColors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-10 rounded-lg border-2 shadow-sm transition-all hover:scale-110 hover:shadow-md ${
                    color === c.value
                      ? 'scale-110 border-gray-900 ring-2 ring-gray-300 dark:border-white dark:ring-gray-600'
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Error message */}
          {(createProject.isError || updateProject.isError) && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              Failed to {isEdit ? 'update' : 'create'} project. Please try again.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createProject.isPending || updateProject.isPending}
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {createProject.isPending || updateProject.isPending
                ? isEdit
                  ? 'Saving...'
                  : 'Creating...'
                : isEdit
                  ? 'Save Changes'
                  : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}
