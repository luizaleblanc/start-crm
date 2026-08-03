import type { FunnelStage } from "@/modules/crm/domain/entities";
import { getStageTemperatureColor } from "./lead-temperature";

interface TemperatureBadgeProps {
  stage: FunnelStage;
  allStages: FunnelStage[];
}

export function TemperatureBadge({ stage, allStages }: TemperatureBadgeProps) {
  const color = getStageTemperatureColor(stage, allStages);

  return (
    <span className="bg-foreground/5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-caption font-medium text-foreground">
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {stage.name}
    </span>
  );
}
