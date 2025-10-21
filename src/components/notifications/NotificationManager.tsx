'use client'

import { useEffect, useState, useRef } from 'react'
import { showNotification, requestNotificationPermission, isNotificationSupported, generateTaskReminderNotification } from '@/lib/services/notifications'
import { createClient } from '@/lib/supabase/client'
import { Bell, BellOff } from 'lucide-react'

/**
 * NotificationManager Component
 *
 * This component:
 * 1. Requests notification permissions from the user
 * 2. Polls for pending push reminders from the database
 * 3. Shows browser notifications when reminders are due
 * 4. Marks reminders as sent after showing them
 */

export function NotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isPolling, setIsPolling] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()
  const processedReminders = useRef<Set<string>>(new Set())

  // Check notification support and permission on mount
  useEffect(() => {
    setIsMounted(true)
    if (isNotificationSupported()) {
      setPermission(Notification.permission)
    }
  }, [])

  // Request permission when user clicks the button
  const handleRequestPermission = async () => {
    const newPermission = await requestNotificationPermission()
    setPermission(newPermission)

    if (newPermission === 'granted') {
      startPolling()
    }
  }

  // Poll for pending push notifications
  const checkForPendingNotifications = async () => {
    try {
      const supabase = createClient()

      // Get pending push reminders that are due now
      const { data: reminders, error } = await supabase
        .from('reminders')
        .select(`
          id,
          time,
          sent,
          tasks (
            id,
            title,
            due_date
          )
        `)
        .eq('type', 'push')
        .eq('sent', false)
        .lte('time', new Date().toISOString())

      if (error) {
        console.error('Error fetching pending notifications:', error)
        return
      }

      if (!reminders || reminders.length === 0) {
        return
      }

      // Show notifications for each pending reminder
      for (const reminder of reminders) {
        // Skip if already processed in this session
        if (processedReminders.current.has(reminder.id)) {
          continue
        }

        const task = Array.isArray(reminder.tasks) ? reminder.tasks[0] : reminder.tasks

        if (!task) {
          continue
        }

        // Show the notification
        const notificationPayload = generateTaskReminderNotification(task.title, task.due_date)
        const shown = await showNotification(notificationPayload)

        if (shown) {
          // Mark as processed
          processedReminders.current.add(reminder.id)

          // Mark as sent in the database
          await supabase
            .from('reminders')
            .update({ sent: true })
            .eq('id', reminder.id)
        }
      }
    } catch (error) {
      console.error('Error checking for notifications:', error)
    }
  }

  // Start polling for notifications
  const startPolling = () => {
    if (isPolling) return

    setIsPolling(true)

    // Check immediately
    checkForPendingNotifications()

    // Then check every minute
    intervalRef.current = setInterval(() => {
      checkForPendingNotifications()
    }, 60 * 1000) // Every 60 seconds
  }

  // Stop polling
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsPolling(false)
  }

  // Start/stop polling based on permission
  useEffect(() => {
    if (permission === 'granted') {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [permission])

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return null
  }

  // Don't show anything if notifications are not supported
  if (!isNotificationSupported()) {
    return null
  }

  // Don't show if permission is already granted (it's working in background)
  if (permission === 'granted') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 shadow-lg dark:bg-green-900/20 dark:text-green-400">
          <Bell size={16} className="text-green-600 dark:text-green-400" />
          <span>Notifications enabled</span>
        </div>
      </div>
    )
  }

  // Show prompt to enable notifications
  if (permission === 'default') {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <div className="rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800">
          <div className="flex items-start gap-3">
            <Bell size={24} className="mt-1 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Enable Notifications</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Get notified when your task reminders are due
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleRequestPermission}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  Enable
                </button>
                <button
                  onClick={() => setPermission('denied')}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Permission denied - show subtle indicator
  if (permission === 'denied') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 shadow-lg dark:bg-gray-800 dark:text-gray-400">
          <BellOff size={16} />
          <span>Notifications blocked</span>
        </div>
      </div>
    )
  }

  return null
}
