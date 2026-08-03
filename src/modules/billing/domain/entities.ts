import type { SoftDeletable, Timestamps } from "@/shared/domain/base-entity";

export interface Plan extends Timestamps, SoftDeletable {
  id: string;
  name: string;
  price: number;
}

export interface PlanFeature extends Timestamps, SoftDeletable {
  id: string;
  planId: string;
  name: string;
}

export type SubscriptionStatus = "active" | "canceled" | "past_due";

export interface Subscription extends Timestamps {
  id: string;
  organizationId: string;
  planId: string;
  status: SubscriptionStatus;
  startedAt: string;
  endedAt: string | null;
}

export type InvoiceStatus = "open" | "paid" | "void";

export interface Invoice extends Timestamps {
  id: string;
  subscriptionId: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
}

export interface Payment extends Timestamps {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  paidAt: string;
}

export interface PlanUsage extends Timestamps {
  id: string;
  subscriptionId: string;
  metric: string;
  value: number;
  periodStart: string;
  periodEnd: string;
}
