import type { RequestContext } from "@/shared/domain/repository";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { leadsRepository, meetingsRepository } from "../infrastructure/repositories";

interface ScheduleMeetingInput {
  leadId: string;
  userId: string;
  scheduledAt: string;
  notes: string;
}

export async function scheduleMeeting(
  { leadId, userId, scheduledAt, notes }: ScheduleMeetingInput,
  context?: RequestContext,
) {
  const lead = await leadsRepository.findById(leadId, context);
  if (!lead) throw new ApiError(404, "Lead não encontrado");

  return meetingsRepository.create({ leadId, userId, scheduledAt, notes }, context);
}
