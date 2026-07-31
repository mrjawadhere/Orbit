import { cn } from "@/lib/utils";

/** Orbit mark: an iris disc with a tilted orbital ring and a satellite dot. */
export function OrbitMark({ className }: { className?: string | undefined }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn("size-9", className)}>
      <rect width="32" height="32" rx="9" fill="var(--color-signal)" />
      <circle cx="16" cy="16" r="4.25" fill="var(--color-signal-foreground)" />
      <g transform="rotate(-28 16 16)">
        <ellipse
          cx="16"
          cy="16"
          rx="10"
          ry="5"
          stroke="var(--color-signal-foreground)"
          strokeOpacity="0.75"
          strokeWidth="1.6"
        />
        <circle r="2.1" fill="var(--color-signal-foreground)" className="orbit-satellite">
          <animateMotion
            dur="4.5s"
            repeatCount="indefinite"
            path="M 26 16 A 10 5 0 1 1 6 16 A 10 5 0 1 1 26 16"
          />
        </circle>
      </g>
    </svg>
  );
}

export function OrbitLogo({
  className,
  markClassName,
}: {
  className?: string | undefined;
  markClassName?: string | undefined;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <OrbitMark className={markClassName} />
      <span className="font-display text-xl font-bold tracking-[-0.03em] sm:text-[1.375rem]">
        Orbit
      </span>
    </span>
  );
}
