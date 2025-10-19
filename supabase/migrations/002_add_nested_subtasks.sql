-- Add support for nested subtasks
-- This migration adds a parent_id column to allow subtasks to have child subtasks

-- Add parent_id column to subtasks table
ALTER TABLE subtasks
ADD COLUMN parent_id UUID REFERENCES subtasks(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_subtasks_parent_id ON subtasks(parent_id);

-- Update RLS policies to handle nested subtasks
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view subtasks of own tasks" ON subtasks;
DROP POLICY IF EXISTS "Users can create subtasks for own tasks" ON subtasks;
DROP POLICY IF EXISTS "Users can update subtasks of own tasks" ON subtasks;
DROP POLICY IF EXISTS "Users can delete subtasks of own tasks" ON subtasks;

-- Recreate policies with same logic (parent_id doesn't affect ownership)
CREATE POLICY "Users can view subtasks of own tasks" ON subtasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = current_user_id()
    )
  );

CREATE POLICY "Users can create subtasks for own tasks" ON subtasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = current_user_id()
    )
  );

CREATE POLICY "Users can update subtasks of own tasks" ON subtasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = current_user_id()
    )
  );

CREATE POLICY "Users can delete subtasks of own tasks" ON subtasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = current_user_id()
    )
  );
