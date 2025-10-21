-- Phase 5: Add task notes and dependencies support
-- This migration adds notes_html column to tasks and creates task_dependencies table

-- Add notes_html column to tasks table for rich text notes
ALTER TABLE tasks
ADD COLUMN notes_html TEXT DEFAULT NULL;

-- Create task_dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_dependency UNIQUE(task_id, depends_on_task_id),
  CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on_task_id ON task_dependencies(depends_on_task_id);

-- Enable RLS on task_dependencies
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_dependencies
CREATE POLICY "Users can view dependencies of own tasks" ON task_dependencies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_dependencies.task_id
      AND tasks.user_id = current_user_id()
    )
  );

CREATE POLICY "Users can create dependencies for own tasks" ON task_dependencies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_dependencies.task_id
      AND tasks.user_id = current_user_id()
    )
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_dependencies.depends_on_task_id
      AND tasks.user_id = current_user_id()
    )
  );

CREATE POLICY "Users can update dependencies of own tasks" ON task_dependencies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_dependencies.task_id
      AND tasks.user_id = current_user_id()
    )
  );

CREATE POLICY "Users can delete dependencies of own tasks" ON task_dependencies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_dependencies.task_id
      AND tasks.user_id = current_user_id()
    )
  );

-- Add trigger for updated_at on task_dependencies
CREATE TRIGGER update_task_dependencies_updated_at
  BEFORE UPDATE ON task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
