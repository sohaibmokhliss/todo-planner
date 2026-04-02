# Todo Planner - Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

---

## 🔄 Restoring a Deleted / Paused Supabase Project

> **This is the most common setup scenario.** Supabase pauses free-tier projects after
> 7 days of inactivity and **permanently deletes** them after 90 days.  Follow these steps
> to get a fresh project up and running in ~5 minutes.

### 1. Create a new Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**, choose your organisation, pick a region and set a database password
3. Wait ~2 minutes for the project to be provisioned

### 2. Run the full schema script

The file `supabase/full_schema.sql` contains **all** migrations consolidated into one
idempotent script.  It drops and recreates every table, index, function, trigger, and RLS
policy from scratch.

1. In your Supabase dashboard open **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `supabase/full_schema.sql` and paste it into the editor
4. Click **Run** (or press `Ctrl/Cmd + Enter`)

You should see `Success. No rows returned` — the database is ready.

### 3. Set environment variables

Copy `.env.example` to `.env.local` and fill in the values from
**Project Settings → API**:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
JWT_SECRET=<a-random-32-char-string>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Tip:** generate a JWT secret with `openssl rand -base64 32`

### 4. Start the development server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) – you can now sign up and use the app.

---

## Fresh Setup (new project from scratch)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned (takes ~2 minutes)
3. Go to **Project Settings → API**
4. Copy your project URL and anon/public key

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Update the values in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   JWT_SECRET=<a-random-32-char-string>
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Step 4: Run Database Migrations

**Option A – single-file (recommended):**

1. In your Supabase dashboard go to **SQL Editor → New query**
2. Copy the contents of `supabase/full_schema.sql`
3. Paste and click **Run**

**Option B – Supabase CLI:**

```bash
# Link your local project to Supabase cloud
npx supabase link --project-ref <YOUR_PROJECT_REF>

# Push all migrations
npx supabase db push
```

This will create:

- All database tables (users, sessions, projects, tasks, subtasks, tags, dependencies, etc.)
- Row Level Security (RLS) policies
- Performance indexes and composite indexes
- Triggers for automatic `updated_at` timestamps
- Helper functions (`set_user_context`, `current_user_id`, `clean_expired_sessions`)

## Step 5: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── lib/             # Utilities and configurations
│   └── supabase/    # Supabase client setup
├── hooks/           # Custom React hooks
└── types/           # TypeScript type definitions
supabase/
├── full_schema.sql   # Consolidated schema – run this to restore the DB
├── migrations/       # Individual migration files (for reference / CLI)
└── seed.sql          # Optional test data
```

## Next Steps

Check the main README for the full feature roadmap and development phases.
