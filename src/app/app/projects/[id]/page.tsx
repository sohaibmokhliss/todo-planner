'use client'

import { useState } from 'react'
import { Plus, Edit2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useProject, useProjectTasks } from '@/hooks/useProjects'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm } from '@/components/tasks/TaskForm'
import { QuickAddTask } from '@/components/tasks/QuickAddTask'
import { Sidebar } from '@/components/navigation/Sidebar'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params?.id as string
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)

  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId)
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useProjectTasks(projectId)

  const incompleteTasks = tasks?.filter(task => task.status !== 'done') || []
  const completedTasks = tasks?.filter(task => task.status === 'done') || []
  const completionRate = tasks?.length
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0

  if (projectLoading) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-auto p-6">
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">Loading project...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (projectError || !project) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-auto p-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center dark:border-red-800 dark:bg-red-900/20">
              <p className="text-red-600 dark:text-red-400">Project not found.</p>
              <Link
                href="/app/projects"
                className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                <ArrowLeft size={16} />
                Back to Projects
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <main className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto p-6">
          {/* Project Header */}
          <div className="mb-6">
            <Link
              href="/app/projects"
              className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft size={16} />
              Back to Projects
            </Link>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-lg text-3xl"
                  style={{ backgroundColor: `${project.color}20` }}
                >
                  {project.emoji || '📁'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {project.name}
                  </h2>
                  {project.description && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {project.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{tasks?.length || 0} tasks</span>
                    <span>•</span>
                    <span>{completionRate}% complete</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  <Plus size={16} />
                  New Task
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${completionRate}%`,
                  backgroundColor: project.color,
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            {/* Quick add task */}
            <QuickAddTask projectId={projectId} />

            {tasksLoading ? (
              <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">Loading tasks...</p>
              </div>
            ) : tasksError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center dark:border-red-800 dark:bg-red-900/20">
                <p className="text-red-600 dark:text-red-400">Failed to load tasks. Please try again.</p>
              </div>
            ) : (
              <>
                {/* Incomplete tasks */}
                {incompleteTasks.length > 0 ? (
                  <div className="space-y-3">
                    <TaskList tasks={incompleteTasks} emptyMessage="" />
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-gray-500 dark:text-gray-400">
                      No active tasks in this project. Create one to get started!
                    </p>
                  </div>
                )}

                {/* Completed tasks */}
                {completedTasks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Completed ({completedTasks.length})
                    </h3>
                    <TaskList tasks={completedTasks} emptyMessage="" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showProjectForm && (
        <ProjectForm project={project} onClose={() => setShowProjectForm(false)} />
      )}
      {showTaskForm && <TaskForm onClose={() => setShowTaskForm(false)} />}
    </div>
  )
}
