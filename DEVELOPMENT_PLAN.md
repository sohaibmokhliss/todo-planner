# Todo Planner - Development Plan

## Project Overview

A modern, full-featured to-do and personal planning web application built with Next.js 15, React 18, Supabase, and TypeScript.

## Current Status

### Completed
- ✅ Project scaffolding and dependencies
- ✅ Database schema design (Supabase migration)
- ✅ Authentication system (email-based)
- ✅ Basic application layout and routing
- ✅ UI foundation with Tailwind CSS
- ✅ Supabase client setup (client/server/middleware)
- ✅ Dark mode support

### In Progress
- 🚧 Core task management features

## Development Phases

---

## Phase 1: Core Task Management (Week 1-2)

**Goal**: Implement basic CRUD operations for tasks

### 1.1 Task Creation
**Files to create/modify**:
- `src/components/tasks/TaskForm.tsx` - Task creation form component
- `src/lib/actions/tasks.ts` - Server actions for task operations
- `src/hooks/useTasks.ts` - React Query hooks for task data
- `src/app/app/page.tsx` - Wire up "Create Task" button

**Features**:
- Quick add input (title only)
- Detailed form modal with all fields:
  - Title (required)
  - Description
  - Due date
  - Priority (low, medium, high, urgent)
  - Project assignment
  - Tags
- Optimistic UI updates
- Error handling and validation

### 1.2 Task Display
**Files to create/modify**:
- `src/components/tasks/TaskList.tsx` - Task list container
- `src/components/tasks/TaskItem.tsx` - Individual task card
- `src/components/tasks/TaskEmpty.tsx` - Empty state

**Features**:
- Display all task fields
- Checkbox to toggle completion
- Visual priority indicators (colors/badges)
- Due date formatting with date-fns
- Overdue task highlighting
- Loading and error states

### 1.3 Task Editing & Deletion
**Files to create/modify**:
- `src/components/tasks/TaskEditModal.tsx` - Edit dialog
- `src/components/tasks/TaskDeleteConfirm.tsx` - Delete confirmation

**Features**:
- Inline editing (click to edit title)
- Full edit modal for detailed changes
- Soft delete with 30-day retention
- Undo deletion functionality
- Confirmation dialogs

### 1.4 Task Completion
**Files to modify**:
- `src/lib/actions/tasks.ts` - Add completion actions

**Features**:
- Toggle task completion status
- Update completed_at timestamp
- Move to "Completed" view
- Celebration micro-interaction

---

## Phase 2: Views & Filters (Week 3)

**Goal**: Implement different task views and filtering

### 2.1 Inbox View (Default)
**Files to modify**:
- `src/app/app/page.tsx` - Update to show all incomplete tasks

**Features**:
- Show all incomplete tasks (no date filter)
- Sort by creation date (newest first)
- Group by priority (optional toggle)

### 2.2 Today View
**Files to create**:
- `src/app/app/today/page.tsx`

**Features**:
- Tasks due today
- Overdue tasks (in separate section)
- Tasks without due dates (in "No Date" section)
- Progress indicator (X of Y completed)

### 2.3 Upcoming View
**Files to create**:
- `src/app/app/upcoming/page.tsx`
- `src/components/tasks/TasksByDate.tsx` - Group tasks by date

**Features**:
- Group tasks by due date
- Show next 7 days by default
- Expandable sections
- Calendar mini-view (optional)

### 2.4 Completed View
**Files to create**:
- `src/app/app/completed/page.tsx`

**Features**:
- Show all completed tasks
- Group by completion date
- Uncomplete option
- Permanent delete option
- Archive bulk actions

### 2.5 Sidebar Navigation
**Files to modify**:
- `src/app/app/layout.tsx` - Extract sidebar to component
- `src/components/navigation/Sidebar.tsx` - New component

**Features**:
- Active state for current view
- Task counts per view
- Keyboard shortcuts (optional)

---

## Phase 3: Projects (Week 4)

**Goal**: Implement project organization

### 3.1 Project CRUD
**Files to create**:
- `src/lib/actions/projects.ts`
- `src/components/projects/ProjectForm.tsx`
- `src/components/projects/ProjectList.tsx`
- `src/hooks/useProjects.ts`

**Features**:
- Create project with name, color, icon
- Edit project details
- Archive/delete projects
- Project color picker (predefined palette)

### 3.2 Project Views
**Files to create**:
- `src/app/app/projects/[id]/page.tsx` - Single project view
- `src/app/app/projects/page.tsx` - All projects overview

**Features**:
- Display all tasks in a project
- Project progress (X% complete)
- Project statistics (total, completed, overdue)
- Filter tasks within project

### 3.3 Project Assignment
**Files to modify**:
- `src/components/tasks/TaskForm.tsx` - Add project selector
- `src/components/tasks/TaskItem.tsx` - Show project badge

**Features**:
- Assign task to project on creation/edit
- Project dropdown with colors
- Move task between projects
- Unassign from project

### 3.4 Sidebar Project List
**Files to modify**:
- `src/components/navigation/Sidebar.tsx`

**Features**:
- Show user's projects
- Task count per project
- Reorder projects (drag & drop - Phase 5)
- Favorite projects

---

## Phase 4: Tags & Search (Week 5)

**Goal**: Implement tagging system and search

### 4.1 Tag System
**Files to create**:
- `src/lib/actions/tags.ts`
- `src/components/tags/TagInput.tsx` - Create/assign tags
- `src/components/tags/TagBadge.tsx` - Display tag
- `src/hooks/useTags.ts`

**Features**:
- Create tags on the fly
- Autocomplete existing tags
- Colorful tag badges
- Manage all tags (rename, delete, merge)

### 4.2 Tag Filtering
**Files to create**:
- `src/app/app/tags/[slug]/page.tsx` - View tasks by tag

**Features**:
- Filter tasks by single tag
- Filter by multiple tags (AND/OR logic)
- Tag cloud view
- Tag usage statistics

### 4.3 Search Functionality
**Files to create**:
- `src/components/search/SearchBar.tsx`
- `src/components/search/SearchResults.tsx`
- `src/app/app/search/page.tsx`

**Features**:
- Full-text search across tasks
- Search in title, description, notes
- Search filters (project, tags, date range)
- Recent searches
- Keyboard shortcut (Cmd/Ctrl + K)

---

## Phase 5: Advanced Features (Week 6-7)

### 5.1 Subtasks
**Files to create**:
- `src/components/tasks/SubtaskList.tsx`
- `src/components/tasks/SubtaskItem.tsx`
- `src/lib/actions/subtasks.ts`

**Features**:
- Add unlimited subtasks to tasks
- Nested subtask display
- Subtask completion tracking
- Parent task auto-completion (when all subtasks done)

### 5.2 Task Notes
**Files to modify**:
- `src/components/tasks/TaskEditModal.tsx` - Add notes section
- `src/types/database.ts` - Already has notes_html field

**Features**:
- Rich text editor for notes (consider Tiptap or Lexical)
- Markdown support
- Save drafts automatically
- Notes preview in task card (expandable)

### 5.3 Recurring Tasks
**Files to create**:
- `src/lib/actions/recurring.ts`
- `src/components/tasks/RecurringSettings.tsx`

**Features**:
- Daily, weekly, monthly, yearly recurrence
- Custom recurrence patterns
- Auto-create next instance on completion
- Edit/delete series options

### 5.4 Task Dependencies
**Database migration needed**: Add task_dependencies table

**Features**:
- Block tasks until dependencies complete
- Visualize dependency chain
- Prevent circular dependencies
- Auto-suggest next task when dependency completes

### 5.5 Drag & Drop
**Files to modify**: Multiple task components

**Dependencies**: Install `@dnd-kit/core`

**Features**:
- Reorder tasks within list
- Drag task to different project
- Drag to change due date (in calendar view)
- Reorder projects in sidebar

---

## Phase 6: Collaboration (Week 8-9)

### 6.1 Task Sharing
**Database changes**: Add sharing tables and RLS policies

**Features**:
- Share individual tasks with others (by email)
- View-only vs. edit permissions
- Shared task indicators
- Activity feed for shared tasks

### 6.2 Project Collaboration
**Features**:
- Share entire projects
- Team members list
- Role-based permissions (owner, editor, viewer)
- Invite by email or link

### 6.3 Comments & Activity
**Files to create**:
- `src/components/tasks/CommentsList.tsx`
- `src/lib/actions/comments.ts`

**Features**:
- Comment on tasks
- @mention collaborators
- Activity timeline (who did what)
- Real-time updates (Supabase Realtime)

---

## Phase 7: Notifications & Reminders (Week 10)

### 7.1 In-App Notifications
**Files to create**:
- `src/components/notifications/NotificationCenter.tsx`
- `src/lib/actions/notifications.ts`

**Features**:
- Notification bell icon in header
- Mark as read/unread
- Notification types (task due, shared, mentioned)
- Clear all option

### 7.2 Email Notifications
**Supabase**: Set up Edge Functions for email

**Features**:
- Daily digest emails
- Task due reminders
- Overdue task alerts
- Configurable email preferences

### 7.3 Task Reminders
**Files to create**:
- `src/components/tasks/ReminderSettings.tsx`

**Features**:
- Set custom reminder times
- Multiple reminders per task
- Snooze functionality
- Browser push notifications (optional)

---

## Phase 8: Analytics & Insights (Week 11)

### 8.1 Personal Dashboard
**Files to create**:
- `src/app/app/dashboard/page.tsx`
- `src/components/analytics/ProductivityChart.tsx`
- `src/components/analytics/StatsCards.tsx`

**Features**:
- Tasks completed this week/month
- Productivity trends (chart)
- Most productive days/times
- Project progress overview
- Streak tracking (consecutive days)

### 8.2 Reports
**Files to create**:
- `src/app/app/reports/page.tsx`

**Features**:
- Completed tasks by project
- Time to completion analysis
- Tag usage reports
- Export data to CSV

---

## Phase 9: Mobile & PWA (Week 12)

### 9.1 Progressive Web App
**Files to create**:
- `public/manifest.json`
- `public/service-worker.js`
- `src/app/offline/page.tsx`

**Features**:
- Install app on device
- Offline support with service worker
- App icons and splash screens
- Cache task data locally

### 9.2 Mobile Optimization
**Files to modify**: All components for responsive design

**Features**:
- Touch-friendly UI
- Mobile navigation (bottom bar)
- Swipe gestures (complete, delete)
- Mobile-optimized forms

---

## Phase 10: Polish & Launch (Week 13-14)

### 10.1 Performance Optimization
- Code splitting and lazy loading
- Image optimization
- Database query optimization
- Caching strategy (React Query)
- Lighthouse audit (aim for 90+ scores)

### 10.2 Accessibility
- ARIA labels and roles
- Keyboard navigation
- Screen reader testing
- Color contrast fixes
- Focus management

### 10.3 Testing
**Files to create**: Test files for components and actions

**Dependencies**: Install Vitest, React Testing Library

- Unit tests for utilities
- Integration tests for server actions
- E2E tests with Playwright (critical flows)
- Test coverage >80%

### 10.4 Documentation
- User guide
- API documentation
- Contributing guide
- Deployment guide

### 10.5 Launch Preparation
- Set up error tracking (Sentry)
- Analytics (Vercel Analytics or Plausible)
- Production database backup strategy
- Security audit
- Load testing

---

## Technical Considerations

### State Management
- **React Query** for server state (tasks, projects, tags)
- **Zustand** for client state (UI preferences, filters)
- Optimistic updates for better UX

### Styling
- **Tailwind CSS** for utility classes
- **lucide-react** for icons
- Custom design tokens for consistency
- Dark mode throughout

### Performance
- Server Components by default
- Client Components only when needed (interactivity)
- Streaming with Suspense
- Lazy load heavy components (editor, charts)

### Security
- Row Level Security (RLS) in Supabase
- Server Actions for mutations
- Input validation (client + server)
- Rate limiting (Supabase Edge Functions)

### Database
- Indexes on frequently queried fields
- Soft deletes for tasks (30-day retention)
- Automatic timestamps with triggers
- Efficient queries (avoid N+1)

---

## Quick Reference: File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Inbox
│   │   ├── today/
│   │   ├── upcoming/
│   │   ├── completed/
│   │   ├── projects/
│   │   ├── tags/
│   │   ├── search/
│   │   ├── dashboard/
│   │   └── reports/
│   ├── layout.tsx
│   └── page.tsx               # Landing page
├── components/
│   ├── tasks/
│   ├── projects/
│   ├── tags/
│   ├── navigation/
│   ├── search/
│   ├── notifications/
│   ├── analytics/
│   └── ui/                    # Reusable UI components
├── lib/
│   ├── actions/               # Server actions
│   ├── supabase/
│   └── utils/
├── hooks/                     # Custom React hooks
└── types/                     # TypeScript types
```

---

## Development Workflow

1. **Start each feature**:
   - Create feature branch from main
   - Write types first
   - Implement server actions
   - Build UI components
   - Test thoroughly

2. **Code quality**:
   - Run `npm run lint` before commit
   - Run `npm run format` for consistent style
   - Write meaningful commit messages
   - Review your own PR before requesting review

3. **Testing locally**:
   - Test in both light and dark modes
   - Test responsive design (mobile, tablet, desktop)
   - Test error states and edge cases
   - Test with empty states

---

## Timeline Summary

| Week | Phase | Focus |
|------|-------|-------|
| 1-2  | Phase 1 | Core task CRUD |
| 3    | Phase 2 | Views & filters |
| 4    | Phase 3 | Projects |
| 5    | Phase 4 | Tags & search |
| 6-7  | Phase 5 | Advanced features |
| 8-9  | Phase 6 | Collaboration |
| 10   | Phase 7 | Notifications |
| 11   | Phase 8 | Analytics |
| 12   | Phase 9 | Mobile & PWA |
| 13-14| Phase 10| Polish & launch |

**Estimated Total**: 14 weeks for full-featured MVP

---

## Next Immediate Steps

1. ✅ Set up local development environment
2. ⬜ Implement task creation form (Phase 1.1)
3. ⬜ Implement task list display (Phase 1.2)
4. ⬜ Add task editing and deletion (Phase 1.3)

Let's start building! 🚀
