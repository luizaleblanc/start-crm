import type { SoftDeletable, Timestamps } from "@/shared/domain/base-entity";

export interface Source extends Timestamps, SoftDeletable {
  id: string;
  organizationId: string;
  name: string;
}

export interface FunnelStage extends Timestamps, SoftDeletable {
  id: string;
  organizationId: string;
  name: string;
  order: number;
}

export interface Lead extends Timestamps, SoftDeletable {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string;
  sourceId: string;
  funnelStageId: string;
}

export interface LeadOwnership extends Timestamps {
  id: string;
  leadId: string;
  userId: string;
  assignedAt: string;
}

export type LeadInteractionType = "call" | "email" | "whatsapp" | "note";

export interface LeadInteraction extends Timestamps {
  id: string;
  leadId: string;
  userId: string;
  type: LeadInteractionType;
  notes: string;
}

export interface Meeting extends Timestamps {
  id: string;
  leadId: string;
  userId: string;
  scheduledAt: string;
  notes: string;
}

export type DealStatus = "open" | "won" | "lost";

export interface Deal extends Timestamps {
  id: string;
  organizationId: string;
  leadId: string;
  title: string;
  value: number;
  status: DealStatus;
  closedAt: string | null;
}
