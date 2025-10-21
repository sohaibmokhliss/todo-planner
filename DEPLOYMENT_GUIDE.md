# Deployment Guide - Todo Planner

This guide will help you deploy your Todo Planner app to production.

## Quick Deploy (Recommended) - Vercel + Supabase Cloud

### Step 1: Set Up Supabase Cloud (Database)

1. **Create a Supabase account**
   - Go to https://supabase.com
   - Sign up for a free account
   - Create a new project
   - Choose a region close to your users
   - Save your database password!

2. **Run migrations on cloud database**
   ```bash
   # Link your local project to Supabase cloud
   npx supabase link --project-ref YOUR_PROJECT_REF

   # Push migrations to cloud
   npx supabase db push

   # Or manually run migrations via Supabase Dashboard:
   # Dashboard → SQL Editor → paste migration files
   ```

3. **Get your connection strings**
   - Go to Project Settings → Database
   - Copy:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Step 2: Set Up Vercel (Hosting)

1. **Create a Vercel account**
   - Go to https://vercel.com
   - Sign up (can use GitHub)

2. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

3. **Deploy from GitHub**
   - Push your code to GitHub
   - In Vercel Dashboard: New Project → Import from GitHub
   - Select your repository

4. **Configure Environment Variables**

   In Vercel Dashboard → Settings → Environment Variables, add:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # JWT Secret (generate a new random 32-character string)
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long

   # Node Environment
   NODE_ENV=production
   ```

5. **Deploy!**
   ```bash
   # Via CLI
   vercel

   # Or via Dashboard
   # Click "Deploy" in Vercel Dashboard
   ```

Your app will be live at `https://your-app.vercel.app`!

---

## Alternative Deployment Options

### Option 2: Netlify + Supabase Cloud

1. Follow Supabase Cloud setup above
2. Create Netlify account: https://netlify.com
3. Connect GitHub repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Add environment variables (same as Vercel)
6. Deploy!

### Option 3: Railway + Supabase Cloud

1. Follow Supabase Cloud setup above
2. Create Railway account: https://railway.app
3. New Project → Deploy from GitHub
4. Add environment variables
5. Deploy!

### Option 4: Self-Hosted (VPS)

If you have a VPS (DigitalOcean, AWS, etc.):

```bash
# On your server
git clone your-repo
cd todo-planner
npm install
npm run build

# Set up environment variables
nano .env.local
# Add all production env vars

# Run with PM2
npm i -g pm2
pm2 start npm --name "todo-planner" -- start
pm2 save
pm2 startup
```

---

## Email Service Setup (Password Reset)

To enable actual password reset emails, choose one:

### Option A: Resend (Recommended - Free tier)

1. Sign up at https://resend.com
2. Get API key
3. Install: `npm install resend`
4. Update `src/lib/actions/auth.ts`:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// In requestPasswordReset function, replace TODO section:
await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: email,
  subject: 'Reset Your Password',
  html: `
    <h1>Reset Your Password</h1>
    <p>Click the link below to reset your password:</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}">
      Reset Password
    </a>
    <p>This link expires in 1 hour.</p>
  `
})
```

5. Add to environment variables:
```env
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Option B: SendGrid

1. Sign up at https://sendgrid.com
2. Get API key
3. Install: `npm install @sendgrid/mail`
4. Similar setup to Resend

### Option C: AWS SES

1. Set up AWS SES
2. Install: `npm install @aws-sdk/client-ses`
3. Configure with AWS credentials

---

## Pre-Deployment Checklist

### 1. Security

- [ ] Generate new JWT_SECRET (32+ random characters)
- [ ] Remove any hardcoded credentials
- [ ] Set `NODE_ENV=production`
- [ ] Review RLS policies in database
- [ ] Add rate limiting (optional but recommended)

### 2. Database

- [ ] Run all migrations on production database
- [ ] Create initial admin user
- [ ] Backup strategy in place
- [ ] Test database connection from production

### 3. Environment Variables

Create `.env.production` (DO NOT commit this):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=generate-a-new-32-character-secret-key

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production

# Email (if using)
RESEND_API_KEY=re_xxxxx
```

### 4. Code Changes for Production

Update `src/lib/actions/auth.ts` - remove dev token:

```typescript
return {
  success: true,
  message: 'If that email is registered, a reset link will be sent',
  // Remove this line in production:
  // devToken: process.env.NODE_ENV === 'development' ? token : undefined,
}
```

### 5. Testing

- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test password reset (with email)
- [ ] Test task creation
- [ ] Test all features (recurrence, reminders, etc.)
- [ ] Test on mobile devices

---

## Custom Domain Setup

### On Vercel:

1. Go to Project Settings → Domains
2. Add your domain (e.g., `todo.yourdomain.com`)
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

### DNS Records:

```
Type: A
Name: todo (or @)
Value: 76.76.21.21 (Vercel IP)

Or:

Type: CNAME
Name: todo
Value: cname.vercel-dns.com
```

---

## Monitoring & Maintenance

### Set Up Monitoring

1. **Vercel Analytics** (built-in)
   - Automatic on Vercel
   - Shows traffic, performance

2. **Supabase Dashboard**
   - Monitor database usage
   - Check logs
   - Set up alerts

3. **Error Tracking** (optional)
   - Sentry: https://sentry.io
   - Install: `npm install @sentry/nextjs`

### Backups

**Supabase Pro Plan** includes:
- Daily backups
- Point-in-time recovery

**Free Plan**: Manual backups
```bash
# Backup database
npx supabase db dump -f backup.sql

# Restore
psql YOUR_DATABASE_URL < backup.sql
```

---

## Cost Breakdown (Free Tier)

| Service | Free Tier | Limits |
|---------|-----------|--------|
| **Vercel** | Free | 100GB bandwidth, unlimited sites |
| **Supabase** | Free | 500MB database, 2GB bandwidth, 50K monthly active users |
| **Resend** | Free | 100 emails/day, 3000/month |

**Total: $0/month** for small-medium projects!

Upgrade when needed:
- Vercel Pro: $20/month (more bandwidth, analytics)
- Supabase Pro: $25/month (better DB, backups, support)
- Resend Pro: $20/month (50K emails/month)

---

## Quick Deploy Commands

```bash
# 1. Prepare code
git add .
git commit -m "Prepare for deployment"
git push origin main

# 2. Set up Supabase
npx supabase link --project-ref YOUR_REF
npx supabase db push

# 3. Deploy to Vercel
vercel --prod

# Done! 🎉
```

---

## Troubleshooting

### Issue: "Failed to set user context"
- Check SUPABASE_SERVICE_ROLE_KEY is set
- Verify RLS policies in Supabase Dashboard

### Issue: "Authentication failed"
- Check JWT_SECRET is set and matches
- Verify Supabase connection strings

### Issue: "Database connection failed"
- Check database is not paused (Supabase pauses after 7 days inactivity on free tier)
- Verify connection pooling settings

### Issue: "Password reset not working"
- Check email service is configured
- Verify NEXT_PUBLIC_APP_URL is set correctly

---

## Next Steps After Deployment

1. **Set up analytics**
   - Google Analytics
   - Vercel Analytics
   - Plausible

2. **Add monitoring**
   - Uptime monitoring (UptimeRobot)
   - Error tracking (Sentry)

3. **Create documentation**
   - User guide
   - API documentation (if needed)

4. **Marketing**
   - Share on Product Hunt
   - Social media
   - Get feedback!

---

## Support & Updates

To update your deployed app:

```bash
# Make changes locally
git add .
git commit -m "Update feature X"
git push origin main

# Vercel auto-deploys on push!
# Or manually: vercel --prod
```

**Need help?**
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

Good luck with your deployment! 🚀
