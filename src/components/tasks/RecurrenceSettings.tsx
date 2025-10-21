'use client'

import { useState, useEffect } from 'react'
import { Repeat, X, Calendar, Trash2 } from 'lucide-react'
import { useRecurrence, useCreateRecurrence, useUpdateRecurrence, useDeleteRecurrence } from '@/hooks/useRecurrence'
import { formatRecurrenceDescription } from '@/lib/utils/recurrence'

interface RecurrenceSettingsProps {
  taskId: string
}

const DAYS_OF_WEEK = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
]

export function RecurrenceSettings({ taskId }: RecurrenceSettingsProps) {
  const { data: existingRecurrence, isLoading } = useRecurrence(taskId)
  const createRecurrence = useCreateRecurrence()
  const updateRecurrence = useUpdateRecurrence()
  const deleteRecurrence = useDeleteRecurrence()

  const [isExpanded, setIsExpanded] = useState(false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily')
  const [interval, setInterval] = useState(1)
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recurrenceSummary = formatRecurrenceDescription(existingRecurrence)

  // Load existing recurrence settings
  useEffect(() => {
    if (existingRecurrence) {
      setFrequency(existingRecurrence.frequency as any)
      setInterval(existingRecurrence.interval)
      setDaysOfWeek(existingRecurrence.days_of_week || [])
      setEndDate(
        existingRecurrence.end_date
          ? new Date(existingRecurrence.end_date).toISOString().split('T')[0]
          : ''
      )
      setIsExpanded(true)
    }
  }, [existingRecurrence])

  const handleSave = async () => {
    // Validate weekly recurrence has days selected
    if (frequency === 'weekly' && daysOfWeek.length === 0) {
      setError('Please select at least one day of the week')
      return
    }

    setError(null)

    const recurrenceData = {
      frequency,
      interval,
      days_of_week: frequency === 'weekly' ? daysOfWeek : null,
      end_date: endDate || null,
    }

    try {
      if (existingRecurrence) {
        await updateRecurrence.mutateAsync({
          taskId,
          data: recurrenceData,
        })
      } else {
        await createRecurrence.mutateAsync({
          task_id: taskId,
          ...recurrenceData,
        })
      }
      setIsExpanded(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save recurrence'
      setError(errorMessage)
      console.error('Failed to save recurrence:', err)
    }
  }

  const handleDelete = async () => {
    if (!existingRecurrence) return
    if (!confirm('Remove recurrence from this task?')) return

    try {
      await deleteRecurrence.mutateAsync(taskId)
      setIsExpanded(false)
      // Reset to defaults
      setFrequency('daily')
      setInterval(1)
      setDaysOfWeek([])
      setEndDate('')
    } catch (error) {
      console.error('Failed to delete recurrence:', error)
    }
  }

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    )
  }

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">Loading recurrence...</div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Repeat size={16} />
          Recurring Task
        </label>
        {existingRecurrence && (
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            title="Remove recurrence"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {!isExpanded && existingRecurrence && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <Repeat size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span>{recurrenceSummary}</span>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Edit
          </button>
        </div>
      )}

      {!isExpanded && !existingRecurrence && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full rounded-lg border-2 border-dashed border-gray-300 p-3 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
        >
          <Repeat size={16} className="inline mr-2" />
          Make this task recurring
        </button>
      )}

      {isExpanded && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4 dark:border-gray-700 dark:bg-gray-900">
          {/* Frequency */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Repeat
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Interval */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Every
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="365"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {frequency === 'daily' && (interval === 1 ? 'day' : 'days')}
                {frequency === 'weekly' && (interval === 1 ? 'week' : 'weeks')}
                {frequency === 'monthly' && (interval === 1 ? 'month' : 'months')}
                {frequency === 'custom' && 'intervals'}
              </span>
            </div>
          </div>

          {/* Days of Week (only for weekly) */}
          {frequency === 'weekly' && (
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                On these days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDayOfWeek(day.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      daysOfWeek.includes(day.value)
                        ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* End Date */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              End Date (optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={createRecurrence.isPending || updateRecurrence.isPending}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {createRecurrence.isPending || updateRecurrence.isPending ? 'Saving...' : 'Save Recurrence'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false)
                setError(null)
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
