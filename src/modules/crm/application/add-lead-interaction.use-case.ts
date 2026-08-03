import type { RequestContext } from "@/shared/domain/repository";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import type { LeadInteractionType } from "../domain/entities";
import { leadInteractionsRepository, leadsRepository } from "../infrastructure/repositories";

interface AddLeadInteractionInput {
  leadId: string;
  userId: string;
  type: LeadInteractionType;
  notes: string;
}

export async function addLeadInteraction(
  { leadId, userId, type, notes }: AddLeadInteractionInput,
  context?: RequestContext,
) {
  const lead = await leadsRepository.findById(leadId, context);
  if (!lead) throw new ApiError(404, "Lead não encontrado");

  return leadInteractionsRepository.create({ leadId, userId, type, notes }, context);
}
