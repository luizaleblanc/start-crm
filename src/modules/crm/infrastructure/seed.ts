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

export const meetingsSeed: Meeting[] = [
  {
    id: "meeting_1",
    leadId: "lead_1",
    userId: "user_admin",
    scheduledAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    notes: "Apresentação de Diagnóstico e Fechamento Comercial",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "meeting_2",
    leadId: "lead_2",
    userId: "user_cleiton",
    scheduledAt: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    notes: "Demonstração do Start CRM e alinhamento de escopo",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "meeting_3",
    leadId: "lead_3",
    userId: "user_si",
    scheduledAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    notes: "Alinhamento de Proposta Comercial e Condições de Pagamento",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "meeting_4",
    leadId: "lead_4",
    userId: "user_admin",
    scheduledAt: new Date(Date.now() + 28 * 3600 * 1000).toISOString(),
    notes: "Follow-up de Proposta e Esclarecimento de Dúvidas Técnicas",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "meeting_5",
    leadId: "lead_5",
    userId: "user_cleiton",
    scheduledAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    notes: "Reunião de Onboarding e Validação do Funil de Vendas",
    createdAt: now,
    updatedAt: now,
  },
];

export const dealsSeed: Deal[] = dealsData as unknown as Deal[];
