interface PieChartDatum {
  label: string;
  value: number;
}

interface PieChartProps {
  data: PieChartDatum[];
  ariaLabel: string;
}

const CATEGORICAL_COLORS = [
  "#6d88df", // primary (Kennedy)
  "#2a4ebc", // secondary (Azul Escuro)
  "#159a6b", // success
  "#193073", // midnight
  "#16161c", // ink
  "#9b97a6", // texto terciário
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

export function PieChart({ data, ariaLabel }: PieChartProps) {
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
    <div className="flex flex-wrap items-center gap-6">
      <div
        role="img"
        aria-label={ariaLabel}
        className="h-40 w-40 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops})` }}
      />
      <ul className="flex flex-col gap-2">
        {slices.map((datum, index) => (
          <li key={datum.label} className="flex items-center gap-2 text-caption">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: CATEGORICAL_COLORS[index % MAX_SLICES] }}
            />
            <span className="text-foreground">{datum.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {datum.value} ({Math.round((datum.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
