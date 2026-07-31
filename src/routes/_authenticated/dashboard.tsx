import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FolderKanban,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState, ErrorState, PageHeader, Panel, SkeletonCards } from "@/components/app/ui-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useActivity, useProjects, useTasks } from "@/hooks/use-orbit-data";
import { useWorkspace } from "@/hooks/use-workspace";
import { generateInsight } from "@/lib/ai.functions";
import {
  formatDate,
  formatRelative,
  initials,
  isOverdue,
  priorityTone,
  statusTone,
  titleCase,
} from "@/lib/orbit";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Orbit" },
      { name: "description", content: "Workspace momentum, delivery risk and AI insights at a glance." },
      { property: "og:title", content: "Dashboard — Orbit" },
      { property: "og:description", content: "Workspace momentum, delivery risk and AI insights." },
    ],
  }),
  component: DashboardPage,
});

function Metric({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Clock;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="label-mono text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function DashboardPage() {
  const { workspace, isLoading: workspaceLoading } = useWorkspace();
  const projects = useProjects();
  const tasks = useTasks();
  const activity = useActivity(8);
  const orgId = workspace?.org.id;

  const latestInsight = useQuery({
    queryKey: ["ai-history", orgId, "dashboard_summary"],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_history")
        .select("response, created_at")
        .eq("organization_id", orgId!)
        .eq("kind", "dashboard_summary")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const runInsight = useServerFn(generateInsight);
  const insight = useMutation({
    mutationFn: () => runInsight({ data: { kind: "dashboard_summary", organizationId: orgId! } }),
    onSuccess: () => void latestInsight.refetch(),
    onError: (error: Error) => toast.error(error.message || "Could not generate the summary."),
  });

  const stats = useMemo(() => {
    const all = tasks.data ?? [];
    const done = all.filter((t) => t.status === "done").length;
    const overdue = all.filter((t) => isOverdue(t)).length;
    const active = (projects.data ?? []).filter((p) => p.status === "active").length;
    const rate = all.length ? Math.round((done / all.length) * 100) : 0;
    return { total: all.length, done, overdue, active, rate };
  }, [tasks.data, projects.data]);

  const myTasks = useMemo(
    () =>
      (tasks.data ?? [])
        .filter((t) => t.assignee_id === workspace?.userId && t.status !== "done")
        .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
        .slice(0, 6),
    [tasks.data, workspace?.userId],
  );

  const memberName = (id: string | null) =>
    workspace?.members.find((m) => m.user_id === id)?.full_name ?? "Someone";

  if (workspaceLoading || projects.isLoading || tasks.isLoading) return <SkeletonCards />;
  if (projects.error) return <ErrorState error={projects.error} retry={() => void projects.refetch()} />;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace?.org.name}
        title={`Welcome back, ${(workspace?.profile?.full_name ?? "there").split(" ")[0]}`}
        description="Delivery health, workload and AI insight across the whole workspace."
        actions={
          <Button asChild>
            <Link to="/projects">
              Open projects <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active projects" value={String(stats.active)} hint={`${projects.data?.length ?? 0} total`} icon={FolderKanban} />
        <Metric label="Completion rate" value={`${stats.rate}%`} hint={`${stats.done} of ${stats.total} tasks done`} icon={CheckCircle2} />
        <Metric label="Open tasks" value={String(stats.total - stats.done)} hint="Across all projects" icon={Clock} />
        <Metric label="Overdue" value={String(stats.overdue)} hint="Needs attention today" icon={TriangleAlert} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Projects"
          description="Progress across every active initiative"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/projects">View all</Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          {projects.data?.length ? (
            <ul className="divide-y divide-border">
              {projects.data.slice(0, 6).map((project) => (
                <li key={project.id}>
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: project.id }}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-accent/50"
                  >
                    <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: project.color }} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{project.name}</span>
                      <span className="label-mono text-muted-foreground">
                        {titleCase(project.status)} · due {formatDate(project.deadline)}
                      </span>
                    </span>
                    <span className="hidden w-40 items-center gap-2 sm:flex">
                      <Progress value={project.progress} className="h-1.5" />
                      <span className="label-mono w-8 text-right text-muted-foreground">{project.progress}%</span>
                    </span>
                    <Badge variant="outline" className={priorityTone(project.priority)}>
                      {titleCase(project.priority)}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No projects yet" description="Create your first project to start tracking delivery." />
          )}
        </Panel>

        <Panel
          title="Orbit AI"
          description="Executive summary of this workspace"
          actions={
            <Button size="sm" variant="outline" disabled={insight.isPending} onClick={() => insight.mutate()}>
              <Sparkles className="size-3.5" />
              {insight.isPending ? "Thinking…" : "Generate"}
            </Button>
          }
        >
          {latestInsight.data?.response ? (
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {latestInsight.data.response
                .split("\n")
                .filter(Boolean)
                .slice(0, 12)
                .map((line, index) => (
                  <p key={index}>{line.replace(/^[#*\-\s]+/, "")}</p>
                ))}
              <p className="label-mono pt-2 text-muted-foreground">
                Updated {formatRelative(latestInsight.data.created_at)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Generate an AI summary to see momentum, risks and recommended actions for this workspace.
            </p>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="My tasks" description="Assigned to you, soonest first" bodyClassName="p-0">
          {myTasks.length ? (
            <ul className="divide-y divide-border">
              {myTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3 px-5 py-3">
                  <Badge variant="outline" className={statusTone(task.status)}>
                    {titleCase(task.status)}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
                  <span className={`label-mono ${isOverdue(task) ? "text-destructive" : "text-muted-foreground"}`}>
                    {formatDate(task.due_date)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing assigned" description="You have no open tasks. Enjoy the calm." />
          )}
        </Panel>

        <Panel title="Recent activity" description="What changed across the workspace" bodyClassName="p-0">
          {activity.data?.length ? (
            <ul className="divide-y divide-border">
              {activity.data.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-5 py-3">
                  <span className="label-mono mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px]">
                    {initials(memberName(item.actor_id))}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm">{item.summary}</span>
                    <span className="label-mono text-muted-foreground">{formatRelative(item.created_at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No activity yet" description="Actions across the workspace will appear here." />
          )}
        </Panel>
      </div>
    </div>
  );
}
