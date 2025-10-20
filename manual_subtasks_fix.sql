-- Manual fix for subtasks table with nested support
-- Run this in Supabase SQL Editor

-- First, drop existing subtasks table and recreate it
DROP TABLE IF EXISTS subtasks CASCADE;

-- Recreate subtasks table with parent_id support
CREATE TABLE subtasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES subtasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX idx_subtasks_parent_id ON subtasks(parent_id);

-- Enable RLS
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create updated_at trigger
CREATE TRIGGER update_subtasks_updated_at
  BEFORE UPDATE ON subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
