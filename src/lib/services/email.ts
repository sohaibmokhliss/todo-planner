/**
 * Email Service
 *
 * In development, Supabase provides Inbucket for testing emails.
 * Access it at: http://localhost:54324
 *
 * For production, you would configure a real email service like:
 * - SendGrid
 * - AWS SES
 * - Resend
 * - Postmark
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    // In development with Supabase, we can use the local SMTP server
    // The emails will be caught by Inbucket at http://localhost:54324

    // For now, we'll just log the email (you can integrate with an email service later)
    console.log('📧 Email would be sent:')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('Body:', text || html)
    console.log('View test emails at: http://localhost:54324')

    // TODO: Integrate with actual email service in production
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({ from, to, subject, html })

    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export function generateReminderEmail(taskTitle: string, dueDate: string | null): { subject: string; html: string; text: string } {
  const subject = `Reminder: ${taskTitle}`

  const text = `
Hello!

This is a reminder about your task: "${taskTitle}"
${dueDate ? `Due date: ${new Date(dueDate).toLocaleString()}` : ''}

Log in to your Todo Planner to manage this task.

- Todo Planner
  `.trim()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6366f1; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .task-title { font-size: 18px; font-weight: bold; color: #1f2937; margin: 10px 0; }
    .due-date { color: #6b7280; font-size: 14px; }
    .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Todo Planner Reminder</h1>
    </div>
    <div class="content">
      <p>Hello!</p>
      <p>This is a reminder about your task:</p>
      <div class="task-title">${taskTitle}</div>
      ${dueDate ? `<div class="due-date">Due: ${new Date(dueDate).toLocaleString()}</div>` : ''}
      <a href="http://localhost:3000/app" class="button">View Task</a>
    </div>
  </div>
</body>
</html>
  `.trim()

  return { subject, html, text }
}
