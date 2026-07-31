import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { OrbitLogo } from "@/components/orbit/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

type Mode = "signin" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in to Orbit — Workspace access" },
      {
        name: "description",
        content:
          "Sign in or create your Orbit account to plan projects, track work and unlock AI insights for your team.",
      },
      { property: "og:title", content: "Sign in to Orbit" },
      {
        property: "og:description",
        content: "Access your Orbit workspace: projects, tasks, analytics and AI insights.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.55Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.11 0 5.72-1.03 7.62-2.8l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.74H1.7v2.98A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.55 14.67a7.2 7.2 0 0 1 0-4.6V7.09H1.7a12 12 0 0 0 0 10.56l3.85-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.69 0 3.2.58 4.4 1.72l3.29-3.29C17.71 1.2 15.1 0 12 0 7.36 0 3.35 2.66 1.7 7.09l3.85 2.98C6.46 7.35 9 4.75 12 4.75Z"
      />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/dashboard", replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back to Orbit");
        navigate({ to: "/dashboard", replace: true });
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/callback`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your inbox", {
            description: `We sent a confirmation link to ${email}.`,
          });
          setMode("signin");
          return;
        }
        toast.success("Account created — setting up your workspace");
        navigate({ to: "/dashboard", replace: true });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent", { description: `Check ${email}` });
      setMode("signin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/callback`,
    });

    if (result.error) {
      setBusy(false);
      toast.error(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;

    navigate({ to: "/dashboard", replace: true });
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const copy = {
    signin: { title: "Welcome back", sub: "Sign in to your Orbit workspace.", cta: "Sign in" },
    signup: {
      title: "Create your workspace",
      sub: "Start planning with Orbit in under a minute.",
      cta: "Create account",
    },
    forgot: {
      title: "Reset your password",
      sub: "We'll email you a secure reset link.",
      cta: "Send reset link",
    },
  }[mode];

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]"
      />

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-2xl backdrop-blur-xl">
          <OrbitLogo className="h-8" />

          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-foreground">
            {copy.title}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{copy.sub}</p>

          {mode !== "forgot" && (
            <>
              <Button
                type="button"
                variant="outline"
                className="mt-6 w-full gap-2"
                onClick={handleGoogle}
                disabled={busy}
              >
                <GoogleIcon />
                Continue with Google
              </Button>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-widest text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className={mode === "forgot" ? "mt-6 space-y-4" : "space-y-4"}>
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "forgot" ? (
                <Mail className="h-4 w-4" />
              ) : null}
              {copy.cta}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="text-primary hover:underline">
                  Sign in
                </button>
              </>
            ) : mode === "forgot" ? (
              <>
                Remembered it?{" "}
                <button onClick={() => setMode("signin")} className="text-primary hover:underline">
                  Back to sign in
                </button>
              </>
            ) : (
              <>
                New to Orbit?{" "}
                <button onClick={() => setMode("signup")} className="text-primary hover:underline">
                  Create an account
                </button>
              </>
            )}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Protected by enterprise-grade security. SOC 2 ready infrastructure.
        </p>
      </div>
    </main>
  );
}
