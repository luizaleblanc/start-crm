import type {
  Deal,
  FunnelStage,
  Lead,
  LeadInteraction,
  LeadOwnership,
  Meeting,
  Source,
} from "../domain/entities";

const now = new Date().toISOString();

export const sourcesSeed: Source[] = [
  {
    id: "source_site",
    organizationId: "org_1",
    name: "Site",
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

export const leadsSeed: Lead[] = [
  {
    id: "lead_1",
    organizationId: "org_1",
    name: "Maria Souza",
    email: "maria@example.com",
    phone: "+55 11 90000-0001",
    sourceId: "source_site",
    funnelStageId: "stage_novo",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "lead_2",
    organizationId: "org_1",
    name: "João Lima",
    email: "joao@example.com",
    phone: "+55 11 90000-0002",
    sourceId: "source_indicacao",
    funnelStageId: "stage_qualificacao",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const leadOwnershipsSeed: LeadOwnership[] = [
  {
    id: "ownership_1",
    leadId: "lead_1",
    userId: "user_admin",
    assignedAt: now,
    createdAt: now,
    updatedAt: now,
  },
];

export const leadInteractionsSeed: LeadInteraction[] = [
  {
    id: "interaction_1",
    leadId: "lead_1",
    userId: "user_admin",
    type: "note",
    notes: "Lead recebido via site.",
    createdAt: now,
    updatedAt: now,
  },
];

export const meetingsSeed: Meeting[] = [];

export const dealsSeed: Deal[] = [];
