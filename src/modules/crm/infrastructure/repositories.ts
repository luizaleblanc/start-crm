import { createResourceRepository } from "@/shared/infrastructure/repository-factory";
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

export const sourcesRepository = createResourceRepository<Source>({
  resource: "sources",
  seed: sourcesSeed,
  softDelete: true,
});
export const funnelStagesRepository = createResourceRepository<FunnelStage>({
  resource: "funnel-stages",
  seed: funnelStagesSeed,
  softDelete: true,
});
export const leadsRepository = createResourceRepository<Lead>({
  resource: "leads",
  seed: leadsSeed,
  softDelete: true,
});
export const leadOwnershipsRepository = createResourceRepository<LeadOwnership>({
  resource: "lead-ownerships",
  seed: leadOwnershipsSeed,
});
export const leadInteractionsRepository = createResourceRepository<LeadInteraction>({
  resource: "lead-interactions",
  seed: leadInteractionsSeed,
});
export const meetingsRepository = createResourceRepository<Meeting>({
  resource: "meetings",
  seed: meetingsSeed,
});
export const dealsRepository = createResourceRepository<Deal>({
  resource: "deals",
  seed: dealsSeed,
});
