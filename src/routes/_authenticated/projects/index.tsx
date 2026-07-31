import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Plus } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, ErrorState, PageHeader, Panel, SkeletonCards } from "@/components/app/ui-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { logActivity, useProjects, useTasks } from "@/hooks/use-orbit-data";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  PRIORITIES,
  PROJECT_STATUSES,
  formatDate,
  priorityTone,
  titleCase,
  type Priority,
  type ProjectStatus,
} from "@/lib/orbit";

export const Route = createFileRoute("/_authenticated/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — Orbit" },
      { name: "description", content: "Every initiative in your workspace with owners, progress and deadlines." },
      { property: "og:title", content: "Projects — Orbit" },
      { property: "og:description", content: "Track initiatives, owners, progress and deadlines in Orbit." },
    ],
  }),
  component: ProjectsPage,
});

const COLORS = ["#5B5CEB", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

function NewProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const create = useMutation({
    mutationFn: async () => {
      if (!workspace) throw new Error("Workspace not ready");
      const { data, error } = await supabase
        .from("projects")
        .insert({
          organization_id: workspace.org.id,
          owner_id: workspace.userId,
          name: name.trim(),
          description: description.trim() || null,
          priority,
          status,
          color,
          deadline: deadline || null,
        })
        .select("id, name")
        .single();
      if (error) throw error;
      await logActivity({
        orgId: workspace.org.id,
        actorId: workspace.userId,
        action: "project.created",
        entityType: "project",
        entityId: data.id,
        summary: `${workspace.profile?.full_name ?? "Someone"} created project ${data.name}`,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Project created");
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
      setName("");
      setDescription("");
      setDeadline("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>Projects group tasks, owners and delivery timelines.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim().length < 2) {
              toast.error("Project name must be at least 2 characters.");
              return;
            }
            if (deadline) {
              const selectedDate = new Date(deadline);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (selectedDate < today) {
                toast.error("Deadline cannot be in the past.");
                return;
              }
            }
            create.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-desc">Description</Label>
            <Textarea id="project-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={600} />
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
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-deadline">Deadline</Label>
              <Input id="project-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Colour</Label>
              <div className="flex items-center gap-2 pt-1.5">
                {COLORS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Colour ${value}`}
                    aria-pressed={color === value}
                    onClick={() => setColor(value)}
                    className={`size-6 rounded-md border-2 ${color === value ? "border-foreground" : "border-transparent"}`}
                    style={{ backgroundColor: value }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create project"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectsPage() {
  const { can, workspace } = useWorkspace();
  const projects = useProjects();
  const tasks = useTasks();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");

  const counts = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const task of tasks.data ?? []) {
      const entry = map.get(task.project_id) ?? { total: 0, done: 0 };
      entry.total += 1;
      if (task.status === "done") entry.done += 1;
      map.set(task.project_id, entry);
    }
    return map;
  }, [tasks.data]);

  const visible = (projects.data ?? []).filter((p) => filter === "all" || p.status === filter);

  if (projects.isLoading) return <SkeletonCards />;
  if (projects.error) return <ErrorState error={projects.error} retry={() => void projects.refetch()} />;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace?.org.name}
        title="Projects"
        description="Every initiative, its owner, progress and delivery date."
        actions={
          can("create_project") ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" /> New project
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap gap-2">
        {(["all", ...PROJECT_STATUSES.map((s) => s.id)] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value as "all" | ProjectStatus)}
          >
            {value === "all" ? "All" : titleCase(value)}
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects here"
          description="Create a project to start planning work and tracking delivery."
          action={can("create_project") ? <Button onClick={() => setOpen(true)}><Plus className="size-4" /> New project</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((project) => {
            const count = counts.get(project.id) ?? { total: 0, done: 0 };
            const owner = workspace?.members.find((m) => m.user_id === project.owner_id);
            return (
              <Link
                key={project.id}
                to="/projects/$projectId"
                params={{ projectId: project.id }}
                className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-sm" style={{ backgroundColor: project.color }} aria-hidden="true" />
                    <h2 className="font-display text-base font-semibold tracking-tight">{project.name}</h2>
                  </div>
                  <Badge variant="outline" className={priorityTone(project.priority)}>{titleCase(project.priority)}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                  {project.description ?? "No description yet."}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Progress value={project.progress} className="h-1.5" />
                  <span className="label-mono text-muted-foreground">{project.progress}%</span>
                </div>
                <dl className="label-mono mt-4 flex items-center justify-between text-muted-foreground">
                  <div>{count.done}/{count.total} tasks</div>
                  <div>{titleCase(project.status)}</div>
                  <div>{formatDate(project.deadline)}</div>
                </dl>
                <p className="label-mono mt-3 border-t border-border pt-3 text-muted-foreground">
                  Owner · {owner?.full_name ?? "Unassigned"}
                </p>
              </Link>
            );
          })}
        </div>
      )}

      <NewProjectDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
