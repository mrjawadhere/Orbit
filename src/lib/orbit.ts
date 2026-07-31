import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type AppPermission = Database["public"]["Enums"]["app_permission"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type ProjectStatus = Database["public"]["Enums"]["project_status"];
export type Priority = Database["public"]["Enums"]["priority_level"];
export type PlanTier = Database["public"]["Enums"]["plan_tier"];

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const TASK_STATUSES: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "Todo" },
  { id: "in_progress", label: "In progress" },
  { id: "in_review", label: "Review" },
  { id: "done", label: "Done" },
];

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "urgent", label: "Urgent" },
];

export const PROJECT_STATUSES: { id: ProjectStatus; label: string }[] = [
  { id: "planning", label: "Planning" },
  { id: "active", label: "Active" },
  { id: "on_hold", label: "On hold" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
];

export const ROLES: AppRole[] = ["owner", "admin", "manager", "member", "viewer"];

export function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function priorityTone(priority: Priority) {
  switch (priority) {
    case "urgent":
      return "text-destructive";
    case "high":
      return "text-signal";
    case "medium":
      return "text-warning";
    default:
      return "text-muted-foreground";
  }
}

export function statusTone(status: TaskStatus) {
  switch (status) {
    case "done":
      return "text-success";
    case "in_progress":
      return "text-signal";
    case "in_review":
      return "text-warning";
    default:
      return "text-muted-foreground";
  }
}

export function initials(name?: string | null, fallback = "??") {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || fallback;
}

export function isOverdue(task: { due_date: string | null; status: TaskStatus }) {
  if (!task.due_date || task.status === "done") return false;
  return new Date(task.due_date).getTime() < Date.now();
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}

export const PLAN_LIMITS: Record<PlanTier, { projects: number; members: number; storageGb: number }> =
  {
    free: { projects: 3, members: 5, storageGb: 1 },
    pro: { projects: 25, members: 25, storageGb: 50 },
    business: { projects: 100, members: 100, storageGb: 250 },
    enterprise: { projects: 1000, members: 1000, storageGb: 1000 },
  };
