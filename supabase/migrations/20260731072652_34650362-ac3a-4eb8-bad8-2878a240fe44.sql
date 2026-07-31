-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('owner','admin','manager','member','viewer');
CREATE TYPE public.app_permission AS ENUM (
  'create_project','edit_project','delete_project','create_task','assign_task',
  'manage_members','view_dashboard','manage_billing','view_activity','invite_members'
);
CREATE TYPE public.project_status AS ENUM ('planning','active','on_hold','completed','archived');
CREATE TYPE public.priority_level AS ENUM ('low','medium','high','urgent');
CREATE TYPE public.task_status AS ENUM ('backlog','todo','in_progress','in_review','done');
CREATE TYPE public.plan_tier AS ENUM ('free','pro','business','enterprise');
CREATE TYPE public.invoice_status AS ENUM ('paid','open','void');

-- ============ CORE TABLES ============
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  plan public.plan_tier NOT NULL DEFAULT 'free',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  job_title TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT true,
  invited_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission public.app_permission NOT NULL,
  UNIQUE (role, permission)
);

-- ============ SECURITY DEFINER HELPERS ============
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.organization_id = _org_id AND m.user_id = auth.uid() AND m.is_active
  );
$$;

CREATE OR REPLACE FUNCTION public.org_role(_org_id UUID)
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.role FROM public.memberships m
  WHERE m.organization_id = _org_id AND m.user_id = auth.uid() AND m.is_active
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_org_permission(_org_id UUID, _permission public.app_permission)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m
    JOIN public.role_permissions rp ON rp.role = m.role
    WHERE m.organization_id = _org_id
      AND m.user_id = auth.uid()
      AND m.is_active
      AND rp.permission = _permission
  );
$$;

-- ============ WORK TABLES ============
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#5B5CEB',
  status public.project_status NOT NULL DEFAULT 'active',
  priority public.priority_level NOT NULL DEFAULT 'medium',
  owner_id UUID NOT NULL,
  deadline DATE,
  progress INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.priority_level NOT NULL DEFAULT 'medium',
  assignee_id UUID,
  reporter_id UUID,
  labels TEXT[] NOT NULL DEFAULT '{}',
  due_date DATE,
  estimated_hours NUMERIC(6,2),
  completed_hours NUMERIC(6,2),
  position INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  summary TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  plan public.plan_tier NOT NULL DEFAULT 'free',
  seats INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'active',
  renews_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status public.invoice_status NOT NULL DEFAULT 'paid',
  issued_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  captured_on DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  tasks_created INTEGER NOT NULL DEFAULT 0,
  active_projects INTEGER NOT NULL DEFAULT 0,
  completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, captured_on)
);

CREATE INDEX idx_memberships_user ON public.memberships(user_id);
CREATE INDEX idx_projects_org ON public.projects(organization_id);
CREATE INDEX idx_tasks_org ON public.tasks(organization_id);
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_activity_org ON public.activity_logs(organization_id, created_at DESC);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- ============ GRANTS ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memberships TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_comments TO authenticated;
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, UPDATE ON public.subscriptions TO authenticated;
GRANT SELECT ON public.invoices TO authenticated;
GRANT SELECT, INSERT ON public.ai_history TO authenticated;
GRANT SELECT ON public.analytics_snapshots TO authenticated;
GRANT ALL ON public.organizations, public.profiles, public.memberships, public.role_permissions,
  public.projects, public.project_members, public.tasks, public.task_comments, public.activity_logs,
  public.notifications, public.subscriptions, public.invoices, public.ai_history,
  public.analytics_snapshots TO service_role;

-- ============ RLS ============
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON public.organizations FOR SELECT TO authenticated USING (public.is_org_member(id));
CREATE POLICY "org_insert" ON public.organizations FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "org_update" ON public.organizations FOR UPDATE TO authenticated
  USING (public.has_org_permission(id, 'manage_members')) WITH CHECK (public.has_org_permission(id, 'manage_members'));

CREATE POLICY "profiles_select_self" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_select_teammates" ON public.profiles FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = profiles.id AND m.is_active AND public.is_org_member(m.organization_id)
  )
);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "memberships_select" ON public.memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_member(organization_id));
CREATE POLICY "memberships_insert" ON public.memberships FOR INSERT TO authenticated
  WITH CHECK (public.has_org_permission(organization_id, 'manage_members'));
CREATE POLICY "memberships_update" ON public.memberships FOR UPDATE TO authenticated
  USING (public.has_org_permission(organization_id, 'manage_members'))
  WITH CHECK (public.has_org_permission(organization_id, 'manage_members'));
CREATE POLICY "memberships_delete" ON public.memberships FOR DELETE TO authenticated
  USING (public.has_org_permission(organization_id, 'manage_members'));

CREATE POLICY "role_permissions_read" ON public.role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (public.has_org_permission(organization_id, 'create_project') AND owner_id = auth.uid());
CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated
  USING (public.has_org_permission(organization_id, 'edit_project'))
  WITH CHECK (public.has_org_permission(organization_id, 'edit_project'));
CREATE POLICY "projects_delete" ON public.projects FOR DELETE TO authenticated
  USING (public.has_org_permission(organization_id, 'delete_project'));

CREATE POLICY "project_members_select" ON public.project_members FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "project_members_write" ON public.project_members FOR INSERT TO authenticated
  WITH CHECK (public.has_org_permission(organization_id, 'edit_project'));
CREATE POLICY "project_members_delete" ON public.project_members FOR DELETE TO authenticated
  USING (public.has_org_permission(organization_id, 'edit_project'));

CREATE POLICY "tasks_select" ON public.tasks FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.has_org_permission(organization_id, 'create_task'));
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated
  USING (public.has_org_permission(organization_id, 'create_task') OR assignee_id = auth.uid())
  WITH CHECK (public.has_org_permission(organization_id, 'create_task') OR assignee_id = auth.uid());
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE TO authenticated
  USING (public.has_org_permission(organization_id, 'edit_project'));

CREATE POLICY "comments_select" ON public.task_comments FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "comments_insert" ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id) AND author_id = auth.uid());
CREATE POLICY "comments_delete" ON public.task_comments FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE POLICY "activity_select" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_org_permission(organization_id, 'view_activity'));
CREATE POLICY "activity_insert" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id) AND actor_id = auth.uid());

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "subscriptions_select" ON public.subscriptions FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "subscriptions_update" ON public.subscriptions FOR UPDATE TO authenticated
  USING (public.has_org_permission(organization_id, 'manage_billing'))
  WITH CHECK (public.has_org_permission(organization_id, 'manage_billing'));

CREATE POLICY "invoices_select" ON public.invoices FOR SELECT TO authenticated
  USING (public.has_org_permission(organization_id, 'manage_billing'));

CREATE POLICY "ai_history_select" ON public.ai_history FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) AND user_id = auth.uid());
CREATE POLICY "ai_history_insert" ON public.ai_history FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id) AND user_id = auth.uid());

CREATE POLICY "analytics_select" ON public.analytics_snapshots FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

-- ============ ROLE PERMISSION MATRIX ============
INSERT INTO public.role_permissions (role, permission)
SELECT 'owner'::public.app_role, p FROM unnest(ARRAY[
  'create_project','edit_project','delete_project','create_task','assign_task',
  'manage_members','view_dashboard','manage_billing','view_activity','invite_members']::public.app_permission[]) AS p;
INSERT INTO public.role_permissions (role, permission)
SELECT 'admin'::public.app_role, p FROM unnest(ARRAY[
  'create_project','edit_project','delete_project','create_task','assign_task',
  'manage_members','view_dashboard','view_activity','invite_members']::public.app_permission[]) AS p;
INSERT INTO public.role_permissions (role, permission)
SELECT 'manager'::public.app_role, p FROM unnest(ARRAY[
  'create_project','edit_project','create_task','assign_task',
  'view_dashboard','view_activity','invite_members']::public.app_permission[]) AS p;
INSERT INTO public.role_permissions (role, permission)
SELECT 'member'::public.app_role, p FROM unnest(ARRAY[
  'create_task','view_dashboard']::public.app_permission[]) AS p;
INSERT INTO public.role_permissions (role, permission)
SELECT 'viewer'::public.app_role, p FROM unnest(ARRAY[
  'view_dashboard']::public.app_permission[]) AS p;

-- ============ UPDATED_AT ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_orgs_updated BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ NEW USER BOOTSTRAP + DEMO WORKSPACE ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org UUID;
  v_name TEXT;
  v_p1 UUID; v_p2 UUID; v_p3 UUID; v_p4 UUID;
  i INTEGER;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, email, full_name, job_title)
  VALUES (NEW.id, NEW.email, v_name, 'Product Lead');

  INSERT INTO public.organizations (name, slug, plan, created_by)
  VALUES ('Acme Studio', 'acme-studio-' || substr(NEW.id::text, 1, 8), 'pro', NEW.id)
  RETURNING id INTO v_org;

  INSERT INTO public.memberships (organization_id, user_id, role) VALUES (v_org, NEW.id, 'owner');

  INSERT INTO public.subscriptions (organization_id, plan, seats, renews_at)
  VALUES (v_org, 'pro', 12, CURRENT_DATE + 30);

  INSERT INTO public.invoices (organization_id, number, amount_cents, status, issued_on) VALUES
    (v_org, 'ORB-1043', 14400, 'paid', CURRENT_DATE - 30),
    (v_org, 'ORB-1029', 14400, 'paid', CURRENT_DATE - 60),
    (v_org, 'ORB-1012', 12000, 'paid', CURRENT_DATE - 90);

  INSERT INTO public.projects (organization_id, name, description, color, status, priority, owner_id, deadline, progress)
  VALUES (v_org, 'Mobile Redesign', 'Rebuild the mobile experience around the new design system.', '#5B5CEB', 'active', 'high', NEW.id, CURRENT_DATE + 14, 67)
  RETURNING id INTO v_p1;
  INSERT INTO public.projects (organization_id, name, description, color, status, priority, owner_id, deadline, progress)
  VALUES (v_org, 'Billing Platform', 'Usage metering, invoices and plan upgrades.', '#7C3AED', 'active', 'urgent', NEW.id, CURRENT_DATE + 28, 42)
  RETURNING id INTO v_p2;
  INSERT INTO public.projects (organization_id, name, description, color, status, priority, owner_id, deadline, progress)
  VALUES (v_org, 'Growth Experiments', 'Onboarding funnel and activation tests.', '#00C2FF', 'planning', 'medium', NEW.id, CURRENT_DATE + 45, 18)
  RETURNING id INTO v_p3;
  INSERT INTO public.projects (organization_id, name, description, color, status, priority, owner_id, deadline, progress)
  VALUES (v_org, 'Enterprise Security', 'SSO, audit exports and data retention controls.', '#10B981', 'completed', 'high', NEW.id, CURRENT_DATE - 7, 100)
  RETURNING id INTO v_p4;

  INSERT INTO public.project_members (project_id, user_id, organization_id) VALUES
    (v_p1, NEW.id, v_org), (v_p2, NEW.id, v_org), (v_p3, NEW.id, v_org), (v_p4, NEW.id, v_org);

  INSERT INTO public.tasks (organization_id, project_id, title, description, status, priority, assignee_id, reporter_id, labels, due_date, estimated_hours, completed_hours, completed_at) VALUES
    (v_org, v_p1, 'Empty states audit', 'Review every empty state and align with the new illustration set.', 'in_progress', 'high', NEW.id, NEW.id, ARRAY['design','ux'], CURRENT_DATE + 3, 8, 5, NULL),
    (v_org, v_p1, 'Motion spec for navigation', 'Define transition curves and durations for the tab bar.', 'in_review', 'medium', NEW.id, NEW.id, ARRAY['design'], CURRENT_DATE + 5, 6, 6, NULL),
    (v_org, v_p1, 'Ship dark mode tokens', 'Replace hardcoded colors with semantic tokens.', 'done', 'medium', NEW.id, NEW.id, ARRAY['frontend'], CURRENT_DATE - 2, 10, 9, now() - interval '2 days'),
    (v_org, v_p2, 'Usage metering pipeline', 'Aggregate seat and task usage per organization daily.', 'in_progress', 'urgent', NEW.id, NEW.id, ARRAY['backend'], CURRENT_DATE + 6, 20, 11, NULL),
    (v_org, v_p2, 'Invoice PDF templates', 'Branded invoice layout with tax fields.', 'todo', 'medium', NEW.id, NEW.id, ARRAY['backend','design'], CURRENT_DATE + 12, 12, NULL, NULL),
    (v_org, v_p2, 'Plan upgrade flow', 'In-app upgrade with proration preview.', 'backlog', 'high', NULL, NEW.id, ARRAY['frontend'], CURRENT_DATE + 20, 16, NULL, NULL),
    (v_org, v_p3, 'Onboarding checklist', 'Five-step activation checklist with progress.', 'in_progress', 'medium', NEW.id, NEW.id, ARRAY['growth'], CURRENT_DATE + 9, 9, 3, NULL),
    (v_org, v_p3, 'Referral experiment brief', 'Define hypothesis and success metrics.', 'todo', 'low', NULL, NEW.id, ARRAY['growth'], CURRENT_DATE + 15, 4, NULL, NULL),
    (v_org, v_p4, 'SAML SSO rollout', 'Enterprise identity provider support.', 'done', 'high', NEW.id, NEW.id, ARRAY['security'], CURRENT_DATE - 10, 24, 22, now() - interval '10 days'),
    (v_org, v_p4, 'Audit log exports', 'CSV export of the full activity timeline.', 'done', 'medium', NEW.id, NEW.id, ARRAY['security'], CURRENT_DATE - 5, 14, 13, now() - interval '5 days'),
    (v_org, v_p1, 'QA pass on iOS 18', 'Regression sweep before launch.', 'todo', 'urgent', NULL, NEW.id, ARRAY['qa'], CURRENT_DATE - 1, 8, NULL, NULL),
    (v_org, v_p2, 'Dunning emails', 'Automate failed payment reminders.', 'backlog', 'low', NULL, NEW.id, ARRAY['backend'], CURRENT_DATE + 30, 6, NULL, NULL);

  INSERT INTO public.activity_logs (organization_id, actor_id, action, entity_type, entity_id, summary) VALUES
    (v_org, NEW.id, 'project.created', 'project', v_p1, 'Created project Mobile Redesign'),
    (v_org, NEW.id, 'task.completed', 'task', NULL, 'Completed Ship dark mode tokens'),
    (v_org, NEW.id, 'project.completed', 'project', v_p4, 'Marked Enterprise Security as completed'),
    (v_org, NEW.id, 'member.invited', 'membership', NULL, 'Invited 3 teammates to Acme Studio'),
    (v_org, NEW.id, 'settings.updated', 'organization', v_org, 'Updated workspace appearance settings');

  INSERT INTO public.notifications (organization_id, user_id, type, title, body) VALUES
    (v_org, NEW.id, 'task_assigned', 'You were assigned “Empty states audit”', 'Due in 3 days in Mobile Redesign.'),
    (v_org, NEW.id, 'deadline', 'QA pass on iOS 18 is overdue', 'This task was due yesterday.'),
    (v_org, NEW.id, 'project_completed', 'Enterprise Security is complete', 'All 12 tasks are done. Nice work.');

  INSERT INTO public.ai_history (organization_id, user_id, kind, prompt, response) VALUES
    (v_org, NEW.id, 'weekly_report', 'Summarize this week for the leadership update.',
     'The team completed 42 tasks (+24% week over week). Mobile Redesign is 67% complete and on track; Billing Platform is at risk with two unassigned blockers. Recommend rebalancing QA before Friday.');

  FOR i IN 0..29 LOOP
    INSERT INTO public.analytics_snapshots (organization_id, captured_on, tasks_completed, tasks_created, active_projects, completion_rate)
    VALUES (v_org, CURRENT_DATE - i, 4 + (i * 7) % 11, 5 + (i * 5) % 9, 3, 60 + (i * 3) % 35);
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();