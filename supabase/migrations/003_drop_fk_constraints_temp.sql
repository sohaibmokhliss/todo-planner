-- TEMPORARY: Drop foreign key constraints for development
-- This allows creating tasks without valid user_id references
-- DO NOT USE IN PRODUCTION!

-- Drop foreign key constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_user_id_fkey;

-- Make user_id nullable temporarily
ALTER TABLE projects ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE tasks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE tags ALTER COLUMN user_id DROP NOT NULL;

-- Note: To restore constraints later:
-- ALTER TABLE tasks ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE tags ADD CONSTRAINT tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
