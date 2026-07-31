import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarClock,
  ListChecks,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/app/ui-states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { generateInsight } from "@/lib/ai.functions";
import { formatRelative, titleCase } from "@/lib/orbit";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({
    meta: [
      { title: "AI workspace — Orbit" },
      { name: "description", content: "Sprint summaries, risk detection, weekly reports and task generation powered by AI." },
      { property: "og:title", content: "AI workspace — Orbit" },
      { property: "og:description", content: "Sprint summaries, risk detection and task generation, grounded in your data." },
    ],
  }),
  component: AiPage,
});

type Kind = "sprint_summary" | "risk_detection" | "weekly_report" | "productivity_insights" | "task_generator";

const TOOLS: { kind: Kind; title: string; description: string; icon: typeof Sparkles }[] = [
  { kind: "sprint_summary", title: "Sprint summary", description: "What shipped, what slipped, what to focus on.", icon: CalendarClock },
  { kind: "risk_detection", title: "Risk detection", description: "Overdue, blocked and unassigned work ranked by severity.", icon: TriangleAlert },
  { kind: "weekly_report", title: "Weekly report", description: "Stakeholder-ready recap of the week.", icon: TrendingUp },
  { kind: "productivity_insights", title: "Productivity insights", description: "Workload balance and process bottlenecks.", icon: Sparkles },
  { kind: "task_generator", title: "Task generator", description: "Turn a goal into an ordered task checklist.", icon: ListChecks },
];

function AiPage() {
  const { workspace } = useWorkspace();
  const orgId = workspace?.org.id;
  const [active, setActive] = useState<Kind>("sprint_summary");
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const history = useQuery({
    queryKey: ["ai-history", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_history")
        .select("id, kind, prompt, response, created_at")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const runInsight = useServerFn(generateInsight);
  const run = useMutation({
    mutationFn: (kind: Kind) =>
      runInsight({
        data: {
          kind,
          organizationId: orgId!,
          ...(kind === "task_generator" && topic.trim() ? { topic: topic.trim() } : {}),
        },
      }),
    onSuccess: (data) => {
      setResult(data.text);
      void history.refetch();
    },
    onError: (error: Error) => toast.error(error.message || "AI request failed."),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace?.org.name}
        title="AI workspace"
        description="Every answer is grounded in your live projects, tasks and team — nothing is invented."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TOOLS.map((tool) => (
          <button
            key={tool.kind}
            type="button"
            onClick={() => {
              setActive(tool.kind);
              if (tool.kind !== "task_generator") run.mutate(tool.kind);
            }}
            aria-pressed={active === tool.kind}
            className={`rounded-lg border p-5 text-left transition-colors ${
              active === tool.kind ? "border-foreground/40 bg-accent/40" : "border-border bg-card hover:border-foreground/25"
            }`}
          >
            <tool.icon className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 font-display text-sm font-semibold">{tool.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
          </button>
        ))}
      </div>

      {active === "task_generator" ? (
        <Panel title="Task generator" description="Describe the goal and Orbit will draft the work breakdown.">
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (topic.trim()) run.mutate("task_generator");
            }}
          >
            <Textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Launch the billing revamp for enterprise customers"
              aria-label="Goal for task generation"
              maxLength={400}
            />
            <Button type="submit" disabled={!topic.trim() || run.isPending}>
              <Sparkles className="size-4" />
              {run.isPending ? "Generating…" : "Generate tasks"}
            </Button>
          </form>
        </Panel>
      ) : null}

      <Panel title="Result" description={run.isPending ? "Orbit AI is analysing your workspace…" : undefined}>
        {run.isPending ? (
          <div className="space-y-2" aria-live="polite">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${90 - i * 12}%` }} />
            ))}
          </div>
        ) : result ? (
          <div className="space-y-2 text-sm leading-relaxed">
            {result.split("\n").filter(Boolean).map((line, index) => (
              <p key={index} className={line.startsWith("#") ? "font-display font-semibold" : "text-muted-foreground"}>
                {line.replace(/^[#*\s]+/, "")}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Pick a tool above to generate an insight.</p>
        )}
      </Panel>

      <Panel title="History" description="Recent AI runs in this workspace" bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {(history.data ?? []).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setResult(item.response ?? "")}
                className="w-full px-5 py-3 text-left hover:bg-accent/50"
              >
                <p className="text-sm font-medium">{titleCase(item.kind)}</p>
                <p className="line-clamp-1 text-sm text-muted-foreground">{item.response ?? item.prompt}</p>
                <p className="label-mono mt-1 text-muted-foreground">{formatRelative(item.created_at)}</p>
              </button>
            </li>
          ))}
          {history.data?.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-muted-foreground">No AI runs yet.</li>
          ) : null}
        </ul>
      </Panel>
    </div>
  );
}
