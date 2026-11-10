import type { Visual } from "@/lib/advanced-questions";

export function AdvancedVisual({ visual }: { visual: Visual }) {
  if (visual.kind === "none") return null;

  if (visual.kind === "table") {
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {visual.columns.map((c) => (
                <th key={c} className="px-3 py-2 text-left font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visual.rows.map((row, i) => (
              <tr key={i} className="border-t border-border">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`px-3 py-2 ${j === 0 ? "font-medium" : "tabular text-right"}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (visual.kind === "bar") {
    const max = Math.max(...visual.data.map((d) => d.value));
    return (
      <div className="space-y-2">
        {visual.data.map((d) => (
          <div key={d.label} className="grid grid-cols-[8rem_1fr_5rem] items-center gap-3">
            <div className="text-sm text-muted-foreground">{d.label}</div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
            <div className="text-right text-sm tabular">
              {d.value.toLocaleString()}
              {visual.unit ? ` ${visual.unit}` : ""}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // line chart
  const w = 480, h = 160, pad = 28;
  const max = Math.max(...visual.data.map((d) => d.value));
  const min = Math.min(...visual.data.map((d) => d.value));
  const span = Math.max(1, max - min);
  const stepX = (w - pad * 2) / Math.max(1, visual.data.length - 1);
  const pts = visual.data.map((d, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((d.value - min) / span) * (h - pad * 2);
    return { x, y, ...d };
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2.5" />
        {pts.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="var(--primary)" />
            <text x={p.x} y={h - 8} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
              {p.label}
            </text>
            <text x={p.x} y={p.y - 8} textAnchor="middle" className="fill-foreground" fontSize="10">
              {p.value}
            </text>
          </g>
        ))}
      </svg>
      {visual.unit && (
        <div className="mt-1 text-right text-xs text-muted-foreground">{visual.unit}</div>
      )}
    </div>
  );
}
