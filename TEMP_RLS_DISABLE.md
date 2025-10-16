# Temporary RLS Disable for Development

Since authentication isn't working yet, you need to temporarily disable Row Level Security (RLS) to test the app features.

## Steps to Disable RLS in Supabase

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Policies**
3. Find the **tasks** table
4. Click the **...** menu next to each policy
5. Click **Delete** or **Disable** for all task policies temporarily

OR use SQL Editor:

```sql
-- Disable RLS on tasks table temporarily
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
```

## When You're Done Testing

Re-enable RLS with:

```sql
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
```

## Note

This is ONLY for development/testing. Never disable RLS in production!
Once auth is fixed, we'll re-enable all security policies.
