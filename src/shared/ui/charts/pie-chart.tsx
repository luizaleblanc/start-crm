interface PieChartDatum {
  label: string;
  value: number;
}

interface PieChartProps {
  data: PieChartDatum[];
  ariaLabel: string;
  innerLabel?: string;
}

// Paleta categórica de 8 matizes fixos (ver globals.css --chart-1..8),
// validada com o skill de dataviz — ordem fixa, nunca ciclada.
const CATEGORICAL_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];
const MAX_SLICES = CATEGORICAL_COLORS.length;

function foldToOther(data: PieChartDatum[]): PieChartDatum[] {
  if (data.length <= MAX_SLICES) return data;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const head = sorted.slice(0, MAX_SLICES - 1);
  const rest = sorted.slice(MAX_SLICES - 1);
  const other = rest.reduce((sum, datum) => sum + datum.value, 0);
  return [...head, { label: "Outras", value: other }];
}

export function PieChart({ data, ariaLabel, innerLabel = "Total" }: PieChartProps) {
  const slices = foldToOther(data);
  const total = slices.reduce((sum, datum) => sum + datum.value, 0) || 1;

  const stops = slices
    .reduce<{ cumulative: number; segments: string[] }>(
      (acc, datum, index) => {
        const start = (acc.cumulative / total) * 360;
        const cumulative = acc.cumulative + datum.value;
        const end = (cumulative / total) * 360;
        const segment = `${CATEGORICAL_COLORS[index % MAX_SLICES]} ${start}deg ${end}deg`;
        return { cumulative, segments: [...acc.segments, segment] };
      },
      { cumulative: 0, segments: [] },
    )
    .segments.join(", ");

  return (
    <div className="flex flex-col items-center gap-8 py-2 sm:flex-row">
      <div
        role="img"
        aria-label={ariaLabel}
        className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full shadow-inner"
        style={{ background: `conic-gradient(${stops})` }}
      >
        <div className="shadow-xs flex h-24 w-24 flex-col items-center justify-center rounded-full bg-card">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {innerLabel}
          </span>
          <span className="text-h4 font-bold tabular-nums text-foreground">
            {total.toLocaleString("pt-BR")}
          </span>
        </div>
      </div>
      <ul className="flex w-full flex-1 flex-col gap-3">
        {slices.map((datum, index) => {
          const pct = Math.round((datum.value / total) * 100);
          return (
            <li key={datum.label} className="flex flex-col gap-1 text-caption">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 truncate">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: CATEGORICAL_COLORS[index % MAX_SLICES] }}
                  />
                  <span className="truncate font-medium text-foreground">{datum.label}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-foreground">
                  {datum.value.toLocaleString("pt-BR")}{" "}
                  <span className="font-normal text-muted-foreground">({pct}%)</span>
                </span>
              </div>
              <div className="bg-muted/30 h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    backgroundColor: CATEGORICAL_COLORS[index % MAX_SLICES],
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
