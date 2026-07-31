import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/hooks/use-orbit-data";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  PRIORITIES,
  TASK_STATUSES,
  formatRelative,
  initials,
  titleCase,
  type Priority,
  type Task,
  type TaskStatus,
} from "@/lib/orbit";

type Comment = { id: string; body: string; author_id: string; created_at: string };

export function TaskDetailSheet({
  task,
  onOpenChange,
  canEdit,
}: {
  task: Task | null;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
}) {
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Task | null>(task);
  const [comment, setComment] = useState("");

  useEffect(() => setDraft(task), [task]);

  const comments = useQuery({
    queryKey: ["task-comments", task?.id],
    enabled: Boolean(task?.id),
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from("task_comments")
        .select("id, body, author_id, created_at")
        .eq("task_id", task!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (patch: Partial<Task>) => {
      if (!task) return;
      const { error } = await supabase
        .from("tasks")
        .update({
          ...patch,
          completed_at: patch.status === "done" ? new Date().toISOString() : patch.status ? null : undefined,
        })
        .eq("id", task.id);
      if (error) throw error;
      if (workspace) {
        await logActivity({
          orgId: workspace.org.id,
          actorId: workspace.userId,
          action: "task.updated",
          entityType: "task",
          entityId: task.id,
          summary: `${workspace.profile?.full_name ?? "Someone"} updated ${task.title}`,
        });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
      toast.success("Task updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!task) return;
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onOpenChange(false);
      toast.success("Task deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!task || !workspace) return;
      const { error } = await supabase.from("task_comments").insert({
        task_id: task.id,
        organization_id: workspace.org.id,
        author_id: workspace.userId,
        body: comment.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      void comments.refetch();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const memberName = (id: string | null) =>
    workspace?.members.find((m) => m.user_id === id)?.full_name ?? "Teammate";

  return (
    <Sheet open={Boolean(task)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {draft ? (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between gap-4">
                <SheetTitle className="text-left font-display text-lg">{draft.title}</SheetTitle>
                {save.isPending && (
                  <span className="label-mono text-[10px] text-muted-foreground animate-pulse" aria-live="polite">
                    Saving…
                  </span>
                )}
              </div>
              <SheetDescription className="text-left">
                Created {formatRelative(draft.created_at)} · reported by {memberName(draft.reporter_id)}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 px-4 pb-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={draft.status}
                    disabled={!canEdit}
                    onValueChange={(value) => {
                      setDraft({ ...draft, status: value as TaskStatus });
                      save.mutate({ status: value as TaskStatus });
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={draft.priority}
                    disabled={!canEdit}
                    onValueChange={(value) => {
                      setDraft({ ...draft, priority: value as Priority });
                      save.mutate({ priority: value as Priority });
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select
                    value={draft.assignee_id ?? "unassigned"}
                    disabled={!canEdit}
                    onValueChange={(value) => {
                      const next = value === "unassigned" ? null : value;
                      setDraft({ ...draft, assignee_id: next });
                      save.mutate({ assignee_id: next });
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {(workspace?.members ?? []).map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.full_name ?? m.email ?? "Teammate"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-due">Due date</Label>
                  <Input
                    id="task-due"
                    type="date"
                    disabled={!canEdit}
                    value={draft.due_date ?? ""}
                    onChange={(e) => setDraft({ ...draft, due_date: e.target.value || null })}
                    onBlur={() => save.mutate({ due_date: draft.due_date })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  rows={5}
                  disabled={!canEdit}
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  onBlur={() => save.mutate({ description: draft.description })}
                />
              </div>

              <div className="space-y-3">
                <Label>Comments</Label>
                <ul className="space-y-3">
                  {(comments.data ?? []).map((item) => (
                    <li key={item.id} className="flex gap-3">
                      <span className="label-mono flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[10px]">
                        {initials(memberName(item.author_id))}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm">{item.body}</p>
                        <p className="label-mono text-muted-foreground">
                          {memberName(item.author_id)} · {formatRelative(item.created_at)}
                        </p>
                      </div>
                    </li>
                  ))}
                  {comments.data?.length === 0 ? (
                    <li className="text-sm text-muted-foreground">No comments yet.</li>
                  ) : null}
                </ul>
                <form
                  className="flex items-end gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const trimmed = comment.trim();
                    if (trimmed.length < 2) {
                      toast.error("Comment must be at least 2 characters.");
                      return;
                    }
                    if (trimmed.length > 1000) {
                      toast.error("Comment cannot exceed 1000 characters.");
                      return;
                    }
                    addComment.mutate();
                  }}
                >
                  <Textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Leave a comment…"
                    aria-label="Comment"
                    required
                    maxLength={1000}
                  />
                  <Button type="submit" disabled={!comment.trim() || addComment.isPending}>Post</Button>
                </form>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <Badge variant="outline">{titleCase(draft.status)}</Badge>
                {canEdit ? (
                  <Button variant="ghost" className="text-destructive" onClick={() => remove.mutate()} disabled={remove.isPending}>
                    <Trash2 className="size-4" /> Delete task
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
