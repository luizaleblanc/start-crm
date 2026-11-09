import type {
  Deal,
  FunnelStage,
  Lead,
  LeadInteraction,
  LeadOwnership,
  Meeting,
  Source,
} from "../domain/entities";
import dealsData from "./deals-data.json";
import interactionsData from "./interactions-data.json";
import leadsData from "./leads-data.json";
import ownershipsData from "./ownerships-data.json";

const now = new Date().toISOString();

export const sourcesSeed: Source[] = [
  {
    id: "source_new_mentoria",
    organizationId: "org_1",
    name: "NEW - Mentoria Tech (Ads)",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "source_mentoria",
    organizationId: "org_1",
    name: "Mentoria Tech (Ads)",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "source_post_itau",
    organizationId: "org_1",
    name: "Post Saída Itaú (Orgânico)",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "source_post_reprovacao",
    organizationId: "org_1",
    name: "Post Reprovação 2010 (Orgânico)",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "source_amigo",
    organizationId: "org_1",
    name: "Indicação / Amigo",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "source_site",
    organizationId: "org_1",
    name: "Site",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "source_google_ads",
    organizationId: "org_1",
    name: "Google Ads",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "source_indicacao",
    organizationId: "org_1",
    name: "Indicação",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const funnelStagesSeed: FunnelStage[] = [
  {
    id: "stage_novo",
    organizationId: "org_1",
    name: "Novo",
    order: 1,
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "stage_qualificacao",
    organizationId: "org_1",
    name: "Qualificação",
    order: 2,
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "stage_proposta",
    organizationId: "org_1",
    name: "Proposta",
    order: 3,
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "stage_fechamento",
    organizationId: "org_1",
    name: "Fechamento",
    order: 4,
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const leadsSeed: Lead[] = leadsData as unknown as Lead[];

export const leadOwnershipsSeed: LeadOwnership[] = ownershipsData as unknown as LeadOwnership[];

export const leadInteractionsSeed: LeadInteraction[] =
  interactionsData as unknown as LeadInteraction[];

export const meetingsSeed: Meeting[] = [];

export const dealsSeed: Deal[] = dealsData as unknown as Deal[];
