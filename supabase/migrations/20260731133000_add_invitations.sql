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
    -- Digital Softs onboarding setup
    INSERT INTO public.organizations (name, slug, plan, created_by)
    VALUES ('Digital Softs', 'digital-softs-' || substr(NEW.id::text, 1, 8), 'pro', NEW.id)
    RETURNING id INTO v_org;

    INSERT INTO public.memberships (organization_id, user_id, role) VALUES (v_org, NEW.id, 'owner');

    INSERT INTO public.subscriptions (organization_id, plan, seats, renews_at)
    VALUES (v_org, 'pro', 25, CURRENT_DATE + 30);

    INSERT INTO public.invoices (organization_id, number, amount_cents, status, issued_on) VALUES
      (v_org, 'DS-2026-08', 29000, 'paid', CURRENT_DATE - 30),
      (v_org, 'DS-2026-07', 29000, 'paid', CURRENT_DATE - 60),
      (v_org, 'DS-2026-06', 25000, 'paid', CURRENT_DATE - 90);

    INSERT INTO public.projects (organization_id, name, description, color, status, priority, owner_id, deadline, progress)
    VALUES (v_org, 'Digital Softs Enterprise Suite', 'Next-gen enterprise software suite with real-time analytics, order tracking, and client portal.', '#5B5CEB', 'active', 'urgent', NEW.id, CURRENT_DATE + 14, 84)
    RETURNING id INTO v_p1;
    INSERT INTO public.projects (organization_id, name, description, color, status, priority, owner_id, deadline, progress)
    VALUES (v_org, 'Orbit AI Risk & Velocity Engine', 'Machine learning pipeline for predictive risk detection, automated task breakdown, and executive reports.', '#7C3AED', 'active', 'high', NEW.id, CURRENT_DATE + 28, 68)
    RETURNING id INTO v_p2;
    INSERT INTO public.projects (organization_id, name, description, color, status, priority, owner_id, deadline, progress)
    VALUES (v_org, 'Cloud DevOps & Zero-Trust Migration', 'AWS Elastic Kubernetes Service deployment with Terraform IaC, ArgoCD, and automated vulnerability scanning.', '#10B981', 'active', 'high', NEW.id, CURRENT_DATE + 10, 92)
    RETURNING id INTO v_p3;
    INSERT INTO public.projects (organization_id, name, description, color, status, priority, owner_id, deadline, progress)
    VALUES (v_org, 'FinTech Mobile App v3', 'Next-gen cross-platform React Native app with biometric authentication, card management, and push notifications.', '#00C2FF', 'active', 'urgent', NEW.id, CURRENT_DATE + 35, 50)
    RETURNING id INTO v_p4;

    INSERT INTO public.project_members (project_id, user_id, organization_id) VALUES
      (v_p1, NEW.id, v_org), (v_p2, NEW.id, v_org), (v_p3, NEW.id, v_org), (v_p4, NEW.id, v_org);

    INSERT INTO public.tasks (organization_id, project_id, title, description, status, priority, assignee_id, reporter_id, labels, due_date, estimated_hours, completed_hours, completed_at) VALUES
      (v_org, v_p1, 'Zero-Trust IAM Role Audit', 'Audit row-level permissions and JWT validation policies across API endpoints.', 'in_progress', 'high', NEW.id, NEW.id, ARRAY['security','backend'], CURRENT_DATE + 3, 12, 7, NULL),
      (v_org, v_p1, 'Kafka Event Bus Integration', 'Stream real-time enterprise events to downstream reporting microservices.', 'in_review', 'urgent', NEW.id, NEW.id, ARRAY['backend','architecture'], CURRENT_DATE + 5, 16, 16, NULL),
      (v_org, v_p1, 'Dark Mode Semantic Tokens', 'Standardize typography and dark theme tokens across client workspace UI.', 'done', 'medium', NEW.id, NEW.id, ARRAY['frontend','design'], CURRENT_DATE - 2, 10, 10, now() - interval '2 days'),
      (v_org, v_p2, 'Predictive Risk AI Model Fine-tuning', 'Train anomaly detection classifier on sprint velocity and task dependency trees.', 'in_progress', 'urgent', NEW.id, NEW.id, ARRAY['ai','python'], CURRENT_DATE + 6, 24, 15, NULL),
      (v_org, v_p2, 'Automated Executive Report Generator', 'Generate PDF weekly summary reports formatted for stakeholder distribution.', 'todo', 'medium', NEW.id, NEW.id, ARRAY['ai','frontend'], CURRENT_DATE + 12, 14, NULL, NULL),
      (v_org, v_p2, 'Task Generator Prompt Tuning', 'Refine system instructions for breaking product epics into actionable sprint tasks.', 'backlog', 'high', NULL, NEW.id, ARRAY['ai'], CURRENT_DATE + 20, 8, NULL, NULL),
      (v_org, v_p3, 'Terraform EKS Multi-Region Failover', 'Implement active-passive failover with Route53 health checks and DB read-replicas.', 'done', 'high', NEW.id, NEW.id, ARRAY['devops','cloud'], CURRENT_DATE - 4, 30, 30, now() - interval '4 days'),
      (v_org, v_p3, 'CI/CD Automated Security Scanning', 'Integrate SonarQube and Trivy container scanning into GitHub Actions workflow.', 'in_progress', 'medium', NEW.id, NEW.id, ARRAY['devops','security'], CURRENT_DATE + 7, 12, 6, NULL),
      (v_org, v_p4, 'Biometric Auth Flow (FaceID / Fingerprint)', 'Implement Secure Enclave authentication layer for iOS 18 and Android 15.', 'todo', 'urgent', NULL, NEW.id, ARRAY['mobile','security'], CURRENT_DATE + 15, 20, NULL, NULL),
      (v_org, v_p4, 'Load Testing API Gateways under 15k RPS', 'K6 load testing script for real-time wallet balance queries.', 'todo', 'high', NULL, NEW.id, ARRAY['qa','performance'], CURRENT_DATE + 18, 16, NULL, NULL);

    INSERT INTO public.activity_logs (organization_id, actor_id, action, entity_type, entity_id, summary) VALUES
      (v_org, NEW.id, 'project.created', 'project', v_p1, 'Created project Digital Softs Enterprise Suite'),
      (v_org, NEW.id, 'task.completed', 'task', NULL, 'Completed Dark Mode Semantic Tokens'),
      (v_org, NEW.id, 'project.completed', 'project', v_p3, 'Deployed Cloud DevOps & Zero-Trust Migration to production'),
      (v_org, NEW.id, 'member.invited', 'membership', NULL, 'Invited 5 engineering leads to Digital Softs'),
      (v_org, NEW.id, 'settings.updated', 'organization', v_org, 'Updated workspace appearance & AI settings');

    INSERT INTO public.notifications (organization_id, user_id, type, title, body) VALUES
      (v_org, NEW.id, 'task_assigned', 'You were assigned “Zero-Trust IAM Role Audit”', 'Due in 3 days in Digital Softs Enterprise Suite.'),
      (v_org, NEW.id, 'deadline', 'Load Testing API Gateways is scheduled for this week', 'QA team is ready for benchmark run.'),
      (v_org, NEW.id, 'project_completed', 'Cloud DevOps Migration milestone reached', 'All EKS terraform modules applied cleanly.');

    INSERT INTO public.ai_history (organization_id, user_id, kind, prompt, response) VALUES
      (v_org, NEW.id, 'weekly_report', 'Summarize this week for Digital Softs executive leadership.',
       'Digital Softs completed 48 engineering tasks (+28% velocity WoW). Cloud DevOps Migration reached 92% completion with multi-region failover tested cleanly. FinTech Mobile App v3 is on track for beta deployment next month.');

    FOR i IN 0..29 LOOP
      INSERT INTO public.analytics_snapshots (organization_id, captured_on, tasks_completed, tasks_created, active_projects, completion_rate)
      VALUES (v_org, CURRENT_DATE - i, 4 + (i * 7) % 11, 5 + (i * 5) % 9, 3, 60 + (i * 3) % 35);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;
