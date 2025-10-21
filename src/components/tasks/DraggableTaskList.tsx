'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableTaskItem } from './SortableTaskItem'
import type { TaskWithRelations } from '@/types/tasks'

interface DraggableTaskListProps {
  tasks: TaskWithRelations[]
  onReorder?: (tasks: TaskWithRelations[]) => void
  searchQuery?: string
}

export function DraggableTaskList({ tasks: initialTasks, onReorder, searchQuery }: DraggableTaskListProps) {
  const [tasks, setTasks] = useState(initialTasks)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    setTasks((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      const reordered = arrayMove(items, oldIndex, newIndex)

      // Call onReorder callback if provided
      if (onReorder) {
        onReorder(reordered)
      }

      return reordered
    })
  }

  // Update tasks when initialTasks changes
  if (initialTasks.length !== tasks.length || initialTasks[0]?.id !== tasks[0]?.id) {
    setTasks(initialTasks)
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">No tasks yet. Create your first task to get started!</p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tasks.map((task) => (
            <SortableTaskItem key={task.id} task={task} searchQuery={searchQuery} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
