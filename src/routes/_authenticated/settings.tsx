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
  const [geminiKey, setGeminiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setFullName(workspace?.profile?.full_name ?? "");
    setJobTitle(workspace?.profile?.job_title ?? "");
    setOrgName(workspace?.org.name ?? "");
    if (typeof window !== "undefined") {
      setGeminiKey(window.localStorage.getItem("orbit_gemini_api_key") ?? "");
    }
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

      <Panel title="AI & Gemini API Key" description="Configure your Google Gemini API key to enable workspace summaries, risk analysis, and task generation.">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <p className="text-sm font-medium">API Key Status</p>
              <p className="text-xs text-muted-foreground">
                {geminiKey.trim() ? "Custom key configured on this browser" : "Using system default key if configured"}
              </p>
            </div>
            <Badge variant={geminiKey.trim() ? "default" : "outline"}>
              {geminiKey.trim() ? "Custom Key Active" : "Default / Unconfigured"}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gemini-key">Google Gemini API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                id="gemini-key"
                type={showKey ? "text" : "password"}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Enter your Gemini API key (e.g. AIzaSy...)"
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? "Hide" : "Show"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Don't have a key? You can get a free API key at{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                Google AI Studio
              </a>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              onClick={() => {
                if (!geminiKey.trim()) {
                  toast.error("Please enter an API key first.");
                  return;
                }
                window.localStorage.setItem("orbit_gemini_api_key", geminiKey.trim());
                toast.success("Gemini API key saved to browser.");
              }}
            >
              Save API Key
            </Button>
            {geminiKey ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.localStorage.removeItem("orbit_gemini_api_key");
                  setGeminiKey("");
                  toast.success("Gemini API key removed.");
                }}
              >
                Remove Key
              </Button>
            ) : null}
          </div>
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
