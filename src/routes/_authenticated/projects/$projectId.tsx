import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { KanbanBoard } from "@/components/app/kanban";
import { TaskDetailSheet } from "@/components/app/task-detail";
import { ErrorState, PageHeader, Panel, SkeletonCards } from "@/components/app/ui-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { logActivity, useProject, useTasks } from "@/hooks/use-orbit-data";
import { useWorkspace } from "@/hooks/use-workspace";
import { generateInsight } from "@/lib/ai.functions";
import {
  PRIORITIES,
  TASK_STATUSES,
  formatDate,
  isOverdue,
  priorityTone,
  statusTone,
  titleCase,
  type Priority,
  type Task,
  type TaskStatus,
} from "@/lib/orbit";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project board — Orbit" },
      { name: "description", content: "Kanban board, task list and AI summary for this project." },
      { property: "og:title", content: "Project board — Orbit" },
      { property: "og:description", content: "Kanban board, task list and AI summary for this project." },
    ],
  }),
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const { workspace, can } = useWorkspace();
  const queryClient = useQueryClient();
  const project = useProject(projectId);
  const tasks = useTasks(projectId);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [creatingIn, setCreatingIn] = useState<TaskStatus | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [assignee, setAssignee] = useState("unassigned");
  const [dueDate, setDueDate] = useState("");
  const [summary, setSummary] = useState<string | null>(null);

  const canEdit = can("create_task");

  const stats = useMemo(() => {
    const all = tasks.data ?? [];
    const done = all.filter((t) => t.status === "done").length;
    return {
      total: all.length,
      done,
      overdue: all.filter((t) => isOverdue(t)).length,
      rate: all.length ? Math.round((done / all.length) * 100) : 0,
    };
  }, [tasks.data]);

  const createTask = useMutation({
    mutationFn: async () => {
      if (!workspace || !creatingIn) return;
      const { error } = await supabase.from("tasks").insert({
        organization_id: workspace.org.id,
        project_id: projectId,
        title: title.trim(),
        description: description.trim() || null,
        status: creatingIn,
        priority,
        assignee_id: assignee === "unassigned" ? null : assignee,
        reporter_id: workspace.userId,
        due_date: dueDate || null,
        position: (tasks.data?.length ?? 0) + 1,
      });
      if (error) throw error;
      await logActivity({
        orgId: workspace.org.id,
        actorId: workspace.userId,
        action: "task.created",
        entityType: "task",
        summary: `${workspace.profile?.full_name ?? "Someone"} created task ${title.trim()}`,
      });
    },
    onSuccess: () => {
      toast.success("Task created");
      setCreatingIn(null);
      setTitle("");
      setDescription("");
      setDueDate("");
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const moveTask = useMutation({
    mutationFn: async ({ task, status }: { task: Task; status: TaskStatus }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status, completed_at: status === "done" ? new Date().toISOString() : null })
        .eq("id", task.id);
      if (error) throw error;
      if (workspace) {
        await logActivity({
          orgId: workspace.org.id,
          actorId: workspace.userId,
          action: "task.moved",
          entityType: "task",
          entityId: task.id,
          summary: `${workspace.profile?.full_name ?? "Someone"} moved ${task.title} to ${titleCase(status)}`,
        });
      }
    },
    onMutate: async ({ task, status }) => {
      const key = ["tasks", workspace?.org.id, projectId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Task[]>(key);
      queryClient.setQueryData<Task[]>(key, (old) =>
        (old ?? []).map((t) => (t.id === task.id ? { ...t, status } : t)),
      );
      return { previous, key };
    },
    onError: (error: Error, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(ctx.key, ctx.previous);
      toast.error(error.message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });

  const runInsight = useServerFn(generateInsight);
  const insight = useMutation({
    mutationFn: () =>
      runInsight({
        data: { kind: "project_summary", organizationId: workspace!.org.id, projectId },
      }),
    onSuccess: (result) => setSummary(result.text),
    onError: (error: Error) => toast.error(error.message || "Could not generate the summary."),
  });

  if (project.isLoading || tasks.isLoading) return <SkeletonCards />;
  if (project.error) return <ErrorState error={project.error} retry={() => void project.refetch()} />;
  if (!project.data) {
    return (
      <ErrorState error={new Error("This project no longer exists or you do not have access to it.")} />
    );
  }

  const memberName = (id: string | null) =>
    workspace?.members.find((m) => m.user_id === id)?.full_name ?? "Unassigned";

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/projects">
          <ArrowLeft className="size-4" /> All projects
        </Link>
      </Button>

      <PageHeader
        eyebrow={`${titleCase(project.data.status)} · due ${formatDate(project.data.deadline)}`}
        title={project.data.name}
        description={project.data.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => insight.mutate()} disabled={insight.isPending}>
              <Sparkles className="size-4" />
              {insight.isPending ? "Analysing…" : "AI summary"}
            </Button>
            {canEdit ? (
              <Button onClick={() => setCreatingIn("todo")}>
                <Plus className="size-4" /> New task
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="label-mono text-muted-foreground">Progress</p>
          <p className="mt-3 font-display text-3xl font-bold">{stats.rate}%</p>
          <Progress value={stats.rate} className="mt-3 h-1.5" />
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="label-mono text-muted-foreground">Tasks</p>
          <p className="mt-3 font-display text-3xl font-bold">{stats.total}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stats.done} complete</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="label-mono text-muted-foreground">Overdue</p>
          <p className="mt-3 font-display text-3xl font-bold">{stats.overdue}</p>
          <p className="mt-1 text-xs text-muted-foreground">Past their due date</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="label-mono text-muted-foreground">Owner</p>
          <p className="mt-3 text-sm font-semibold">{memberName(project.data.owner_id)}</p>
          <Badge variant="outline" className={`mt-2 ${priorityTone(project.data.priority)}`}>
            {titleCase(project.data.priority)} priority
          </Badge>
        </div>
      </div>

      {summary ? (
        <Panel title="Orbit AI · project summary">
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            {summary.split("\n").filter(Boolean).map((line, index) => (
              <p key={index}>{line.replace(/^[#*\-\s]+/, "")}</p>
            ))}
          </div>
        </Panel>
      ) : null}

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="mt-6">
          <KanbanBoard
            tasks={tasks.data ?? []}
            canEdit={canEdit}
            onOpenTask={setActiveTask}
            onAddTask={(status) => setCreatingIn(status)}
            onStatusChange={(task, status) => moveTask.mutate({ task, status })}
          />
        </TabsContent>
        <TabsContent value="list" className="mt-6">
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Assignee</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tasks.data ?? []).map((task) => (
                  <TableRow key={task.id} className="cursor-pointer" onClick={() => setActiveTask(task)}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusTone(task.status)}>{titleCase(task.status)}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {memberName(task.assignee_id)}
                    </TableCell>
                    <TableCell className={`label-mono text-right ${isOverdue(task) ? "text-destructive" : "text-muted-foreground"}`}>
                      {formatDate(task.due_date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <TaskDetailSheet task={activeTask} canEdit={canEdit} onOpenChange={(open) => !open && setActiveTask(null)} />

      <Dialog open={creatingIn !== null} onOpenChange={(open) => !open && setCreatingIn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (title.trim().length < 2) {
                toast.error("Task title must be at least 2 characters.");
                return;
              }
              if (dueDate) {
                const selectedDate = new Date(dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate < today) {
                  toast.error("Due date cannot be in the past.");
                  return;
                }
              }
              createTask.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={2}
                maxLength={160}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea id="task-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {(workspace?.members ?? []).map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>{m.full_name ?? m.email ?? "Teammate"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-task-due">Due date</Label>
                <Input id="new-task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Column</Label>
                <Select value={creatingIn ?? "todo"} onValueChange={(v) => setCreatingIn(v as TaskStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreatingIn(null)}>Cancel</Button>
              <Button type="submit" disabled={createTask.isPending}>{createTask.isPending ? "Creating…" : "Create task"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
