import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { DashboardMockup } from "@/components/landing/dashboard-mockup";

const stats = [
  { label: "Cycle time", value: "−38%", note: "median, 90 days" },
  { label: "Teams shipping", value: "4,120", note: "active workspaces" },
  { label: "Uptime", value: "99.98%", note: "trailing 12 months" },
];

const logos = ["Northwind", "Lumen Labs", "Vertex", "Cascade", "Helio"];

export function Hero() {
  return (
    <section id="top" className="px-4 pt-8 pb-6 sm:px-6 lg:pt-10">
      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="animate-rise">
          <p className="label-mono inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-accent-foreground">
            <span className="size-1.5 rounded-full bg-signal" aria-hidden />
            Orbit AI is live
          </p>

          <h1 className="display-xl mt-5 max-w-[16ch]">
            Project control for teams that <span className="text-signal">ship weekly.</span>
          </h1>

          <p className="mt-5 max-w-[50ch] text-base leading-7 text-muted-foreground">
            Orbit is a working surface, not a reporting layer. Plan, assign, unblock and review —
            with an AI that reads the whole workspace and tells you what is actually at risk.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-signal px-5 text-sm font-semibold text-signal-foreground shadow-[var(--shadow-plate)] transition-transform hover:-translate-y-px active:translate-y-0"
            >
              Start free
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href="#features"
              className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-5 text-sm font-medium transition-colors hover:bg-secondary"
            >
              See how it works
            </a>
          </div>

          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="label-mono text-muted-foreground">{stat.label}</dt>
                <dd className="font-display mt-1.5 text-2xl font-bold tracking-tight">
                  {stat.value}
                </dd>
                <dd className="mt-0.5 text-xs text-muted-foreground">{stat.note}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="label-mono text-muted-foreground">Acme Studio · Q3 delivery</p>
            <span className="label-mono text-signal">Live</span>
          </div>
          <div className="p-4">
            <DashboardMockup />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 border-t border-border pt-6">
        <p className="label-mono text-muted-foreground">In production at</p>
        <ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {logos.map((logo) => (
            <li key={logo} className="text-sm font-semibold tracking-tight text-muted-foreground">
              {logo}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
