import { InMemoryRepository } from "@/shared/infrastructure/mock/in-memory-repository";
import type {
  Deal,
  FunnelStage,
  Lead,
  LeadInteraction,
  LeadOwnership,
  Meeting,
  Source,
} from "../domain/entities";
import {
  dealsSeed,
  funnelStagesSeed,
  leadInteractionsSeed,
  leadOwnershipsSeed,
  leadsSeed,
  meetingsSeed,
  sourcesSeed,
} from "./seed";

export const sourcesRepository = new InMemoryRepository<Source>(sourcesSeed, { softDelete: true });
export const funnelStagesRepository = new InMemoryRepository<FunnelStage>(funnelStagesSeed, {
  softDelete: true,
});
export const leadsRepository = new InMemoryRepository<Lead>(leadsSeed, { softDelete: true });
export const leadOwnershipsRepository = new InMemoryRepository<LeadOwnership>(leadOwnershipsSeed);
export const leadInteractionsRepository = new InMemoryRepository<LeadInteraction>(
  leadInteractionsSeed,
);
export const meetingsRepository = new InMemoryRepository<Meeting>(meetingsSeed);
export const dealsRepository = new InMemoryRepository<Deal>(dealsSeed);
