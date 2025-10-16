# Todo Planner - Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned (takes ~2 minutes)
3. Go to Project Settings > API
4. Copy your project URL and anon/public key

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Update the values in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Step 4: Run Database Migrations

1. In your Supabase dashboard, go to SQL Editor
2. Create a new query
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the query

This will create:

- All database tables (profiles, projects, tasks, subtasks, tags, etc.)
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic timestamps
- A function to auto-create user profiles on signup

## Step 5: Enable Email Auth

1. In Supabase dashboard, go to Authentication > Providers
2. Ensure "Email" is enabled
3. **For development**: Consider disabling email confirmation (see AUTH_SETUP.md)
4. **For production**: Keep email confirmation enabled and configure email templates

See [AUTH_SETUP.md](./AUTH_SETUP.md) for detailed authentication configuration instructions.

## Step 6: Run the Development Server

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
```

## Next Steps

Check the main README for the full feature roadmap and development phases.
