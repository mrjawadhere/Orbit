import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  CheckSquare,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useProjects, useTasks } from "@/hooks/use-orbit-data";
import { useWorkspace } from "@/hooks/use-workspace";
import { initials } from "@/lib/orbit";

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { open, setOpen };
}

const PAGES = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  { label: "My tasks", to: "/tasks", icon: CheckSquare },
  { label: "Team", to: "/team", icon: Users },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "AI workspace", to: "/ai", icon: Sparkles },
  { label: "Activity", to: "/activity", icon: Bell },
  { label: "Billing", to: "/billing", icon: CreditCard },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();

  const recentTasks = useMemo(() => (tasks ?? []).slice(0, 8), [tasks]);

  function go(to: string) {
    onOpenChange(false);
    void navigate({ to });
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>

      <CommandInput placeholder="Search projects, tasks, people…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Go to">
          {PAGES.map((page) => (
            <CommandItem key={page.to} value={`go ${page.label}`} onSelect={() => go(page.to)}>
              <page.icon className="size-4" />
              {page.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {projects?.length ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.slice(0, 8).map((project) => (
                <CommandItem
                  key={project.id}
                  value={`project ${project.name}`}
                  onSelect={() => go(`/projects/${project.id}`)}
                >
                  <span
                    className="size-2.5 rounded-sm"
                    style={{ backgroundColor: project.color }}
                    aria-hidden="true"
                  />
                  {project.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        {recentTasks.length ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tasks">
              {recentTasks.map((task) => (
                <CommandItem
                  key={task.id}
                  value={`task ${task.title}`}
                  onSelect={() => go(`/projects/${task.project_id}`)}
                >
                  <CheckSquare className="size-4" />
                  <span className="truncate">{task.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        {workspace?.members.length ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="People">
              {workspace.members.slice(0, 8).map((member) => (
                <CommandItem
                  key={member.user_id}
                  value={`member ${member.full_name ?? member.email ?? ""}`}
                  onSelect={() => go("/team")}
                >
                  <span className="label-mono flex size-5 items-center justify-center rounded-sm bg-muted text-[10px]">
                    {initials(member.full_name ?? member.email)}
                  </span>
                  {member.full_name ?? member.email ?? "Teammate"}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
