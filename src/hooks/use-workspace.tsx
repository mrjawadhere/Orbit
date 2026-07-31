import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { AppPermission, AppRole, PlanTier } from "@/lib/orbit";

export type WorkspaceMember = {
  user_id: string;
  role: AppRole;
  is_active: boolean;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  job_title: string | null;
};

export type OrgSummary = {
  id: string;
  name: string;
  slug: string;
  plan: PlanTier;
  logo_url: string | null;
};

export type Workspace = {
  userId: string;
  org: OrgSummary;
  role: AppRole;
  permissions: AppPermission[];
  organizations: (OrgSummary & { role: AppRole })[];
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    job_title: string | null;
    timezone: string;
  } | null;
  members: WorkspaceMember[];
};

const ACTIVE_ORG_KEY = "orbit-active-org";

function readActiveOrg(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_ORG_KEY);
}

async function loadWorkspace(preferredOrgId: string | null): Promise<Workspace | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data: memberships, error } = await supabase
    .from("memberships")
    .select("role, organization_id, organizations(id, name, slug, plan, logo_url)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at");
  if (error) throw error;

  const organizations = (memberships ?? [])
    .map((m) => {
      const org = m.organizations as OrgSummary | null;
      return org ? { ...org, role: m.role as AppRole } : null;
    })
    .filter((o): o is OrgSummary & { role: AppRole } => Boolean(o));

  if (!organizations.length) return null;

  const active =
    organizations.find((o) => o.id === preferredOrgId) ?? organizations[0]!;
  const { role, ...org } = active;


  const [perms, memberRows] = await Promise.all([
    supabase.from("role_permissions").select("permission").eq("role", role),
    supabase.from("memberships").select("user_id, role, is_active").eq("organization_id", org.id),
  ]);

  const memberIds = (memberRows.data ?? []).map((m) => m.user_id);
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, job_title, timezone")
    .in("id", memberIds.length ? memberIds : [userId]);

  const byId = new Map((profileRows ?? []).map((p) => [p.id, p]));

  return {
    userId,
    org,
    role,
    organizations,
    permissions: (perms.data ?? []).map((p) => p.permission as AppPermission),
    profile: byId.get(userId) ?? null,
    members: (memberRows.data ?? []).map((m) => {
      const p = byId.get(m.user_id);
      return {
        user_id: m.user_id,
        role: m.role as AppRole,
        is_active: m.is_active,
        full_name: p?.full_name ?? null,
        email: p?.email ?? null,
        avatar_url: p?.avatar_url ?? null,
        job_title: p?.job_title ?? null,
      };
    }),
  };
}

export const workspaceQueryKey = ["workspace"] as const;

type Ctx = {
  workspace: Workspace | null;
  isLoading: boolean;
  error: unknown;
  can: (permission: AppPermission) => boolean;
  refresh: () => void;
  switchOrg: (orgId: string) => void;
};

const WorkspaceContext = createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  useEffect(() => {
    setActiveOrgId(readActiveOrg());
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: [...workspaceQueryKey, activeOrgId],
    queryFn: () => loadWorkspace(activeOrgId),
    staleTime: 60_000,
  });

  const switchOrg = useCallback(
    (orgId: string) => {
      if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_ORG_KEY, orgId);
      setActiveOrgId(orgId);
      void queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const value: Ctx = {
    workspace: data ?? null,
    isLoading,
    error,
    can: (permission) => Boolean(data?.permissions.includes(permission)),
    refresh: () => void queryClient.invalidateQueries({ queryKey: workspaceQueryKey }),
    switchOrg,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}

/** Convenience: throws-free accessor for the current org id. */
export function useOrgId() {
  return useWorkspace().workspace?.org.id ?? null;
}
