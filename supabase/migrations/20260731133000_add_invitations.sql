-- ============ INVITATIONS TABLE ============
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);

-- ============ GRANTS ============
GRANT SELECT, INSERT, DELETE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;

-- ============ RLS ============
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_select" ON public.invitations FOR SELECT TO authenticated USING (
  public.is_org_member(organization_id)
);

CREATE POLICY "invitations_insert" ON public.invitations FOR INSERT TO authenticated WITH CHECK (
  public.has_org_permission(organization_id, 'invite_members') AND invited_by = auth.uid()
);

CREATE POLICY "invitations_delete" ON public.invitations FOR DELETE TO authenticated USING (
  public.has_org_permission(organization_id, 'invite_members')
);

-- ============ UPDATE handle_new_user TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org UUID;
  v_name TEXT;
  v_p1 UUID; v_p2 UUID; v_p3 UUID; v_p4 UUID;
  i INTEGER;
  v_invite_role public.app_role;
  v_invited_by UUID;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, job_title)
  VALUES (NEW.id, NEW.email, v_name, 'Product Lead');

  -- Look for active invitation
  SELECT organization_id, role, invited_by INTO v_org, v_invite_role, v_invited_by
  FROM public.invitations
  WHERE lower(email) = lower(NEW.email)
  LIMIT 1;

  IF v_org IS NOT NULL THEN
    -- Join organization
    INSERT INTO public.memberships (organization_id, user_id, role, invited_by)
    VALUES (v_org, NEW.id, v_invite_role, v_invited_by);

    -- Log activity
    INSERT INTO public.activity_logs (organization_id, actor_id, action, entity_type, entity_id, summary)
    VALUES (v_org, NEW.id, 'member.joined', 'membership', NULL, v_name || ' joined the workspace via invitation');

    -- Delete the consumed invitation
    DELETE FROM public.invitations WHERE lower(email) = lower(NEW.email);
  ELSE
    -- Acme Studio onboarding setup
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
  END IF;

  RETURN NEW;
END;
$$;
