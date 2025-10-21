'use client'

import { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'

interface TaskNotesProps {
  value?: string | null
  onChange: (value: string) => void
  placeholder?: string
}

export function TaskNotes({ value, onChange, placeholder = 'Add notes...' }: TaskNotesProps) {
  const [notes, setNotes] = useState(value || '')

  useEffect(() => {
    setNotes(value || '')
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setNotes(newValue)
    onChange(newValue)
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <FileText size={16} />
        Notes
      </label>
      <textarea
        value={notes}
        onChange={handleChange}
        placeholder={placeholder}
        rows={6}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
      />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Add additional details, context, or information about this task
      </p>
    </div>
  )
}
