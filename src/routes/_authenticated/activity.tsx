import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, ErrorState, PageHeader, Panel, SkeletonCards } from "@/components/app/ui-states";
import { useActivity } from "@/hooks/use-orbit-data";
import { useWorkspace } from "@/hooks/use-workspace";
import { formatRelative, initials, titleCase } from "@/lib/orbit";

export const Route = createFileRoute("/_authenticated/activity")({
  head: () => ({
    meta: [
      { title: "Activity — Orbit" },
      { name: "description", content: "A complete audit trail of everything that changed in your workspace." },
      { property: "og:title", content: "Activity — Orbit" },
      { property: "og:description", content: "A complete audit trail of workspace changes." },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const { workspace } = useWorkspace();
  const activity = useActivity(100);

  if (activity.isLoading) return <SkeletonCards />;
  if (activity.error) return <ErrorState error={activity.error} retry={() => void activity.refetch()} />;

  const memberName = (id: string | null) =>
    workspace?.members.find((m) => m.user_id === id)?.full_name ?? "Someone";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace?.org.name}
        title="Activity"
        description="Every project, task and membership change, newest first."
      />

      <Panel bodyClassName="p-0">
        {activity.data?.length ? (
          <ul className="divide-y divide-border">
            {activity.data.map((item) => (
              <li key={item.id} className="flex items-start gap-3 px-5 py-4">
                <span className="label-mono mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[10px]">
                  {initials(memberName(item.actor_id))}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{item.summary}</p>
                  <p className="label-mono mt-0.5 text-muted-foreground">
                    {titleCase(item.entity_type)} · {item.action} · {formatRelative(item.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No activity yet" description="Changes across the workspace will show up here." />
        )}
      </Panel>
    </div>
  );
}
