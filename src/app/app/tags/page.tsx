'use client'

import Link from 'next/link'
import { TagManager } from '@/components/tags/TagManager'
import { TagCloud } from '@/components/tags/TagCloud'
import { useState } from 'react'
import { Tag, Cloud, ChevronLeft } from 'lucide-react'

export default function TagsPage() {
  const [activeView, setActiveView] = useState<'cloud' | 'manage'>('cloud')

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tags</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Create and manage tags to organize your tasks. Use @ for people (e.g., @john) or any custom labels.
              </p>
            </div>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={16} />
              Back to Inbox
            </Link>
          </div>
          {/* View Tabs */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setActiveView('cloud')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeView === 'cloud'
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <Cloud size={16} />
              Tag Cloud
            </button>
            <button
              onClick={() => setActiveView('manage')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeView === 'manage'
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <Tag size={16} />
              Manage Tags
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-6xl">
          {activeView === 'cloud' ? <TagCloud /> : <TagManager />}
        </div>
      </div>
    </div>
  )
}
