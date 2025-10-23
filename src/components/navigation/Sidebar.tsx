'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Inbox,
  Calendar,
  CalendarDays,
  CheckCircle2,
  FolderOpen,
  Plus,
  Tag,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { useTags } from '@/hooks/useTags'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { isToday, isFuture, startOfDay } from 'date-fns'
import { useSidebar } from '@/hooks/useSidebar'

export function Sidebar() {
  const pathname = usePathname()
  const [showProjectForm, setShowProjectForm] = useState(false)
  const { data: allTasks } = useTasks()
  const { data: projects } = useProjects()
  const { data: tags } = useTags()
  const isOpen = useSidebar((state) => state.isOpen)
  const closeSidebar = useSidebar((state) => state.close)

  // Keep the sidebar closed after navigation on small screens
  useEffect(() => {
    closeSidebar()
  }, [pathname, closeSidebar])

  // Calculate task counts
  const inboxCount = allTasks?.filter((task) => task.status !== 'done').length || 0

  const todayCount =
    allTasks?.filter((task) => {
      if (task.status === 'done' || !task.due_date) return false
      return isToday(new Date(task.due_date))
    }).length || 0

  const upcomingCount =
    allTasks?.filter((task) => {
      if (task.status === 'done' || !task.due_date) return false
      const dueDate = new Date(task.due_date)
      return isFuture(startOfDay(dueDate)) && !isToday(dueDate)
    }).length || 0

  const completedCount = allTasks?.filter((task) => task.status === 'done').length || 0

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
    <>
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col border-r border-gray-200 bg-white p-4 transition-transform duration-200 ease-out dark:border-gray-700 dark:bg-gray-800 md:static md:z-auto md:translate-x-0 md:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="mb-4 flex items-center justify-between md:hidden">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Navigation
          </span>
          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
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
              Tags
            </h3>
          </div>
          <div className="space-y-1">
            <Link
              href="/app/tags"
              onClick={closeSidebar}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === '/app/tags'
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag size={16} />
                <span>Manage Tags</span>
              </div>
              {tags && tags.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{tags.length}</span>
              )}
            </Link>
            {tags && tags.length > 0 && (
              <div className="ml-2 space-y-0.5">
                {tags.slice(0, 5).map((tag) => {
                  const tagSlug = tag.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                  return (
                    <Link
                      key={tag.id}
                      href={`/app/tags/${tagSlug}`}
                      onClick={closeSidebar}
                      className="flex items-center gap-2 rounded px-3 py-1 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="truncate text-gray-600 dark:text-gray-400">{tag.name}</span>
                    </Link>
                  )
                })}
                {tags.length > 5 && (
                  <Link
                    href="/app/tags"
                    onClick={closeSidebar}
                    className="block px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    +{tags.length - 5} more
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between px-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Projects
            </h3>
            <button
              onClick={() => setShowProjectForm(true)}
              className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="New project"
              type="button"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1">
            {projects && projects.length > 0 ? (
              <>
                {projects.map((project) => {
                  const isActive = pathname?.startsWith(`/app/projects/${project.id}`)
                  const projectTaskCount =
                    allTasks?.filter(
                      (task) => task.project_id === project.id && task.status !== 'done',
                    ).length || 0

                  return (
                    <Link
                      key={project.id}
                      href={`/app/projects/${project.id}`}
                      onClick={closeSidebar}
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
                  onClick={closeSidebar}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                >
                  <FolderOpen size={16} />
                  <span>All Projects</span>
                </Link>
              </>
            ) : (
              <button
                onClick={() => setShowProjectForm(true)}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                type="button"
              >
                Create your first project
              </button>
            )}
          </div>
        </div>

        {showProjectForm && <ProjectForm onClose={() => setShowProjectForm(false)} />}
      </aside>
    </>
  )
}
