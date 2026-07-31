CREATE OR REPLACE FUNCTION public.create_organization(
  _name TEXT,
  _plan public.plan_tier DEFAULT 'free',
  _seed_demo BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_org UUID;
  v_slug TEXT;
  v_p1 UUID; v_p2 UUID;
  i INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;
  IF _name IS NULL OR length(btrim(_name)) < 2 THEN
    RAISE EXCEPTION 'Workspace name must be at least 2 characters';
  END IF;

  v_slug := regexp_replace(lower(btrim(_name)), '[^a-z0-9]+', '-', 'g');
  v_slug := btrim(v_slug, '-') || '-' || substr(gen_random_uuid()::text, 1, 6);

  INSERT INTO public.organizations (name, slug, plan, created_by)
  VALUES (btrim(_name), v_slug, _plan, v_uid)
  RETURNING id INTO v_org;

  INSERT INTO public.memberships (organization_id, user_id, role)
  VALUES (v_org, v_uid, 'owner');

  INSERT INTO public.subscriptions (organization_id, plan, seats, renews_at)
  VALUES (v_org, _plan, 5, CURRENT_DATE + 30);

  INSERT INTO public.activity_logs (organization_id, actor_id, action, entity_type, entity_id, summary)
  VALUES (v_org, v_uid, 'organization.created', 'organization', v_org, 'Created workspace ' || btrim(_name));

  IF _seed_demo THEN
    INSERT INTO public.projects (organization_id, name, description, color, status, priority, owner_id, deadline, progress)
    VALUES (v_org, 'Onboarding Sprint', 'First sprint for the new workspace.', '#5B5CEB', 'active', 'high', v_uid, CURRENT_DATE + 14, 35)
    RETURNING id INTO v_p1;
    INSERT INTO public.projects (organization_id, name, description, color, status, priority, owner_id, deadline, progress)
    VALUES (v_org, 'Website Refresh', 'Marketing site content and layout pass.', '#00C2FF', 'planning', 'medium', v_uid, CURRENT_DATE + 30, 10)
    RETURNING id INTO v_p2;

    INSERT INTO public.project_members (project_id, user_id, organization_id)
    VALUES (v_p1, v_uid, v_org), (v_p2, v_uid, v_org);

    INSERT INTO public.tasks (organization_id, project_id, title, description, status, priority, assignee_id, reporter_id, labels, due_date, estimated_hours, completed_hours, completed_at) VALUES
      (v_org, v_p1, 'Invite the team', 'Add teammates and assign roles.', 'todo', 'high', v_uid, v_uid, ARRAY['setup'], CURRENT_DATE + 2, 2, NULL, NULL),
      (v_org, v_p1, 'Define sprint scope', 'Agree on what ships this sprint.', 'in_progress', 'medium', v_uid, v_uid, ARRAY['planning'], CURRENT_DATE + 4, 4, 2, NULL),
      (v_org, v_p1, 'Set up workspace settings', 'Name, logo and defaults.', 'done', 'low', v_uid, v_uid, ARRAY['setup'], CURRENT_DATE - 1, 1, 1, now() - interval '1 day'),
      (v_org, v_p2, 'Draft new homepage copy', 'Rewrite hero and pricing sections.', 'backlog', 'medium', NULL, v_uid, ARRAY['content'], CURRENT_DATE + 20, 6, NULL, NULL);

    FOR i IN 0..13 LOOP
      INSERT INTO public.analytics_snapshots (organization_id, captured_on, tasks_completed, tasks_created, active_projects, completion_rate)
      VALUES (v_org, CURRENT_DATE - i, 1 + (i * 3) % 5, 2 + (i * 2) % 4, 2, 40 + (i * 4) % 40);
    END LOOP;
  END IF;

  RETURN v_org;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_organization(TEXT, public.plan_tier, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_organization(TEXT, public.plan_tier, BOOLEAN) TO authenticated;