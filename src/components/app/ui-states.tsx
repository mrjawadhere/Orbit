import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div className="min-w-0">
        {eyebrow ? <p className="label-mono text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-sm font-semibold tracking-tight">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 py-10 text-sm text-muted-foreground"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-lg border border-border bg-muted/50" />
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-14 text-center">
      {Icon ? <Icon className="mb-3 size-6 text-muted-foreground" /> : null}
      <p className="font-display text-sm font-semibold">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const message =
    error instanceof Error ? error.message : "Something went wrong loading this view.";
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/5 px-5 py-4 text-sm"
    >
      <p className="font-semibold text-destructive">Could not load data</p>
      <p className="mt-1 text-muted-foreground">{message}</p>
      {retry ? (
        <button
          type="button"
          onClick={retry}
          className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
