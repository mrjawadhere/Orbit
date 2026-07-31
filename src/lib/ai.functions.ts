import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InsightInput = z.object({
  kind: z.enum([
    "dashboard_summary",
    "project_summary",
    "sprint_summary",
    "weekly_report",
    "productivity_insights",
    "risk_detection",
    "task_generator",
  ]),
  organizationId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  topic: z.string().max(400).optional(),
});

const PROMPTS: Record<string, string> = {
  dashboard_summary:
    "Write a concise executive summary of this workspace: momentum, risks and the two things leadership should act on today.",
  project_summary:
    "Summarise the given project: scope, current state, blockers and the next best actions.",
  sprint_summary:
    "Summarise the current sprint: what shipped, what slipped, what is at risk, and the recommended focus.",
  weekly_report:
    "Write a weekly report for stakeholders: highlights, completion trend, risks, and next week's priorities.",
  productivity_insights:
    "Analyse workload distribution and throughput. Call out imbalance, bottlenecks and concrete process improvements.",
  risk_detection:
    "Identify projects and tasks at risk (overdue, blocked, unassigned, unbalanced). Rank by severity with a mitigation each.",
  task_generator:
    "Generate a practical, ordered checklist of tasks for the requested topic. Each item: a clear title and a one-line description.",
};

export const generateInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InsightInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // RLS scopes every read below to organizations the caller belongs to.
    const [projects, tasks, members] = await Promise.all([
      supabase
        .from("projects")
        .select("id, name, status, priority, progress, deadline, is_archived")
        .eq("organization_id", data.organizationId),
      supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, assignee_id, project_id, estimated_hours")
        .eq("organization_id", data.organizationId)
        .limit(300),
      supabase
        .from("memberships")
        .select("user_id, role")
        .eq("organization_id", data.organizationId),
    ]);

    if (projects.error) throw new Error(projects.error.message);
    if (!projects.data?.length && !tasks.data?.length) {
      return { text: "There is no workspace data to analyse yet." };
    }

    const scopedTasks = data.projectId
      ? (tasks.data ?? []).filter((t) => t.project_id === data.projectId)
      : (tasks.data ?? []);

    const geminiKey = process.env.GEMINI_API_KEY;
    const lovableKey = process.env.LOVABLE_API_KEY;

    if (!geminiKey && !lovableKey) {
      throw new Error("AI is not configured. Please set GEMINI_API_KEY or LOVABLE_API_KEY in your environment.");
    }

    const { createGeminiProvider, createLovableAiGatewayProvider, GEMINI_DEFAULT_MODEL, ORBIT_MODEL } = await import("@/lib/ai-gateway.server");

    let gateway;
    let modelName;
    if (geminiKey) {
      gateway = createGeminiProvider(geminiKey);
      modelName = GEMINI_DEFAULT_MODEL;
    } else {
      gateway = createLovableAiGatewayProvider(lovableKey!);
      modelName = ORBIT_MODEL;
    }

    const context_json = JSON.stringify({
      today: new Date().toISOString().slice(0, 10),
      projects: projects.data,
      tasks: scopedTasks,
      memberCount: members.data?.length ?? 0,
      topic: data.topic ?? null,
    });

    const { text } = await generateText({
      model: gateway(modelName),
      system:
        "You are Orbit AI, an analyst embedded in a project management workspace. Be specific, quantitative and brief. Use short markdown sections and bullet points. Never invent data that is not in the provided JSON.",
      prompt: `${PROMPTS[data.kind]}\n\nWorkspace data (JSON):\n${context_json}`,
    });

    await supabase.from("ai_history").insert({
      organization_id: data.organizationId,
      user_id: userId,
      kind: data.kind,
      prompt: data.topic ?? data.kind,
      response: text,
    });

    return { text };
  });
