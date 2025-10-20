import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      <AppHeader user={user} />
      {children}
    </div>
  )
}
