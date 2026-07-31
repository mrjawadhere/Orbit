import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import type { Project, Task } from "@/lib/orbit";

export function useProjects(options?: { includeArchived?: boolean }) {
  const { workspace } = useWorkspace();
  const orgId = workspace?.org.id;
  const includeArchived = options?.includeArchived ?? false;

  return useQuery({
    queryKey: ["projects", orgId, includeArchived],
    enabled: Boolean(orgId),
    queryFn: async (): Promise<Project[]> => {
      let query = supabase
        .from("projects")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (!includeArchived) query = query.eq("is_archived", false);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProject(projectId: string | undefined) {
  const { workspace } = useWorkspace();
  const orgId = workspace?.org.id;
  return useQuery({
    queryKey: ["project", orgId, projectId],
    enabled: Boolean(orgId && projectId),
    queryFn: async (): Promise<Project | null> => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useTasks(projectId?: string) {
  const { workspace } = useWorkspace();
  const orgId = workspace?.org.id;
  return useQuery({
    queryKey: ["tasks", orgId, projectId ?? "all"],
    enabled: Boolean(orgId),
    queryFn: async (): Promise<Task[]> => {
      let query = supabase
        .from("tasks")
        .select("*")
        .eq("organization_id", orgId!)
        .order("position", { ascending: true });
      if (projectId) query = query.eq("project_id", projectId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type ActivityRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  created_at: string;
  actor_id: string | null;
};

export function useActivity(limit = 50) {
  const { workspace } = useWorkspace();
  const orgId = workspace?.org.id;
  return useQuery({
    queryKey: ["activity", orgId, limit],
    enabled: Boolean(orgId),
    queryFn: async (): Promise<ActivityRow[]> => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id, action, entity_type, entity_id, summary, created_at, actor_id")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Best-effort activity write. Never blocks or fails a user action. */
export async function logActivity(input: {
  orgId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
}) {
  const { error } = await supabase.from("activity_logs").insert({
    organization_id: input.orgId,
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    summary: input.summary,
  });
  if (error) console.warn("activity log failed", error.message);
}
