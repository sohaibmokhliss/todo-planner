import type { Database } from './database'

type TaskRow = Database['public']['Tables']['tasks']['Row']
type RecurrenceRow = Database['public']['Tables']['recurrence']['Row']
type TaskDependencyRow = Database['public']['Tables']['task_dependencies']['Row']
type SubtaskRow = Database['public']['Tables']['subtasks']['Row']

export type TaskSummary = Pick<TaskRow, 'id' | 'title' | 'status' | 'priority' | 'due_date'>

export interface TaskDependencyWithDetails extends TaskDependencyRow {
  depends_on: TaskSummary | null
}

export interface TaskWithRelations extends TaskRow {
  recurrence: RecurrenceRow | null
  dependencies: TaskDependencyWithDetails[]
  subtasks: SubtaskRow[]
}
