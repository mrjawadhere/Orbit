import {
  AlertTriangle,
  Boxes,
  GitBranch,
  Kanban,
  Lock,
  Radar,
  Timer,
  Users,
} from "lucide-react";

const features = [
  {
    title: "Boards that hold real work",
    body: "Kanban, list and timeline over one task model. Sub-tasks, dependencies, estimates and WIP limits — no duplicated state between views.",
    icon: Kanban,
  },
  {
    title: "Roles enforced in the database",
    body: "Owner, admin, manager, member, guest. Permissions run as row-level policies, not client-side checks.",
    icon: Lock,
  },
  {
    title: "Dependencies that speak up",
    body: "Blockers surface upstream the moment a date moves, with the affected owners attached.",
    icon: GitBranch,
  },
  {
    title: "Multi-tenant by default",
    body: "One account, many organisations. Isolation is structural, and every workspace carries its own billing, seats and audit trail.",
    icon: Boxes,
  },
];

export function SectionHead({
  kicker,
  title,
  lede,
}: {
  kicker: string;
  title: string;
  lede: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="label-mono text-signal">{kicker}</p>
      <h2 className="display-lg mt-3">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{lede}</p>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          kicker="Product"
          title="Built for the week, not the quarterly review"
          lede="Every surface in Orbit is designed to be used daily by the people doing the work — planners get their rollups as a by-product."
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <article key={f.title} className="surface surface-hover p-5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-signal">
                <f.icon className="size-4.5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-bold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const aiRows = [
  {
    signal: "Risk",
    text: "Mobile Redesign will miss 12 Sep. Two blockers sit with an out-of-office assignee.",
    tone: "danger" as const,
  },
  {
    signal: "Load",
    text: "Priya is at 143% of capacity this sprint; Marcus has 11 open points of headroom.",
    tone: "warn" as const,
  },
  {
    signal: "Ready",
    text: "SCIM provisioning cleared review 3 days early — safe to pull the next enterprise item.",
    tone: "ok" as const,
  },
];

const toneDot = {
  danger: "bg-destructive",
  warn: "bg-warning",
  ok: "bg-success",
};

const toneLabel = {
  danger: "text-destructive",
  warn: "text-warning",
  ok: "text-success",
};

export function AIFeatures() {
  return (
    <section id="ai" className="px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-2 lg:gap-10">
        <div>
          <SectionHead
            kicker="Orbit AI"
            title="It reads the workspace, not the prompt"
            lede="Orbit AI is grounded in your tasks, comments, estimates and history. It writes standups, flags slippage before it lands, and rebalances load — with the evidence attached."
          />

          <ul className="mt-7 space-y-3">
            {[
              { icon: Radar, label: "Risk detection across every active project" },
              { icon: Timer, label: "Forecasts from your team's real cycle time" },
              { icon: Users, label: "Workload rebalancing suggestions, one click to apply" },
            ].map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-signal">
                  <item.icon className="size-4" aria-hidden />
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="surface signal-rail overflow-hidden">
          <div className="flex items-center justify-between border-b border-border py-3 pr-4 pl-6">
            <p className="label-mono">Daily digest — 07:00</p>
            <span className="label-mono flex items-center gap-1.5 text-muted-foreground">
              <AlertTriangle className="size-3.5 text-signal" aria-hidden />3 signals
            </span>
          </div>
          <ul>
            {aiRows.map((row) => (
              <li key={row.signal} className="border-b border-border py-4 pr-4 pl-6 last:border-b-0">
                <p className={`label-mono flex items-center gap-2 ${toneLabel[row.tone]}`}>
                  <span className={`size-1.5 rounded-full ${toneDot[row.tone]}`} aria-hidden />
                  {row.signal}
                </p>
                <p className="mt-1.5 text-sm leading-6">{row.text}</p>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t border-border bg-secondary/60 py-3 pr-4 pl-6">
            <p className="label-mono text-muted-foreground">Grounded in 412 tasks</p>
            <button
              type="button"
              className="rounded-md bg-signal px-3 py-1.5 text-xs font-semibold text-signal-foreground transition-transform hover:-translate-y-px active:translate-y-0"
            >
              Apply fixes
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const metrics = [
  { label: "Cycle time", value: "3.4d", delta: "−0.9d", good: true },
  { label: "Throughput", value: "48", delta: "+12", good: true },
  { label: "Escaped defects", value: "2", delta: "+1", good: false },
  { label: "On-time delivery", value: "91%", delta: "+6pt", good: true },
];

const burn = [96, 88, 84, 71, 66, 52, 44, 38, 25, 18, 12, 4];

export function Analytics() {
  return (
    <section id="analytics" className="px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          kicker="Analytics"
          title="Numbers you can act on before the sprint ends"
          lede="Delivery metrics computed nightly per workspace — cycle time, throughput, burndown and load, all filterable to a single project or person."
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            {metrics.map((m) => (
              <div key={m.label} className="surface p-4">
                <p className="label-mono text-muted-foreground">{m.label}</p>
                <p className="font-display mt-2 text-3xl font-bold tracking-tight">{m.value}</p>
                <p className={`mt-1 text-xs font-medium ${m.good ? "text-success" : "text-destructive"}`}>
                  {m.good ? "▲" : "▼"} {m.delta} vs. prior
                </p>
              </div>
            ))}
          </div>

          <div className="surface p-5 lg:col-span-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">Sprint 24 burndown</p>
              <p className="label-mono text-muted-foreground">points remaining</p>
            </div>
            <div
              className="mt-5 flex h-44 items-end gap-1.5"
              role="img"
              aria-label="Sprint 24 burndown: 96 points remaining at start, 4 remaining at close, ahead of the ideal line."
            >
              {burn.map((v, i) => (
                <div key={i} className="flex h-full flex-1 flex-col justify-end">
                  <div
                    className={`w-full rounded-sm ${i > 8 ? "bg-signal" : "bg-signal/35"}`}
                    style={{ height: `${v}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-border pt-4">
              <span className="label-mono flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-4 rounded-sm bg-signal/35" aria-hidden /> Actual
              </span>
              <span className="label-mono flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-4 rounded-sm bg-signal" aria-hidden /> Ahead of ideal
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
