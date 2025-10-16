'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { useProjects, useDeleteProject } from '@/hooks/useProjects'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { Sidebar } from '@/components/navigation/Sidebar'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

export default function ProjectsPage() {
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const { data: projects, isLoading, error } = useProjects()
  const deleteProject = useDeleteProject()

  const handleDelete = async (project: Project) => {
    if (!confirm(`Delete "${project.name}"? All tasks will remain but won't be assigned to this project.`)) {
      return
    }

    try {
      await deleteProject.mutateAsync(project.id)
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <main className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Projects</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {projects?.length || 0} projects
              </p>
            </div>
            <button
              onClick={() => setShowProjectForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={16} />
              New Project
            </button>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">Loading projects...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center dark:border-red-800 dark:bg-red-900/20">
              <p className="text-red-600 dark:text-red-400">Failed to load projects. Please try again.</p>
            </div>
          ) : !projects || projects.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <FolderOpen size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                No projects yet. Create your first project to organize your tasks!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="group relative rounded-lg border border-gray-200 bg-white p-6 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  <Link href={`/app/projects/${project.id}`} className="block">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
                          style={{ backgroundColor: `${project.color}20` }}
                        >
                          {project.emoji || '📁'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {project.name}
                          </h3>
                          <div
                            className="mt-1 h-1 w-16 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                        </div>
                      </div>
                    </div>

                    {project.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </Link>

                  {/* Action buttons */}
                  <div className="absolute right-4 top-4 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setEditingProject(project)
                      }}
                      className="rounded p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                      title="Edit project"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleDelete(project)
                      }}
                      disabled={deleteProject.isPending}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title="Delete project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Project form modals */}
      {showProjectForm && (
        <ProjectForm onClose={() => setShowProjectForm(false)} />
      )}
      {editingProject && (
        <ProjectForm
          project={editingProject}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  )
}
