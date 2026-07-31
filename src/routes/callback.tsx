import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — Orbit" },
      { name: "description", content: "Completing your secure Orbit sign-in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;

    const finish = (authed: boolean) => {
      if (done) return;
      done = true;
      navigate({ to: authed ? "/dashboard" : "/auth", replace: true });
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish(true);
    });

    const timeout = window.setTimeout(() => finish(false), 6000);

    return () => {
      window.clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </main>
  );
}
