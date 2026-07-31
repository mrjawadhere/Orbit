import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  CheckSquare,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";

import { CommandPalette, useCommandPalette } from "@/components/app/command-palette";
import { NotificationBell } from "@/components/app/notifications";
import { WorkspaceSwitcher } from "@/components/app/workspace-switcher";
import { OrbitLogo } from "@/components/orbit/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/use-theme";
import { useWorkspace } from "@/hooks/use-workspace";
import { initials } from "@/lib/orbit";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  { label: "My tasks", to: "/tasks", icon: CheckSquare },
  { label: "Team", to: "/team", icon: Users },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "AI workspace", to: "/ai", icon: Sparkles },
  { label: "Activity", to: "/activity", icon: Activity },
] as const;

const NAV_SECONDARY = [
  { label: "Billing", to: "/billing", icon: CreditCard },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const render = (items: readonly { label: string; to: string; icon: typeof Activity }[]) =>
    items.map((item) => {
      const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
      return (
        <li key={item.to}>
          <Link
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        </li>
      );
    });

  return (
    <nav aria-label="Workspace" className="flex flex-1 flex-col gap-6 px-3 py-4">
      <ul className="space-y-1">{render(NAV)}</ul>
      <div>
        <p className="label-mono px-3 pb-2 text-muted-foreground">Workspace</p>
        <ul className="space-y-1">{render(NAV_SECONDARY)}</ul>
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const palette = useCommandPalette();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  const displayName = workspace?.profile?.full_name ?? workspace?.profile?.email ?? "Account";

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-border px-4">
          <Link to="/dashboard" aria-label="Orbit dashboard">
            <OrbitLogo />
          </Link>
        </div>
        <WorkspaceSwitcher />
        <NavList />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-16 items-center border-b border-border px-4">
                <OrbitLogo />
              </div>
              <WorkspaceSwitcher onNavigate={() => setMobileOpen(false)} />
              <NavList onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <button
            type="button"
            onClick={() => palette.setOpen(true)}
            className="flex h-9 flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-accent/50 sm:max-w-sm"
          >
            <Search className="size-4" aria-hidden="true" />
            <span className="flex-1 text-left">Search Orbit…</span>
            <kbd className="label-mono hidden rounded border border-border px-1.5 py-0.5 text-[10px] sm:inline">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <span className="label-mono flex size-7 items-center justify-center rounded-md bg-ink text-[11px] text-ink-foreground">
                    {initials(displayName)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">Profile & settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/billing">Billing</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void signOut()}>
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </div>
  );
}
