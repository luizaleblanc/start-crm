import { ApiError } from "@/shared/infrastructure/http/api-error";
import { leadsRepository } from "../infrastructure/repositories";

interface ChangeLeadStageInput {
  leadId: string;
  funnelStageId: string;
}

export function changeLeadStage({ leadId, funnelStageId }: ChangeLeadStageInput) {
  const lead = leadsRepository.update(leadId, { funnelStageId });
  if (!lead) throw new ApiError(404, "Lead não encontrado");
  return lead;
}
