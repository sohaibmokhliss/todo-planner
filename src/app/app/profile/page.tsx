import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm'
import { User } from 'lucide-react'

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-indigo-100 p-3 dark:bg-indigo-900/30">
              <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Manage your account information and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Information Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Profile Information</h2>
            <ProfileForm user={user} />
          </div>

          {/* Account Details Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Account Details</h2>
            <dl className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</dt>
                <dd className="text-sm text-gray-900 dark:text-white">@{user.username}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account created</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</dt>
                <dd className="text-xs font-mono text-gray-600 dark:text-gray-400">{user.id}</dd>
              </div>
            </dl>
          </div>

          {/* Change Password Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Change Password</h2>
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  )
}
