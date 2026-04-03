# Supabase Recovery And Keepalive

This file is a handoff note for reconnecting the app to a new Supabase project and preventing another surprise loss from free-tier inactivity.

## Current state

- Production domain: `https://todo-planner-six.vercel.app`
- Build fix for production alias resolution was pushed to `main`
- Git commit pushed: `12b211b` (`Fix production path alias resolution`)

## Reconnect the app to the new Supabase project

### 1. Run the schema in Supabase

- Open the new Supabase project
- Go to `SQL Editor`
- Run `supabase/full_schema.sql`

### 2. Update Vercel environment variables

In Vercel `Settings` -> `Environment Variables`, set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<new-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<new anon key>
SUPABASE_SERVICE_ROLE_KEY=<new service role key>
JWT_SECRET=<keep existing value unless rotating it>
NEXT_PUBLIC_APP_URL=https://todo-planner-six.vercel.app
```

Notes:

- `JWT_SECRET` does not come from Supabase
- `JWT_SECRET` can stay unchanged if it is already set and trusted
- `NEXT_PUBLIC_APP_URL` is recommended, but not the main blocker

### 3. Remove the bad Vercel env var

Delete `NODE_ENV` from Vercel.

Reason:

- Vercel already sets it automatically
- when manually set to `production`, `npm install` skipped dev dependencies
- that caused the build to fail during TypeScript checks

### 4. Configure Supabase Auth URL settings

In Supabase `Authentication` -> `URL Configuration`:

- `Site URL`:
  - `https://todo-planner-six.vercel.app`

- `Redirect URLs`:
  - `https://todo-planner-six.vercel.app/**`
  - `http://localhost:3000/**`

Optional, only if preview deployments need auth redirects:

- `https://*-d-browncjs-projects.vercel.app/**`

### 5. Redeploy

After updating the env vars:

- redeploy the latest Vercel deployment

## Best way to avoid losing the project again

### Best option

Upgrade the Supabase organization to Pro.

Reason:

- Pro projects are not paused for inactivity
- this is the only reliable fix

## Free-tier workaround

Do not create fake users or fake tasks.

Instead, create a small heartbeat system:

1. Add `CRON_SECRET` in Vercel
2. Use Vercel Cron to call `/api/heartbeat` once per day
3. Let the route do a lightweight DB touch using the service role key
4. Optionally add a tiny table such as:

```sql
create table if not exists project_heartbeat (
  id text primary key,
  last_seen timestamptz not null default now()
);
```

The repo now includes:

- `src/app/api/heartbeat/route.ts`
- `vercel.json` daily cron config
- `.env.example` entry for `CRON_SECRET`

Current behavior:

- if `project_heartbeat` exists, the route writes `last_seen`
- if it does not exist yet, the route falls back to a lightweight read from `users`
- that means the keepalive can be turned on immediately without adding fake app data

Why this is better than fake app data:

- no junk users
- no fake tasks in the UI
- easy to monitor
- easy to remove later

Important caveat:

- treat this as a workaround, not a guarantee
- if the project matters, use Pro and keep backups

## Backup recommendation

Even with a keepalive, keep exports outside Supabase.

Suggested backup habit:

- weekly schema/data export with the Supabase CLI
- keep the dump outside Supabase

## If resuming later

Checklist:

- confirm `full_schema.sql` is loaded into the new Supabase project
- confirm the 3 Supabase env vars in Vercel point to the new project
- confirm `NODE_ENV` is deleted from Vercel
- add `CRON_SECRET` in Vercel
- redeploy
- test signup/login
- test `/api/heartbeat`

## If implementing the heartbeat later

Optional upgrade:

- add `project_heartbeat` to the Supabase schema
- append it to `full_schema.sql` if this becomes a permanent part of the project
