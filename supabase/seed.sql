-- Seed data for testing

-- Insert test user (password: 'password123')
-- Password hash is bcrypt for 'password123'
INSERT INTO users (id, username, email, full_name, password_hash) VALUES
('6ddb453e-ae31-4bff-a1fb-57c66757944e', 'browncj', 'browncj@example.com', 'Brown CJ', '$2b$10$wOTrJU/F716cxYEtR7ZwdOqfWyfsrpBgiuSdMWoWPM/dXnz/mSYNi');

-- Insert a test project
INSERT INTO projects (id, name, description, user_id) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Personal', 'Personal tasks', '6ddb453e-ae31-4bff-a1fb-57c66757944e');

-- Insert a test task
INSERT INTO tasks (id, title, description, priority, status, user_id, project_id, due_date) VALUES
('a918587c-e6ea-4439-a46c-5d37bcb5d043', 'Test Task for Recurrence', 'This task is for testing recurrence functionality', 'medium', 'todo', '6ddb453e-ae31-4bff-a1fb-57c66757944e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2025-10-22');

-- Insert some tags
INSERT INTO tags (id, name, color, user_id) VALUES
('11111111-0000-0000-0000-000000000001', 'work', '#3b82f6', '6ddb453e-ae31-4bff-a1fb-57c66757944e'),
('22222222-0000-0000-0000-000000000002', 'urgent', '#ef4444', '6ddb453e-ae31-4bff-a1fb-57c66757944e'),
('33333333-0000-0000-0000-000000000003', 'personal', '#10b981', '6ddb453e-ae31-4bff-a1fb-57c66757944e');
