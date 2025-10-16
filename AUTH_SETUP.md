# Authentication Setup Guide

## Email Confirmation Issue

By default, Supabase requires users to confirm their email address before they can sign in. This is great for production, but can be inconvenient during development.

## Option 1: Disable Email Confirmation (Development Only)

To disable email confirmation during development:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Click on **Email**
4. Scroll down to **Email Confirmations**
5. **DISABLE** the toggle for "Enable email confirmations"
6. Click **Save**

Now users can sign up and sign in immediately without confirming their email.

**Important:** Remember to re-enable this before deploying to production!

## Option 2: Use Email Confirmation (Production Ready)

If you want to keep email confirmation enabled:

1. After signing up, users will see a "Check your email" message
2. Check your email inbox (or spam folder)
3. Click the confirmation link in the email
4. You'll be redirected and can now sign in

## Email Templates

You can customize the confirmation email in Supabase:

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup**
3. Customize the email content and styling
4. Click **Save**

## Testing Emails Locally

For local development, Supabase provides Inbucket for testing emails:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Look for the "Testing" section
4. You'll find a link to Inbucket where all test emails are sent

## Troubleshooting

### "Email not confirmed" error
- Check your email for the confirmation link
- Check spam/junk folder
- Or disable email confirmation as described above

### Email not received
- Wait a few minutes (emails can be delayed)
- Check if Supabase email sending is configured correctly
- Use Inbucket for local testing
- Consider using a different email provider for testing

### Already registered email
- If you try to sign up with an email that's already registered, you'll get an error
- Use the "Sign in" option instead
- Or use a different email address

## Production Considerations

Before going to production:

1. ✅ Enable email confirmations
2. ✅ Set up a custom SMTP server (optional but recommended)
3. ✅ Customize email templates with your branding
4. ✅ Test the full signup flow
5. ✅ Add password reset functionality (coming in Phase 7)
6. ✅ Consider social auth providers (Google, GitHub, etc.)
