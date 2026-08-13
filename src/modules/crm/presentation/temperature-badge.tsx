import type { FunnelStage } from "@/modules/crm/domain/entities";
import { getStageTemperatureColor, getStageTemperatureColorAlpha } from "./lead-temperature";

interface TemperatureBadgeProps {
  stage: FunnelStage;
  allStages: FunnelStage[];
}

export function TemperatureBadge({ stage, allStages }: TemperatureBadgeProps) {
  const color = getStageTemperatureColor(stage, allStages);
  const background = getStageTemperatureColorAlpha(stage, allStages, 0.16);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-caption font-medium"
      style={{ backgroundColor: background, color }}
    >
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {stage.name}
    </span>
  );
}
