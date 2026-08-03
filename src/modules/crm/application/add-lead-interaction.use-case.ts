import { ApiError } from "@/shared/infrastructure/http/api-error";
import type { LeadInteractionType } from "../domain/entities";
import { leadInteractionsRepository, leadsRepository } from "../infrastructure/repositories";

interface AddLeadInteractionInput {
  leadId: string;
  userId: string;
  type: LeadInteractionType;
  notes: string;
}

export function addLeadInteraction({ leadId, userId, type, notes }: AddLeadInteractionInput) {
  const lead = leadsRepository.findById(leadId);
  if (!lead) throw new ApiError(404, "Lead não encontrado");

  return leadInteractionsRepository.create({ leadId, userId, type, notes });
}
