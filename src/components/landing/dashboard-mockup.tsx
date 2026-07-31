const columns = [
  {
    key: "backlog",
    title: "Backlog",
    count: 12,
    cards: [
      { id: "ORB-241", title: "Billing seat proration", tag: "Billing", weight: "M" },
      { id: "ORB-238", title: "Audit log export (CSV)", tag: "Security", weight: "S" },
    ],
  },
  {
    key: "progress",
    title: "In progress",
    count: 5,
    cards: [
      { id: "ORB-219", title: "Mobile redesign — task sheet", tag: "Design", weight: "L" },
      { id: "ORB-226", title: "Realtime presence on boards", tag: "Platform", weight: "M" },
    ],
  },
  {
    key: "review",
    title: "Review",
    count: 3,
    cards: [{ id: "ORB-204", title: "SSO: SCIM provisioning", tag: "Enterprise", weight: "L" }],
  },
];

const bars = [42, 58, 36, 74, 61, 88, 70];
const days = ["M", "T", "W", "T", "F", "S", "S"];

export function DashboardMockup() {
  return (
    <div
      aria-hidden
      className="plate bg-card"
    >
      {/* Window rail */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <p className="label-mono">Board — Q3 delivery</p>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 border border-border" />
          <span className="h-2.5 w-2.5 border border-border" />
          <span className="h-2.5 w-2.5 bg-signal" />
        </div>
      </div>

      {/* Board: columns are deliberately unequal in weight */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {columns.map((col) => (
          <div key={col.key} className="min-w-0 p-3">
            <div className="flex items-baseline justify-between">
              <p className="label-mono truncate">{col.title}</p>
              <span className="label-mono text-muted-foreground">{col.count}</span>
            </div>
            <div className="mt-3 space-y-2">
              {col.cards.map((card) => (
                <div key={card.id} className="min-w-0 rounded-md border border-border bg-background p-2">
                  <p className="label-mono text-signal">{card.id}</p>
                  <p className="mt-1 text-[0.7rem] leading-4 font-medium">{card.title}</p>
                  <div className="mt-2 flex items-center justify-between gap-1.5">
                    <span className="label-mono min-w-0 truncate text-muted-foreground">{card.tag}</span>
                    <span className="label-mono shrink-0 rounded border border-border px-1">{card.weight}</span>
                  </div>
                </div>
              ))}
              {col.key === "review" ? <div className="h-16 rounded-md border border-dashed border-border" /> : null}
            </div>
          </div>
        ))}
      </div>

      {/* Instrument strip */}
      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-5 sm:divide-x sm:divide-y-0">
        <div className="p-3 sm:col-span-3">
          <p className="label-mono text-muted-foreground">Throughput / 7d</p>
          <div className="mt-3 flex h-20 items-end gap-1.5">
            {bars.map((h, i) => (
              <div key={days[i]! + i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div
                  className={i === bars.length - 2 ? "w-full rounded-sm bg-signal" : "w-full rounded-sm bg-signal/30"}
                  style={{ height: `${h}%` }}
                />
                <span className="label-mono text-[0.55rem] text-muted-foreground">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 sm:col-span-2">
          <p className="label-mono text-signal">Orbit AI</p>
          <p className="mt-2 text-[0.7rem] leading-4">
            Mobile Redesign slips 4 days. 3 blockers unassigned before Friday.
          </p>
          <p className="label-mono mt-3 border-t border-border pt-2 text-muted-foreground">
            Confidence 0.86
          </p>
        </div>
      </div>
    </div>
  );
}
