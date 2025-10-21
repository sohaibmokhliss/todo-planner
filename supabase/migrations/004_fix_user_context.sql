-- Fix set_user_context to use session-wide scope
-- In local development without connection pooling, this works better

CREATE OR REPLACE FUNCTION public.set_user_context(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use false to make it session-wide
  -- This ensures the context persists for all operations in the session
  PERFORM set_config('request.jwt.claims.user_id', user_id::text, false);
END;
$$;
