-- ============================================================
-- PERFORMANCE OPTIMIZATION MIGRATION
-- Adds composite indexes and optimizations for better query performance
-- ============================================================

-- ============================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================

-- Projects: frequently filtered by user_id and sorted by position
CREATE INDEX IF NOT EXISTS idx_projects_user_position ON projects(user_id, position);
CREATE INDEX IF NOT EXISTS idx_projects_user_created ON projects(user_id, created_at DESC);

-- Tasks: frequently filtered by user_id with various combinations
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_project ON tasks(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_position ON tasks(user_id, position);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(user_id, completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_user_incomplete ON tasks(user_id, created_at DESC) WHERE status != 'done';

-- Tasks: optimize text search queries
CREATE INDEX IF NOT EXISTS idx_tasks_title_search ON tasks USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_tasks_description_search ON tasks USING gin(to_tsvector('english', description)) WHERE description IS NOT NULL;

-- Subtasks: frequently queried with task_id and position
CREATE INDEX IF NOT EXISTS idx_subtasks_task_position ON subtasks(task_id, position);

-- Task tags: optimize junction table queries
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_task ON task_tags(tag_id, task_id);

-- Task dependencies: bidirectional lookup optimization
CREATE INDEX IF NOT EXISTS idx_task_dependencies_composite ON task_dependencies(task_id, depends_on_task_id);

-- Reminders: optimize unsent reminder queries
CREATE INDEX IF NOT EXISTS idx_reminders_unsent_time ON reminders(time) WHERE NOT sent;
CREATE INDEX IF NOT EXISTS idx_reminders_task_unsent ON reminders(task_id, time) WHERE NOT sent;

-- Sessions: optimize session cleanup and lookup
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at_user ON sessions(expires_at, user_id);

-- ============================================================
-- OPTIMIZE EXISTING FUNCTIONS
-- ============================================================

-- Optimized version of set_user_context that checks if value is already set
CREATE OR REPLACE FUNCTION set_user_context(user_id UUID)
RETURNS void AS $$
DECLARE
  current_value TEXT;
BEGIN
  -- Check if the value is already set to avoid unnecessary operations
  BEGIN
    current_value := current_setting('request.jwt.claims.user_id', true);
    IF current_value = user_id::text THEN
      RETURN; -- Already set, no need to set again
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL; -- Setting doesn't exist, continue to set it
  END;

  -- Set the configuration
  PERFORM set_config('request.jwt.claims.user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ADD STATISTICS FOR QUERY PLANNER
-- ============================================================

-- Increase statistics target for frequently queried columns
ALTER TABLE tasks ALTER COLUMN user_id SET STATISTICS 1000;
ALTER TABLE tasks ALTER COLUMN status SET STATISTICS 500;
ALTER TABLE tasks ALTER COLUMN project_id SET STATISTICS 500;
ALTER TABLE projects ALTER COLUMN user_id SET STATISTICS 1000;

-- ============================================================
-- VACUUM AND ANALYZE
-- ============================================================

-- Analyze tables to update query planner statistics
ANALYZE users;
ANALYZE sessions;
ANALYZE projects;
ANALYZE tasks;
ANALYZE subtasks;
ANALYZE tags;
ANALYZE task_tags;
ANALYZE task_dependencies;
ANALYZE recurrence;
ANALYZE reminders;

-- ============================================================
-- NOTES
-- ============================================================
-- These indexes are designed to optimize the most common query patterns:
-- 1. Fetching user's projects/tasks with sorting
-- 2. Filtering tasks by status, project, date ranges
-- 3. Full-text search on task titles and descriptions
-- 4. Efficient junction table lookups for tags and dependencies
-- 5. Reminder processing for background jobs
-- ============================================================
