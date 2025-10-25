import { getCurrentUser } from '@/lib/actions/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, Calendar, Tag, Repeat, Bell, LayoutList } from 'lucide-react'

export default async function Home() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/app')
  }

  const features = [
    {
      icon: CheckCircle2,
      title: 'Task Management',
      description: 'Create, organize, and complete tasks with ease',
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Due dates, reminders, and calendar integration',
    },
    {
      icon: LayoutList,
      title: 'Projects',
      description: 'Organize tasks into projects for better workflow',
    },
    {
      icon: Tag,
      title: 'Tags & Labels',
      description: 'Categorize and filter tasks efficiently',
    },
    {
      icon: Repeat,
      title: 'Recurring Tasks',
      description: 'Set up tasks that repeat automatically',
    },
    {
      icon: Bell,
      title: 'Reminders',
      description: 'Never miss a deadline with smart notifications',
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-100 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      {/* Hero Section */}
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl text-center">
          {/* Logo/Icon */}
          <div className="mb-8 flex justify-center">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-4 shadow-lg">
              <CheckCircle2 className="h-16 w-16 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Heading */}
          <h1 className="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-6xl font-bold text-transparent dark:from-indigo-400 dark:to-purple-400 sm:text-7xl">
            Todo Planner
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-xl text-gray-600 dark:text-gray-300 sm:text-2xl">
            A modern to-do & personal planning web app designed to help you stay organized and
            productive
          </p>

          {/* CTA Buttons */}
          <div className="mb-16 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="group rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="rounded-lg border-2 border-indigo-600 bg-white px-8 py-4 text-lg font-semibold text-indigo-600 transition-all hover:bg-indigo-50 dark:border-indigo-400 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-700"
            >
              Sign In
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group rounded-xl border-2 border-indigo-200 bg-white p-6 shadow-lg transition-all hover:scale-105 hover:border-indigo-400 hover:shadow-xl dark:border-indigo-800 dark:bg-gray-800 dark:hover:border-indigo-600"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 p-3 text-indigo-700 shadow-sm dark:from-indigo-900 dark:to-purple-900 dark:text-indigo-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
