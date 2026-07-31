import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/app/ui-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/use-theme";
import { useWorkspace } from "@/hooks/use-workspace";
import { titleCase } from "@/lib/orbit";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Orbit" },
      { name: "description", content: "Manage your profile, workspace details, appearance and permissions." },
      { property: "og:title", content: "Settings — Orbit" },
      { property: "og:description", content: "Manage your profile, workspace and appearance in Orbit." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { workspace, can, refresh } = useWorkspace();
  const { theme, setTheme } = useTheme();
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    setFullName(workspace?.profile?.full_name ?? "");
    setJobTitle(workspace?.profile?.job_title ?? "");
    setOrgName(workspace?.org.name ?? "");
  }, [workspace]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() || null, job_title: jobTitle.trim() || null })
        .eq("id", workspace!.userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveOrg = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("organizations")
        .update({ name: orgName.trim() })
        .eq("id", workspace!.org.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Workspace updated");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace?.org.name}
        title="Settings"
        description="Your profile, workspace details and appearance preferences."
      />

      <Panel title="Profile" description="How teammates see you across Orbit">
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (fullName.trim().length < 2) {
              toast.error("Full name must be at least 2 characters.");
              return;
            }
            saveProfile.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={2}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-title">Job title</Label>
            <Input id="job-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={workspace?.profile?.email ?? ""} disabled readOnly />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="pt-1.5">
              <Badge variant="outline">{titleCase(workspace?.role ?? "member")}</Badge>
            </div>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saveProfile.isPending}>
              {saveProfile.isPending ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel title="Workspace" description="Visible to everyone in this organisation">
        <form
          className="flex flex-wrap items-end gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (orgName.trim().length < 2) {
              toast.error("Workspace name must be at least 2 characters.");
              return;
            }
            saveOrg.mutate();
          }}
        >
          <div className="min-w-64 flex-1 space-y-2">
            <Label htmlFor="org-name">Workspace name</Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={!can("manage_members")}
              required
              minLength={2}
              maxLength={120}
            />
          </div>
          <Button type="submit" disabled={!can("manage_members") || saveOrg.isPending}>
            {saveOrg.isPending ? "Saving…" : "Save workspace"}
          </Button>
        </form>
        {!can("manage_members") ? (
          <p className="mt-3 text-sm text-muted-foreground">Only owners and admins can rename the workspace.</p>
        ) : null}
      </Panel>

      <Panel title="Appearance" description="Theme preference is stored on this device">
        <div className="flex gap-2">
          {(["light", "dark"] as const).map((option) => (
            <Button
              key={option}
              variant={theme === option ? "default" : "outline"}
              onClick={() => setTheme(option)}
            >
              {titleCase(option)}
            </Button>
          ))}
        </div>
      </Panel>

      <Panel title="Your permissions" description="Granted by your role in this workspace">
        <ul className="flex flex-wrap gap-2">
          {(workspace?.permissions ?? []).map((permission) => (
            <li key={permission}>
              <Badge variant="outline">{titleCase(permission)}</Badge>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
