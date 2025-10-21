'use client'

import { useState } from 'react'
import { useTaskReminders, useCreateReminder, useDeleteReminder } from '@/hooks/useReminders'
import { Bell, Plus, Trash2, Clock } from 'lucide-react'
import type { Database } from '@/types/database'

type Reminder = Database['public']['Tables']['reminders']['Row']

interface ReminderManagerProps {
  taskId: string
  taskDueDate?: string | null
}

export function ReminderManager({ taskId, taskDueDate }: ReminderManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [reminderType, setReminderType] = useState<'email' | 'push'>('push')
  const [reminderTime, setReminderTime] = useState('')

  const { data: reminders, isLoading } = useTaskReminders(taskId)
  const createReminder = useCreateReminder()
  const deleteReminder = useDeleteReminder()

  const handleSubmit = async () => {
    if (!reminderTime) return

    try {
      await createReminder.mutateAsync({
        task_id: taskId,
        type: reminderType,
        time: new Date(reminderTime).toISOString(),
      })

      // Reset form
      setReminderTime('')
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create reminder:', error)
    }
  }

  const handleDelete = async (reminderId: string) => {
    try {
      await deleteReminder.mutateAsync(reminderId)
    } catch (error) {
      console.error('Failed to delete reminder:', error)
    }
  }

  const formatReminderTime = (time: string) => {
    const date = new Date(time)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    let relativeTime = ''
    if (diffDays > 0) {
      relativeTime = `in ${diffDays} day${diffDays > 1 ? 's' : ''}`
    } else if (diffHours > 0) {
      relativeTime = `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`
    } else if (diffMins > 0) {
      relativeTime = `in ${diffMins} minute${diffMins > 1 ? 's' : ''}`
    } else if (diffMins === 0) {
      relativeTime = 'now'
    } else {
      relativeTime = 'overdue'
    }

    return {
      absolute: date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      relative: relativeTime,
    }
  }

  // Calculate min datetime for reminder (now)
  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }

  // Calculate max datetime for reminder (due date if exists)
  const getMaxDateTime = () => {
    if (!taskDueDate) return undefined
    const dueDate = new Date(taskDueDate)
    dueDate.setMinutes(dueDate.getMinutes() - dueDate.getTimezoneOffset())
    return dueDate.toISOString().slice(0, 16)
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Bell size={16} />
          Reminders
        </label>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Bell size={16} />
          Reminders
        </label>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
          >
            <Plus size={14} />
            Add
          </button>
        )}
      </div>

      <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
        {/* Existing reminders */}
        {reminders && reminders.length > 0 ? (
          <div className="space-y-2">
            {reminders.map((reminder: Reminder) => {
              const { absolute, relative } = formatReminderTime(reminder.time)
              const isPast = new Date(reminder.time) < new Date()

              return (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between rounded-md bg-white p-2 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <Clock size={14} className={isPast ? 'text-red-500' : 'text-gray-400'} />
                    <div>
                      <p className={`text-sm ${isPast ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {absolute}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {relative} · {reminder.type}
                        {reminder.sent && ' · sent'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(reminder.id)}
                    disabled={deleteReminder.isPending}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          !showForm && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No reminders set</p>
          )
        )}

        {/* Add reminder form */}
        {showForm && (
          <div className="space-y-2 rounded-md bg-white p-2 dark:bg-gray-800">
            <div>
              <label htmlFor="reminderTime" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                When
              </label>
              <input
                type="datetime-local"
                id="reminderTime"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                min={getMinDateTime()}
                max={getMaxDateTime()}
                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="reminderType" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Type
              </label>
              <select
                id="reminderType"
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value as 'email' | 'push')}
                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="push">Push Notification</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setReminderTime('')
                }}
                className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={createReminder.isPending || !reminderTime}
                className="flex-1 rounded-md bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {createReminder.isPending ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {(createReminder.isError || deleteReminder.isError) && (
          <div className="rounded-md bg-red-50 p-2 text-xs text-red-800 dark:bg-red-900/20 dark:text-red-400">
            Failed to {createReminder.isError ? 'create' : 'delete'} reminder. Please try again.
          </div>
        )}
      </div>
    </div>
  )
}
