import { ApiError } from "@/shared/infrastructure/http/api-error";
import { leadsRepository, meetingsRepository } from "../infrastructure/repositories";

interface ScheduleMeetingInput {
  leadId: string;
  userId: string;
  scheduledAt: string;
  notes: string;
}

export function scheduleMeeting({ leadId, userId, scheduledAt, notes }: ScheduleMeetingInput) {
  const lead = leadsRepository.findById(leadId);
  if (!lead) throw new ApiError(404, "Lead não encontrado");

  return meetingsRepository.create({ leadId, userId, scheduledAt, notes });
}
