import { ApiError } from "@/shared/infrastructure/http/api-error";
import { leadOwnershipsRepository, leadsRepository } from "../infrastructure/repositories";

interface AssignLeadInput {
  leadId: string;
  userId: string;
}

export function assignLead({ leadId, userId }: AssignLeadInput) {
  const lead = leadsRepository.findById(leadId);
  if (!lead) throw new ApiError(404, "Lead não encontrado");

  return leadOwnershipsRepository.create({
    leadId,
    userId,
    assignedAt: new Date().toISOString(),
  });
}
