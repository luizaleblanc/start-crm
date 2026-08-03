import type { FunnelStage } from "@/modules/crm/domain/entities";

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

// Frio -> quente: azul, ciano, laranja, vermelho. A posição do estágio na
// ordem do funil (não o nome) decide onde ele cai nessa rampa, então a
// escala se adapta se estágios forem adicionados/removidos.
const TEMPERATURE_STOPS: RgbColor[] = [
  { r: 0x3b, g: 0x82, b: 0xf6 },
  { r: 0x10, g: 0xb9, b: 0x81 },
  { r: 0xf5, g: 0x9e, b: 0x0b },
  { r: 0xef, g: 0x44, b: 0x44 },
];

function interpolateStops(t: number): RgbColor {
  const clamped = Math.min(1, Math.max(0, t));
  const scaled = clamped * (TEMPERATURE_STOPS.length - 1);
  const index = Math.floor(scaled);
  const fraction = scaled - index;
  const from = TEMPERATURE_STOPS[index] ?? TEMPERATURE_STOPS[0]!;
  const to = TEMPERATURE_STOPS[Math.min(index + 1, TEMPERATURE_STOPS.length - 1)] ?? from;
  return {
    r: Math.round(from.r + (to.r - from.r) * fraction),
    g: Math.round(from.g + (to.g - from.g) * fraction),
    b: Math.round(from.b + (to.b - from.b) * fraction),
  };
}

function getStageTemperatureRgb(stage: FunnelStage, allStages: FunnelStage[]): RgbColor {
  const orders = allStages.map((item) => item.order);
  const min = Math.min(...orders);
  const max = Math.max(...orders);
  const t = max === min ? 0 : (stage.order - min) / (max - min);
  return interpolateStops(t);
}

export function getStageTemperatureColor(stage: FunnelStage, allStages: FunnelStage[]): string {
  const { r, g, b } = getStageTemperatureRgb(stage, allStages);
  return `rgb(${r}, ${g}, ${b})`;
}

export function getStageTemperatureColorAlpha(
  stage: FunnelStage,
  allStages: FunnelStage[],
  alpha: number,
): string {
  const { r, g, b } = getStageTemperatureRgb(stage, allStages);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
