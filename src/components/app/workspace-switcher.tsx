import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { titleCase } from "@/lib/orbit";
import type { PlanTier } from "@/lib/orbit";

const PLANS: PlanTier[] = ["free", "pro", "business", "enterprise"];

export function WorkspaceSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const { workspace, switchOrg } = useWorkspace();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<PlanTier>("free");
  const [seed, setSeed] = useState(true);
  const [saving, setSaving] = useState(false);

  if (!workspace) return null;

  async function createOrganization() {
    if (name.trim().length < 2) {
      toast.error("Give the workspace a name of at least 2 characters.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.rpc("create_organization", {
      _name: name.trim(),
      _plan: plan,
      _seed_demo: seed,
    });
    setSaving(false);

    if (error) {
      toast.error(`Could not create the workspace: ${error.message}`);
      return;
    }

    await queryClient.invalidateQueries();
    switchOrg(data as string);
    setOpen(false);
    setName("");
    toast.success(`Switched to ${name.trim()}`);
    onNavigate?.();
  }

  return (
    <div className="border-b border-border p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-accent/50"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{workspace.org.name}</span>
              <span className="label-mono block text-muted-foreground">
                {workspace.org.plan} · {titleCase(workspace.role)}
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Your workspaces</DropdownMenuLabel>
          {workspace.organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onSelect={() => {
                if (org.id !== workspace.org.id) switchOrg(org.id);
                onNavigate?.();
              }}
            >
              <Check
                className={org.id === workspace.org.id ? "size-4 opacity-100" : "size-4 opacity-0"}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate">{org.name}</span>
              <span className="label-mono text-muted-foreground">{org.plan}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Create workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a workspace</DialogTitle>
            <DialogDescription>
              You become the owner. Your existing workspaces stay exactly as they are.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Workspace name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Northwind Labs"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-plan">Plan</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as PlanTier)}>
                <SelectTrigger id="org-plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {titleCase(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Add sample projects and tasks</p>
                <p className="text-xs text-muted-foreground">
                  Useful for testing. Turn this off to start with an empty workspace.
                </p>
              </div>
              <Switch checked={seed} onCheckedChange={setSeed} aria-label="Add sample data" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void createOrganization()} disabled={saving}>
              {saving ? "Creating…" : "Create workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
