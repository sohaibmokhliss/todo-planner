-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create projects table
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  emoji TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date TIMESTAMP WITH TIME ZONE,
  start_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create subtasks table
CREATE TABLE subtasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create tags table
CREATE TABLE tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, name)
);

-- Create task_tags junction table
CREATE TABLE task_tags (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (task_id, tag_id)
);

-- Create recurrence table
CREATE TABLE recurrence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL UNIQUE,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  interval INTEGER NOT NULL DEFAULT 1,
  days_of_week INTEGER[],
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create reminders table
CREATE TABLE reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'push')),
  time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);
CREATE INDEX idx_recurrence_task_id ON recurrence(task_id);
CREATE INDEX idx_reminders_task_id ON reminders(task_id);
CREATE INDEX idx_reminders_time ON reminders(time) WHERE NOT sent;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrence ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Subtasks policies
CREATE POLICY "Users can view subtasks of own tasks" ON subtasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can create subtasks for own tasks" ON subtasks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can update subtasks of own tasks" ON subtasks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can delete subtasks of own tasks" ON subtasks FOR DELETE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));

-- Tags policies
CREATE POLICY "Users can view own tags" ON tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tags" ON tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON tags FOR DELETE USING (auth.uid() = user_id);

-- Task tags policies
CREATE POLICY "Users can view task_tags of own tasks" ON task_tags FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can create task_tags for own tasks" ON task_tags FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can delete task_tags from own tasks" ON task_tags FOR DELETE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()));

-- Recurrence policies
CREATE POLICY "Users can view recurrence of own tasks" ON recurrence FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = recurrence.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can create recurrence for own tasks" ON recurrence FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = recurrence.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can update recurrence of own tasks" ON recurrence FOR UPDATE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = recurrence.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can delete recurrence from own tasks" ON recurrence FOR DELETE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = recurrence.task_id AND tasks.user_id = auth.uid()));

-- Reminders policies
CREATE POLICY "Users can view reminders of own tasks" ON reminders FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = reminders.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can create reminders for own tasks" ON reminders FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = reminders.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can update reminders of own tasks" ON reminders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = reminders.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can delete reminders from own tasks" ON reminders FOR DELETE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = reminders.task_id AND tasks.user_id = auth.uid()));

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
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
