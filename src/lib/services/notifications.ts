/**
 * Browser Push Notification Service
 *
 * This handles browser-based push notifications (not native mobile push).
 * For native mobile push, you would need to integrate with:
 * - Firebase Cloud Messaging (FCM)
 * - Apple Push Notification Service (APNS)
 * - OneSignal
 */

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
}

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied'
  }
  return Notification.permission
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported in this browser')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (error) {
    console.error('Failed to request notification permission:', error)
    return 'denied'
  }
}

/**
 * Show a browser notification
 */
export async function showNotification(payload: NotificationPayload): Promise<boolean> {
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported')
    return false
  }

  const permission = await requestNotificationPermission()

  if (permission !== 'granted') {
    console.warn('Notification permission not granted')
    return false
  }

  try {
    // If service worker is available, use it for better notification handling
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/icon-192x192.png',
        tag: payload.tag || 'task-reminder',
        data: payload.data,
        requireInteraction: false,
        vibrate: [200, 100, 200],
      })
    } else {
      // Fallback to basic notification
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        tag: payload.tag || 'task-reminder',
        data: payload.data,
      })
    }

    return true
  } catch (error) {
    console.error('Failed to show notification:', error)
    return false
  }
}

/**
 * Schedule a notification to be shown at a specific time
 * Note: This only works while the app is open. For true scheduled push,
 * you need a backend service with FCM/APNS
 */
export function scheduleNotification(payload: NotificationPayload, time: Date): NodeJS.Timeout | null {
  const now = new Date()
  const delay = time.getTime() - now.getTime()

  if (delay <= 0) {
    // Time has passed, show immediately
    showNotification(payload)
    return null
  }

  // Schedule the notification
  const timeoutId = setTimeout(() => {
    showNotification(payload)
  }, delay)

  return timeoutId
}

/**
 * Generate notification payload for a task reminder
 */
export function generateTaskReminderNotification(taskTitle: string, dueDate: string | null): NotificationPayload {
  return {
    title: 'Task Reminder',
    body: `Don't forget: ${taskTitle}${dueDate ? ` (Due: ${new Date(dueDate).toLocaleDateString()})` : ''}`,
    tag: `task-reminder-${Date.now()}`,
    data: {
      type: 'task-reminder',
      taskTitle,
      dueDate,
      url: '/app',
    },
  }
}
