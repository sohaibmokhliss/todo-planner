'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Inbox, Calendar, CalendarDays, CheckCircle2, FolderOpen, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { isToday, isFuture, startOfDay } from 'date-fns'

export function Sidebar() {
  const pathname = usePathname()
  const [showProjectForm, setShowProjectForm] = useState(false)
  const { data: allTasks } = useTasks()
  const { data: projects } = useProjects()

  // Calculate task counts
  const inboxCount = allTasks?.filter(task => task.status !== 'done').length || 0

  const todayCount = allTasks?.filter(task => {
    if (task.status === 'done' || !task.due_date) return false
    return isToday(new Date(task.due_date))
  }).length || 0

  const upcomingCount = allTasks?.filter(task => {
    if (task.status === 'done' || !task.due_date) return false
    const dueDate = new Date(task.due_date)
    return isFuture(startOfDay(dueDate)) && !isToday(dueDate)
  }).length || 0

  const completedCount = allTasks?.filter(task => task.status === 'done').length || 0

  const navItems = [
    {
      href: '/app',
      label: 'Inbox',
      icon: Inbox,
      count: inboxCount,
      exact: true,
    },
    {
      href: '/app/today',
      label: 'Today',
      icon: Calendar,
      count: todayCount,
    },
    {
      href: '/app/upcoming',
      label: 'Upcoming',
      icon: CalendarDays,
      count: upcomingCount,
    },
    {
      href: '/app/completed',
      label: 'Completed',
      icon: CheckCircle2,
      count: completedCount,
    },
  ]

  return (
    <aside className="w-64 border-r border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.exact
            ? pathname === item.href
            : pathname?.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.count > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between px-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Projects
          </h3>
          <button
            onClick={() => setShowProjectForm(true)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            title="New project"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="space-y-1">
          {projects && projects.length > 0 ? (
            <>
              {projects.map((project) => {
                const isActive = pathname?.startsWith(`/app/projects/${project.id}`)
                const projectTaskCount = allTasks?.filter(
                  task => task.project_id === project.id && task.status !== 'done'
                ).length || 0

                return (
                  <Link
                    key={project.id}
                    href={`/app/projects/${project.id}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{project.emoji || '📁'}</span>
                      <span className="truncate">{project.name}</span>
                    </div>
                    {projectTaskCount > 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          isActive
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {projectTaskCount}
                      </span>
                    )}
                  </Link>
                )
              })}
              <Link
                href="/app/projects"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <FolderOpen size={16} />
                <span>All Projects</span>
              </Link>
            </>
          ) : (
            <button
              onClick={() => setShowProjectForm(true)}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Create your first project
            </button>
          )}
        </div>
      </div>

      {/* Project form modal */}
      {showProjectForm && <ProjectForm onClose={() => setShowProjectForm(false)} />}
    </aside>
  )
}
