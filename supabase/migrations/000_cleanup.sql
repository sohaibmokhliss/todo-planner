-- ============================================================
-- CLEANUP SCRIPT - Run this FIRST to remove all existing tables
-- WARNING: This will delete ALL data!
-- ============================================================

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS task_tags CASCADE;
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

-- Drop any remaining functions
DROP FUNCTION IF EXISTS set_user_context(UUID) CASCADE;
DROP FUNCTION IF EXISTS current_user_id() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS clean_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- ============================================================
-- All tables and functions have been dropped
-- Now run 001_complete_schema_with_custom_auth.sql
-- ============================================================
