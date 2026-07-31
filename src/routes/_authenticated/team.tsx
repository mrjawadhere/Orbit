import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EmptyState, ErrorState, PageHeader, SkeletonCards } from "@/components/app/ui-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useTasks } from "@/hooks/use-orbit-data";
import { useWorkspace } from "@/hooks/use-workspace";
import { ROLES, initials, titleCase, type AppRole } from "@/lib/orbit";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Team — Orbit" },
      { name: "description", content: "Members, roles and workload across your Orbit workspace." },
      { property: "og:title", content: "Team — Orbit" },
      { property: "og:description", content: "Members, roles and workload across your workspace." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { workspace, can, isLoading, error, refresh } = useWorkspace();
  const tasks = useTasks();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");

  const load = useMemo(() => {
    const map = new Map<string, { open: number; done: number }>();
    for (const task of tasks.data ?? []) {
      if (!task.assignee_id) continue;
      const entry = map.get(task.assignee_id) ?? { open: 0, done: 0 };
      if (task.status === "done") entry.done += 1;
      else entry.open += 1;
      map.set(task.assignee_id, entry);
    }
    return map;
  }, [tasks.data]);

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error: updateError } = await supabase
        .from("memberships")
        .update({ role })
        .eq("organization_id", workspace!.org.id)
        .eq("user_id", userId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Role updated");
      refresh();
      void queryClient.invalidateQueries();
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  if (isLoading) return <SkeletonCards />;
  if (error) return <ErrorState error={error} retry={refresh} />;

  const members = (workspace?.members ?? []).filter((m) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return `${m.full_name ?? ""} ${m.email ?? ""}`.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace?.org.name}
        title="Team"
        description="Roles control what each teammate can see and change. Workload is calculated live from open tasks."
        actions={
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people…"
            aria-label="Search team members"
            className="h-9 w-56"
          />
        }
      />

      {members.length === 0 ? (
        <EmptyState title="No teammates found" description="Try a different search term." />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="hidden md:table-cell">Title</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Workload</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const stats = load.get(member.user_id) ?? { open: 0, done: 0 };
                const isSelf = member.user_id === workspace?.userId;
                return (
                  <TableRow key={member.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="label-mono flex size-8 items-center justify-center rounded-md bg-muted text-[11px]">
                          {initials(member.full_name ?? member.email)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {member.full_name ?? "Invited teammate"} {isSelf ? <span className="text-muted-foreground">(you)</span> : null}
                          </p>
                          <p className="label-mono truncate text-muted-foreground">{member.email ?? "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {member.job_title ?? "—"}
                    </TableCell>
                    <TableCell>
                      {can("manage_members") && !isSelf ? (
                        <Select
                          value={member.role}
                          onValueChange={(value) => updateRole.mutate({ userId: member.user_id, role: value as AppRole })}
                        >
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROLES.map((role) => <SelectItem key={role} value={role}>{titleCase(role)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline">{titleCase(member.role)}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="label-mono text-right text-muted-foreground">
                      {stats.open} open · {stats.done} done
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
