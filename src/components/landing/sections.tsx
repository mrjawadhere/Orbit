import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Minus } from "lucide-react";

import { SectionHead } from "@/components/landing/features";
import { OrbitLogo } from "@/components/orbit/logo";

const testimonials = [
  {
    quote:
      "We cut our planning meeting from ninety minutes to twenty. The AI digest arrives before standup and it is right often enough that we argue with it, not about it.",
    name: "Priya Raman",
    role: "VP Engineering, Northwind",
    metric: "−38% cycle time",
  },
  {
    quote:
      "Roles are enforced in the database, so our security review took two days instead of two months.",
    name: "Marcus Idowu",
    role: "CTO, Vertex",
    metric: "SOC 2 in 41 days",
  },
  {
    quote: "Six squads, one workspace, zero spreadsheet reconciliation.",
    name: "Elena Cortez",
    role: "Head of Delivery, Cascade",
    metric: "6 squads",
  },
];

export function Testimonials() {
  return (
    <section id="customers" className="px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          kicker="Field notes"
          title="What changes in the first quarter"
          lede="Orbit replaces the ritual overhead of project management. These are the numbers teams reported ninety days after switching."
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="surface flex flex-col justify-between p-5">
              <blockquote className="text-sm leading-7">“{t.quote}”</blockquote>
              <figcaption className="mt-6 border-t border-border pt-4">
                <p className="label-mono text-signal">{t.metric}</p>
                <p className="mt-2 text-sm font-semibold">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const plans = [
  {
    name: "Solo",
    price: "$0",
    cadence: "forever",
    summary: "One workspace, up to 3 people, everything except SSO.",
    features: [
      "Unlimited projects",
      "Board + list + timeline",
      "7-day activity history",
      "Community support",
    ],
    absent: ["Orbit AI digests", "SSO / SCIM"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Team",
    price: "$14",
    cadence: "per seat / month",
    summary: "The default for product teams shipping every week.",
    features: [
      "Everything in Solo",
      "Orbit AI digests + forecasts",
      "Workload balancing",
      "Unlimited history",
      "Priority support",
    ],
    absent: ["SSO / SCIM"],
    cta: "Start 14-day trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Talk",
    cadence: "annual contract",
    summary: "Multi-org governance, procurement and compliance.",
    features: [
      "Everything in Team",
      "SSO / SCIM provisioning",
      "Audit log export",
      "Data residency",
      "Named CSM + 99.99% SLA",
    ],
    absent: [],
    cta: "Book a call",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          kicker="Pricing"
          title="Per seat, no usage meter, no surprise invoice"
          lede="Every plan includes the full task model and unlimited projects. You pay for people, and only for people who logged in that month."
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`surface flex flex-col p-5 ${
                plan.featured ? "bg-ink text-ink-foreground ring-2 ring-signal" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold tracking-tight">{plan.name}</h3>
                {plan.featured ? (
                  <span className="label-mono rounded-full bg-signal px-2.5 py-1 text-signal-foreground">
                    Most teams
                  </span>
                ) : null}
              </div>

              <p className="font-display mt-5 text-4xl font-bold tracking-tight">{plan.price}</p>
              <p
                className={`label-mono mt-1.5 ${plan.featured ? "text-ink-foreground/70" : "text-muted-foreground"}`}
              >
                {plan.cadence}
              </p>
              <p
                className={`mt-4 text-sm leading-6 ${plan.featured ? "text-ink-foreground/80" : "text-muted-foreground"}`}
              >
                {plan.summary}
              </p>

              <ul className="mt-5 flex-1 space-y-2.5 border-t border-current/15 pt-5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
                    {f}
                  </li>
                ))}
                {plan.absent.map((f) => (
                  <li
                    key={f}
                    className={`flex items-start gap-2.5 ${plan.featured ? "text-ink-foreground/50" : "text-muted-foreground/70"}`}
                  >
                    <Minus className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/auth"
                className={`mt-6 inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold transition-transform hover:-translate-y-px active:translate-y-0 ${
                  plan.featured
                    ? "bg-signal text-signal-foreground"
                    : "border border-border bg-card text-foreground hover:bg-secondary"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "How is Orbit different from Jira or ClickUp?",
    a: "One task model behind every view, and an AI grounded in your workspace rather than bolted on. There is no configuration project required before your team can use it — a workspace is usable in under five minutes.",
  },
  {
    q: "Is my data isolated from other customers?",
    a: "Yes. Every row carries an organisation id and access is enforced by row-level security policies in the database, not by application code. A misconfigured client cannot read another tenant's data.",
  },
  {
    q: "What does Orbit AI actually see?",
    a: "Tasks, comments, estimates, assignments and completion history inside the workspace you are querying. It never trains on your content and never crosses an organisation boundary.",
  },
  {
    q: "Can we move off Orbit later?",
    a: "Full CSV and JSON export of projects, tasks, comments and activity is available on every paid plan, at any time, without contacting support.",
  },
  {
    q: "Do you charge for guests?",
    a: "No. Guests with read and comment access are free and unlimited. You pay only for members who can create and assign work.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3 lg:gap-8">
        <div>
          <p className="label-mono text-signal">FAQ</p>
          <h2 className="display-lg mt-3 max-w-[14ch]">Questions we get in week one</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Still stuck? Write to{" "}
            <a
              href="mailto:hello@orbit.build"
              className="font-medium text-signal underline underline-offset-4"
            >
              hello@orbit.build
            </a>{" "}
            — a human replies inside a working day.
          </p>
        </div>

        <div className="surface divide-y divide-border lg:col-span-2">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/60"
                  >
                    <span className="flex-1 text-sm font-semibold sm:text-base">{item.q}</span>
                    <span aria-hidden className="shrink-0 text-lg leading-none text-signal">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                {isOpen ? (
                  <div id={`faq-panel-${i}`} className="px-5 pb-5">
                    <p className="text-sm leading-7 text-muted-foreground">{item.a}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="px-4 pb-10 sm:px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-ink px-6 py-10 text-ink-foreground sm:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="label-mono text-signal">Get started</p>
            <h2 className="display-lg mt-3 max-w-[18ch]">
              Put your next sprint in Orbit before Monday.
            </h2>
            <p className="mt-3 max-w-[52ch] text-sm leading-7 text-ink-foreground/75">
              Free for teams of three. Fourteen days of everything else, no card, and an import that
              takes about the length of a coffee.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-2 lg:justify-end">
            <Link
              to="/auth"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-signal px-5 text-sm font-semibold text-signal-foreground transition-transform hover:-translate-y-px active:translate-y-0"
            >
              Create your workspace
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href="mailto:sales@orbit.build"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-ink-foreground/25 px-5 text-sm font-medium transition-colors hover:border-ink-foreground/60"
            >
              Talk to sales
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

const footerGroups = [
  { title: "Product", links: ["Boards", "Timeline", "Orbit AI", "Analytics", "Integrations"] },
  { title: "Company", links: ["About", "Careers", "Changelog", "Press"] },
  { title: "Resources", links: ["Docs", "API reference", "Status", "Security"] },
  { title: "Legal", links: ["Privacy", "Terms", "DPA", "Sub-processors"] },
];

export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <OrbitLogo />
            <p className="mt-4 max-w-[32ch] text-sm leading-6 text-muted-foreground">
              Project control for teams that ship weekly. Built in Rotterdam and Lisbon.
            </p>
          </div>

          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="label-mono text-muted-foreground">{group.title}</h2>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#top"
                      className="text-sm text-muted-foreground transition-colors hover:text-signal"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="label-mono text-muted-foreground">
            © {new Date().getFullYear()} Orbit Labs BV
          </p>
          <p className="label-mono text-muted-foreground">All systems operational</p>
        </div>
      </div>
    </footer>
  );
}
