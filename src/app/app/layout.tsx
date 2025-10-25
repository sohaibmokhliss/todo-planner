import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { NotificationManager } from '@/components/notifications/NotificationManager'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      <AppHeader user={user} />
      {children}
      <NotificationManager />
    </div>
  )
}
