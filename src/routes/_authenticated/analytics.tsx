import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ErrorState, PageHeader, Panel, SkeletonCards } from "@/components/app/ui-states";
import { supabase } from "@/integrations/supabase/client";
import { useProjects, useTasks } from "@/hooks/use-orbit-data";
import { useWorkspace } from "@/hooks/use-workspace";
import { TASK_STATUSES, initials, titleCase } from "@/lib/orbit";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Orbit" },
      { name: "description", content: "Throughput, completion rate, workload balance and delivery trends." },
      { property: "og:title", content: "Analytics — Orbit" },
      { property: "og:description", content: "Throughput, completion rate and workload balance in Orbit." },
    ],
  }),
  component: AnalyticsPage,
});

const PALETTE = ["#5B5CEB", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444"];

function AnalyticsPage() {
  const { workspace } = useWorkspace();
  const orgId = workspace?.org.id;
  const tasks = useTasks();
  const projects = useProjects();

  const snapshots = useQuery({
    queryKey: ["analytics", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_snapshots")
        .select("captured_on, tasks_created, tasks_completed, completion_rate, active_projects")
        .eq("organization_id", orgId!)
        .order("captured_on", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const statusData = useMemo(
    () =>
      TASK_STATUSES.map((status) => ({
        name: status.label,
        value: (tasks.data ?? []).filter((t) => t.status === status.id).length,
      })),
    [tasks.data],
  );

  const workloadData = useMemo(
    () =>
      (workspace?.members ?? []).map((member) => ({
        name: initials(member.full_name ?? member.email),
        open: (tasks.data ?? []).filter((t) => t.assignee_id === member.user_id && t.status !== "done").length,
        done: (tasks.data ?? []).filter((t) => t.assignee_id === member.user_id && t.status === "done").length,
      })),
    [workspace?.members, tasks.data],
  );

  const trend = useMemo(
    () =>
      (snapshots.data ?? []).map((row) => ({
        date: row.captured_on.slice(5),
        created: row.tasks_created,
        completed: row.tasks_completed,
        rate: Math.round(Number(row.completion_rate)),
      })),
    [snapshots.data],
  );

  if (tasks.isLoading || snapshots.isLoading) return <SkeletonCards />;
  if (snapshots.error) return <ErrorState error={snapshots.error} retry={() => void snapshots.refetch()} />;

  const latest = trend.at(-1);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace?.org.name}
        title="Analytics"
        description="Delivery throughput, completion trend and workload balance over the last 30 days."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Completion rate", value: `${latest?.rate ?? 0}%` },
          { label: "Tasks completed", value: String(trend.reduce((sum, t) => sum + t.completed, 0)) },
          { label: "Tasks created", value: String(trend.reduce((sum, t) => sum + t.created, 0)) },
          { label: "Active projects", value: String((projects.data ?? []).filter((p) => p.status === "active").length) },
        ].map((metric) => (
          <div key={metric.label} className="rounded-lg border border-border bg-card p-5">
            <p className="label-mono text-muted-foreground">{metric.label}</p>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight">{metric.value}</p>
          </div>
        ))}
      </div>

      <Panel title="Throughput" description="Tasks created vs completed per day">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="created" stroke="#0EA5E9" fill="#0EA5E933" strokeWidth={2} />
              <Area type="monotone" dataKey="completed" stroke="#5B5CEB" fill="#5B5CEB33" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Task distribution" description="Where work currently sits">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-2">
            {statusData.map((entry, index) => (
              <li key={entry.name} className="label-mono flex items-center gap-2 text-muted-foreground">
                <span className="size-2 rounded-sm" style={{ backgroundColor: PALETTE[index % PALETTE.length] }} />
                {entry.name} · {entry.value}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Workload balance" description="Open vs completed tasks per teammate">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} stroke="currentColor" allowDecimals={false} className="text-muted-foreground" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="open" fill="#5B5CEB" radius={[3, 3, 0, 0]} />
                <Bar dataKey="done" fill="#10B981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Project progress" description="Completion by initiative" bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {(projects.data ?? []).map((project) => (
            <li key={project.id} className="flex items-center gap-4 px-5 py-3">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: project.color }} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{project.name}</span>
              <span className="label-mono text-muted-foreground">{titleCase(project.status)}</span>
              <span className="w-40">
                <span className="block h-1.5 rounded-full bg-muted">
                  <span className="block h-1.5 rounded-full bg-foreground" style={{ width: `${project.progress}%` }} />
                </span>
              </span>
              <span className="label-mono w-10 text-right text-muted-foreground">{project.progress}%</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
