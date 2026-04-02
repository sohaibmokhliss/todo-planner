-- ============================================================
-- FULL DATABASE SCHEMA - Todo Planner
-- ============================================================
-- This file consolidates ALL migrations (000–005) into a single
-- script.  Run it once in the Supabase SQL Editor (or via the
-- Supabase CLI) to recreate the entire database from scratch.
--
-- Steps:
--   1. In your Supabase dashboard go to SQL Editor
--   2. Create a new query, paste this entire file and click Run
--
-- WARNING: The cleanup section at the top drops every existing
-- table and function.  Do NOT run against a database you still
-- need to keep!
-- ============================================================


-- ============================================================
-- STEP 0: CLEANUP
-- Drop all existing objects so the script is idempotent.
-- ============================================================

DROP TABLE IF EXISTS task_tags CASCADE;
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS subtasks CASCADE;
DROP TABLE IF EXISTS recurrence CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS set_user_context(UUID) CASCADE;
DROP FUNCTION IF EXISTS current_user_id() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS clean_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;


-- ============================================================
-- STEP 1: EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- STEP 2: HELPER FUNCTIONS
-- (defined early so triggers can reference them)
-- ============================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to set user context for the current session
CREATE OR REPLACE FUNCTION set_user_context(user_id UUID)
RETURNS void AS $$
DECLARE
  current_value TEXT;
BEGIN
  BEGIN
    current_value := current_setting('request.jwt.claims.user_id', true);
    IF current_value = user_id::text THEN
      RETURN;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  PERFORM set_config('request.jwt.claims.user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user ID from request context
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
DECLARE
  user_id_text TEXT;
BEGIN
  BEGIN
    user_id_text := current_setting('request.jwt.claims.user_id', true);
    RETURN NULLIF(user_id_text, '')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to clean up expired sessions and tokens
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
  DELETE FROM password_reset_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- STEP 3: AUTHENTICATION TABLES
-- ============================================================

-- Custom users table (username-based authentication)
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  email_verified BOOLEAN DEFAULT false,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  CONSTRAINT email_format CHECK (email IS NULL OR email ~ '^[^@]+@[^@]+\.[^@]+$')
);

-- Sessions table
CREATE TABLE sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ============================================================
-- STEP 4: APPLICATION TABLES
-- ============================================================

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  emoji TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tasks table
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  notes_html TEXT DEFAULT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date TIMESTAMP WITH TIME ZONE,
  start_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Subtasks table (with nested subtask support via parent_id)
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

-- Tags table
CREATE TABLE tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, name)
);

-- Task tags junction table
CREATE TABLE task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (task_id, tag_id)
);

-- Recurrence table
CREATE TABLE recurrence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE UNIQUE,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  interval INTEGER NOT NULL DEFAULT 1,
  days_of_week INTEGER[],
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reminders table
CREATE TABLE reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'push')),
  time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Task dependencies table
CREATE TABLE task_dependencies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_dependency UNIQUE(task_id, depends_on_task_id),
  CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id)
);


-- ============================================================
-- STEP 5: INDEXES
-- ============================================================

-- Auth indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_expires_at_user ON sessions(expires_at, user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- Application indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_user_position ON projects(user_id, position);
CREATE INDEX idx_projects_user_created ON projects(user_id, created_at DESC);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_project ON tasks(user_id, project_id);
CREATE INDEX idx_tasks_user_position ON tasks(user_id, position);
CREATE INDEX idx_tasks_user_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_tasks_user_incomplete ON tasks(user_id, created_at DESC) WHERE status != 'done';
CREATE INDEX idx_tasks_title_search ON tasks USING gin(to_tsvector('english', title));
CREATE INDEX idx_tasks_description_search ON tasks USING gin(to_tsvector('english', description)) WHERE description IS NOT NULL;

CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX idx_subtasks_parent_id ON subtasks(parent_id);
CREATE INDEX idx_subtasks_task_position ON subtasks(task_id, position);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);
CREATE INDEX idx_task_tags_tag_task ON task_tags(tag_id, task_id);

CREATE INDEX idx_recurrence_task_id ON recurrence(task_id);

CREATE INDEX idx_reminders_task_id ON reminders(task_id);
CREATE INDEX idx_reminders_unsent_time ON reminders(time) WHERE NOT sent;
CREATE INDEX idx_reminders_task_unsent ON reminders(task_id, time) WHERE NOT sent;

CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on_task_id ON task_dependencies(depends_on_task_id);
CREATE INDEX idx_task_dependencies_composite ON task_dependencies(task_id, depends_on_task_id);


-- ============================================================
-- STEP 6: ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrence ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Anyone can sign up" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can check username exists" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own user record" ON users
  FOR UPDATE
  USING (id = current_user_id())
  WITH CHECK (id = current_user_id());

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (user_id = current_user_id());

-- Password reset tokens (handled by app)
CREATE POLICY "System can manage password reset tokens" ON password_reset_tokens
  FOR ALL USING (true);

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = current_user_id());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = current_user_id());

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (user_id = current_user_id());

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (user_id = current_user_id());

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (user_id = current_user_id());

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT WITH CHECK (user_id = current_user_id());

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (user_id = current_user_id());

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (user_id = current_user_id());

-- Subtasks policies
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

-- Tags policies
CREATE POLICY "Users can view own tags" ON tags
  FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Users can create own tags" ON tags
  FOR INSERT WITH CHECK (user_id = current_user_id());

CREATE POLICY "Users can update own tags" ON tags
  FOR UPDATE USING (user_id = current_user_id());

CREATE POLICY "Users can delete own tags" ON tags
  FOR DELETE USING (user_id = current_user_id());

-- Task tags policies
CREATE POLICY "Users can view task_tags of own tasks" ON task_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_tags.task_id
      AND tasks.user_id = current_user_id()
    )
  );

CREATE POLICY "Users can create task_tags for own tasks" ON task_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_tags.task_id
      AND tasks.user_id = current_user_id()
    )
  );

CREATE POLICY "Users can delete task_tags from own tasks" ON task_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_tags.task_id
      AND tasks.user_id = current_user_id()
    )
  );

-- Recurrence policies
CREATE POLICY "Users can view recurrence of own tasks" ON recurrence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = recurrence.task_id
      AND tasks.user_id = current_user_id()
    )
  );

CREATE POLICY "Users can create recurrence for own tasks" ON recurrence
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = recurrence.task_id
      AND tasks.user_id = current_user_id()
    )
  );

CREATE POLICY "Users can update recurrence of own tasks" ON recurrence
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = recurrence.task_id
      AND tasks.user_id = current_user_id()
    )
  );

CREATE POLICY "Users can delete recurrence from own tasks" ON recurrence
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = recurrence.task_id
      AND tasks.user_id = current_user_id()
    )
  );

-- Reminders policies
CREATE POLICY "Users can view reminders of own tasks" ON reminders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = reminders.task_id
      AND tasks.user_id = current_user_id()
    )
  );

CREATE POLICY "Users can create reminders for own tasks" ON reminders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = reminders.task_id
      AND tasks.user_id = current_user_id()
    )
  );

CREATE POLICY "Users can update reminders of own tasks" ON reminders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = reminders.task_id
      AND tasks.user_id = current_user_id()
    )
  );

CREATE POLICY "Users can delete reminders from own tasks" ON reminders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = reminders.task_id
      AND tasks.user_id = current_user_id()
    )
  );

-- Task dependencies policies
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


-- ============================================================
-- STEP 7: TRIGGERS
-- ============================================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subtasks_updated_at BEFORE UPDATE ON subtasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurrence_updated_at BEFORE UPDATE ON recurrence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_dependencies_updated_at BEFORE UPDATE ON task_dependencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- STEP 8: QUERY PLANNER STATISTICS
-- ============================================================

ALTER TABLE tasks ALTER COLUMN user_id SET STATISTICS 1000;
ALTER TABLE tasks ALTER COLUMN status SET STATISTICS 500;
ALTER TABLE tasks ALTER COLUMN project_id SET STATISTICS 500;
ALTER TABLE projects ALTER COLUMN user_id SET STATISTICS 1000;

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
-- Done!  All tables, indexes, RLS policies, and triggers have
-- been created.  Your Todo Planner database is ready.
-- ============================================================
