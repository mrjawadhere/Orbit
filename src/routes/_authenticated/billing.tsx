import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

import { ErrorState, PageHeader, Panel, SkeletonCards } from "@/components/app/ui-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/hooks/use-orbit-data";
import { useWorkspace } from "@/hooks/use-workspace";
import { PLAN_LIMITS, formatDate, formatMoney, titleCase } from "@/lib/orbit";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "Billing — Orbit" },
      { name: "description", content: "Plan, seats, usage limits and invoice history for your workspace." },
      { property: "og:title", content: "Billing — Orbit" },
      { property: "og:description", content: "Plan, seats, usage and invoices for your Orbit workspace." },
    ],
  }),
  component: BillingPage,
});

const PLANS = [
  { id: "free", price: "$0", blurb: "For trying Orbit out", features: ["3 projects", "5 members", "Core boards"] },
  { id: "pro", price: "$29", blurb: "For growing product teams", features: ["25 projects", "50 members", "AI workspace", "Analytics"] },
  { id: "business", price: "$79", blurb: "For scaling orgs", features: ["Unlimited projects", "Unlimited members", "Advanced RBAC", "Priority support"] },
] as const;

function BillingPage() {
  const { workspace, can } = useWorkspace();
  const orgId = workspace?.org.id;
  const projects = useProjects({ includeArchived: true });

  const billing = useQuery({
    queryKey: ["billing", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const [subscription, invoices] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("organization_id", orgId!).maybeSingle(),
        supabase
          .from("invoices")
          .select("id, number, amount_cents, currency, status, issued_on")
          .eq("organization_id", orgId!)
          .order("issued_on", { ascending: false }),
      ]);
      if (subscription.error) throw subscription.error;
      return { subscription: subscription.data, invoices: invoices.data ?? [] };
    },
  });

  if (billing.isLoading) return <SkeletonCards />;
  if (billing.error) return <ErrorState error={billing.error} retry={() => void billing.refetch()} />;

  const plan = workspace?.org.plan ?? "free";
  const limits = PLAN_LIMITS[plan];
  const projectCount = projects.data?.length ?? 0;
  const memberCount = workspace?.members.length ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={workspace?.org.name}
        title="Billing"
        description="Your plan, seat usage and invoice history."
        actions={<Badge variant="outline">{titleCase(plan)} plan</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Usage" description="Against your current plan limits">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span>Projects</span>
                <span className="label-mono text-muted-foreground">{projectCount} / {limits.projects}</span>
              </div>
              <Progress value={Math.min(100, (projectCount / limits.projects) * 100)} className="mt-2 h-1.5" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span>Members</span>
                <span className="label-mono text-muted-foreground">{memberCount} / {limits.members}</span>
              </div>
              <Progress value={Math.min(100, (memberCount / limits.members) * 100)} className="mt-2 h-1.5" />
            </div>
          </div>
        </Panel>

        <Panel title="Subscription">
          {billing.data?.subscription ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd>{titleCase(billing.data.subscription.status)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Seats</dt><dd>{billing.data.subscription.seats}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Renews</dt><dd>{formatDate(billing.data.subscription.renews_at)}</dd></div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No active subscription on file.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((tier) => (
          <div
            key={tier.id}
            className={`rounded-lg border p-6 ${tier.id === plan ? "border-foreground/40 bg-accent/30" : "border-border bg-card"}`}
          >
            <p className="label-mono text-muted-foreground">{titleCase(tier.id)}</p>
            <p className="mt-2 font-display text-3xl font-bold">{tier.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            <p className="mt-1 text-sm text-muted-foreground">{tier.blurb}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="size-4 text-muted-foreground" aria-hidden="true" /> {feature}
                </li>
              ))}
            </ul>
            <Button
              className="mt-5 w-full"
              variant={tier.id === plan ? "outline" : "default"}
              disabled={tier.id === plan || !can("manage_billing")}
            >
              {tier.id === plan ? "Current plan" : `Upgrade to ${titleCase(tier.id)}`}
            </Button>
          </div>
        ))}
      </div>

      <Panel title="Invoices" description="Billing history for this workspace" bodyClassName="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(billing.data?.invoices ?? []).map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="label-mono">{invoice.number}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(invoice.issued_on)}</TableCell>
                <TableCell><Badge variant="outline">{titleCase(invoice.status)}</Badge></TableCell>
                <TableCell className="text-right font-medium">
                  {formatMoney(invoice.amount_cents, invoice.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {billing.data?.invoices.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No invoices yet.</p>
        ) : null}
      </Panel>
    </div>
  );
}
