-- ============================================================
-- FIX USER CONTEXT FUNCTIONS
-- This fixes the RLS policy issues by making user context session-wide
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop and recreate the set_user_context function
CREATE OR REPLACE FUNCTION set_user_context(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Use false to make it session-wide instead of transaction-local
  -- This ensures the user_id persists across all queries in the same connection
  PERFORM set_config('request.jwt.claims.user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the current_user_id function
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
DECLARE
  user_id_text TEXT;
BEGIN
  -- Try to get the setting, return NULL if not set
  BEGIN
    user_id_text := current_setting('request.jwt.claims.user_id', true);
    RETURN NULLIF(user_id_text, '')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Verify the functions were created
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('set_user_context', 'current_user_id')
ORDER BY routine_name;
