import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus, Trash2 } from "lucide-react";

import { EmptyState, ErrorState, PageHeader, SkeletonCards } from "@/components/app/ui-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("member");
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const invitations = useQuery({
    queryKey: ["invitations", workspace?.org.id],
    enabled: Boolean(workspace?.org.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select("id, email, role, created_at")
        .eq("organization_id", workspace!.org.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const inviteMember = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      const { error: inviteError } = await supabase
        .from("invitations")
        .insert({
          organization_id: workspace!.org.id,
          email: email.trim().toLowerCase(),
          role,
          invited_by: workspace!.userId,
        });
      if (inviteError) throw inviteError;
    },
    onSuccess: () => {
      toast.success("Invitation sent");
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      void invitations.refetch();
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const revokeInvitation = useMutation({
    mutationFn: async (id: string) => {
      const { error: revokeError } = await supabase
        .from("invitations")
        .delete()
        .eq("id", id);
      if (revokeError) throw revokeError;
    },
    onSuccess: () => {
      toast.success("Invitation revoked");
      void invitations.refetch();
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

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
          <>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people…"
              aria-label="Search team members"
              className="h-9 w-56"
            />
            {can("invite_members") && (
              <Button size="sm" onClick={() => setIsInviteOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite teammate
              </Button>
            )}
          </>
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

      {invitations.data && invitations.data.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-semibold tracking-tight">Pending Invitations</h2>
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.data.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{titleCase(invite.role)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {can("invite_members") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
                          onClick={() => revokeInvitation.mutate(invite.id)}
                          disabled={revokeInvitation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite teammate</DialogTitle>
            <DialogDescription>
              Send an invitation to join {workspace?.org.name}.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!inviteEmail.trim()) return;
              inviteMember.mutate({ email: inviteEmail, role: inviteRole });
            }}
            className="space-y-4 pt-4"
          >
            <div className="space-y-2">
              <Label htmlFor="invite-email">Work email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="teammate@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(val) => setInviteRole(val as AppRole)}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {titleCase(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMember.isPending}>
                {inviteMember.isPending ? "Sending..." : "Send invitation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

