import type { RequestContext } from "@/shared/domain/repository";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { leadsRepository } from "../infrastructure/repositories";

interface ChangeLeadStageInput {
  leadId: string;
  funnelStageId: string;
}

export async function changeLeadStage(
  { leadId, funnelStageId }: ChangeLeadStageInput,
  context?: RequestContext,
) {
  const lead = await leadsRepository.update(leadId, { funnelStageId }, context);
  if (!lead) throw new ApiError(404, "Lead não encontrado");
  return lead;
}
