## Where Orbit stands today

Already built and working:
- Landing page (hero, features, AI, analytics, testimonials, pricing, FAQ, footer) in the refined professional style you just approved.
- Authentication: sign up, sign in, Google, forgot/reset password, protected route gate.
- Full multi-tenant database with RLS: organizations, profiles, memberships, role_permissions, projects, project_members, tasks, task_comments, activity_logs, notifications, subscriptions, invoices, ai_history, analytics_snapshots.
- Permission-based RBAC (Owner / Admin / Manager / Member / Viewer) enforced in the database, plus automatic demo-workspace seeding for every new signup.
- A first-cut dashboard reading live data.

So the remaining work is the **application surface**: everything a signed-in user sees after `/dashboard`.

## Design decision

I'll keep the current refined design system (soft borders, rounded cards, generous whitespace, Archivo + IBM Plex) rather than switching to Inter/purple glassmorphism, because you explicitly asked for the anti-generic direction and then for it to be cleaned up and made professional. Say the word if you'd rather I re-skin to the `#5B5CEB` / Inter brand spec instead — that's a token-level change I can do in one pass.

## What I'll build

**1. App shell**
Collapsible sidebar (workspace switcher, nav, user menu), top bar with global search trigger, notification bell with live count, theme toggle. Command palette (Cmd+K) over projects, tasks, members and actions. Applied as an `_authenticated` layout so every app page shares it.

**2. Dashboard**
Executive widgets: projects, tasks, completed, overdue, upcoming deadlines, active members, productivity score, completion rate. Recent activity timeline, quick actions, AI summary card. Skeleton loading, empty and error states throughout.

**3. Projects**
List/grid with filters and search; project create/edit dialogs with react-hook-form + zod; project detail with tabs — Overview, Kanban, Table, Calendar, Timeline, Activity, AI summary. Archive/restore.

**4. Tasks & Kanban**
Drag-and-drop board across Todo / In Progress / Review / Blocked / Done, task drawer with description, priority, assignee, labels, due date, estimates, checklist and comments. Table view with sorting, filtering and pagination.

**5. Team**
Member list with search, role assignment, invite and deactivate flows, member profile pages with assigned/completed tasks and activity.

**6. Analytics**
Recharts dashboards: task status, project status, monthly productivity, weekly activity, completion trend, team workload, member performance, deadline performance — with range filters.

**7. AI workspace**
Chat assistant plus one-click generators: dashboard summary, project summary, sprint summary, weekly report, productivity insights, risk detection, task generator. Streaming chat through a server route on Lovable AI (Gemini), history saved to `ai_history`, grounded in the caller's workspace data only.

**8. Notifications, activity, billing, settings, profile**
Notification center with realtime updates and mark-as-read; activity log timeline with filters; billing page (plan, usage, invoices, renewal, upgrade — stub, no payments); settings for profile, organization, notifications, appearance, security, danger zone.

**9. Cross-cutting**
Permission-aware UI (actions hidden when not permitted, always re-checked server-side), full keyboard/ARIA accessibility, responsive down to mobile, code-split routes, TanStack Query caching, toasts on every mutation.

## Technical notes

- All data access goes through the browser Supabase client under RLS, or `createServerFn` with the auth middleware for anything privileged. No edge functions — TanStack server functions are the backend here.
- AI runs server-side via a `/api/chat` server route on the Lovable AI gateway; no API key touches the client.
- Drag-and-drop uses `@dnd-kit` (added as a dependency); charts use the installed Recharts.
- Each page is its own file route under `_authenticated/`, keeping `/` public and SEO-indexed.
- Note on the stack spec: this project runs TanStack Router (not React Router) and deploys through Lovable, not Vercel — everything else in your stack list is already in place.

## Sequencing

I'll ship in this order, verifying in the browser as I go: shell + dashboard → projects + kanban → team + activity + notifications → analytics → AI workspace → billing + settings. Testing (RBAC, tenant isolation, critical journeys) comes at the end so it runs against the finished surfaces.
