import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { EmptyState, ErrorState, PageHeader, SkeletonCards } from "@/components/app/ui-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProjects, useTasks } from "@/hooks/use-orbit-data";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  TASK_STATUSES,
  formatDate,
  isOverdue,
  priorityTone,
  statusTone,
  titleCase,
  type TaskStatus,
} from "@/lib/orbit";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "My tasks — Orbit" },
      { name: "description", content: "Your assigned work across every project, sorted by urgency." },
      { property: "og:title", content: "My tasks — Orbit" },
      { property: "og:description", content: "Your assigned work across every Orbit project." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { workspace } = useWorkspace();
  const tasks = useTasks();
  const projects = useProjects({ includeArchived: true });
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [status, setStatus] = useState<"all" | TaskStatus>("all");
  const [query, setQuery] = useState("");

  const projectName = useMemo(
    () => new Map((projects.data ?? []).map((p) => [p.id, p])),
    [projects.data],
  );

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (tasks.data ?? [])
      .filter((t) => (scope === "mine" ? t.assignee_id === workspace?.userId : true))
      .filter((t) => (status === "all" ? true : t.status === status))
      .filter((t) => (term ? t.title.toLowerCase().includes(term) : true))
      .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
  }, [tasks.data, scope, status, query, workspace?.userId]);

  if (tasks.isLoading) return <SkeletonCards />;
  if (tasks.error) return <ErrorState error={tasks.error} retry={() => void tasks.refetch()} />;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace?.org.name}
        title="My tasks"
        description="Everything on your plate, ordered by due date."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={scope === "mine" ? "default" : "outline"} onClick={() => setScope("mine")}>
          Assigned to me
        </Button>
        <Button size="sm" variant={scope === "all" ? "default" : "outline"} onClick={() => setScope("all")}>
          All tasks
        </Button>
        <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
        {(["all", ...TASK_STATUSES.map((s) => s.id)] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={status === value ? "default" : "ghost"}
            onClick={() => setStatus(value as "all" | TaskStatus)}
          >
            {value === "all" ? "All" : titleCase(value)}
          </Button>
        ))}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by title…"
          aria-label="Filter tasks by title"
          className="ml-auto h-9 w-full sm:w-64"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No matching tasks" description="Try a different filter or scope." />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead className="hidden md:table-cell">Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Priority</TableHead>
                <TableHead className="text-right">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((task) => {
                const project = projectName.get(task.project_id);
                return (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      <Link to="/projects/$projectId" params={{ projectId: task.project_id }} className="hover:underline">
                        {task.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {project?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusTone(task.status)}>{titleCase(task.status)}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className={priorityTone(task.priority)}>{titleCase(task.priority)}</Badge>
                    </TableCell>
                    <TableCell className={`label-mono text-right ${isOverdue(task) ? "text-destructive" : "text-muted-foreground"}`}>
                      {formatDate(task.due_date)}
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
