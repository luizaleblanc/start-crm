import type {
  Invoice,
  Payment,
  Plan,
  PlanFeature,
  PlanUsage,
  Subscription,
} from "../domain/entities";

const now = new Date().toISOString();

export const plansSeed: Plan[] = [
  { id: "plan_starter", name: "Starter", price: 99, ativo: true, createdAt: now, updatedAt: now },
  { id: "plan_pro", name: "Pro", price: 249, ativo: true, createdAt: now, updatedAt: now },
];

export const planFeaturesSeed: PlanFeature[] = [
  {
    id: "feature_leads_ilimitados",
    planId: "plan_pro",
    name: "Leads ilimitados",
    ativo: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const subscriptionsSeed: Subscription[] = [
  {
    id: "subscription_1",
    organizationId: "org_1",
    planId: "plan_pro",
    status: "active",
    startedAt: now,
    endedAt: null,
    createdAt: now,
    updatedAt: now,
  },
];

export const invoicesSeed: Invoice[] = [
  {
    id: "invoice_1",
    subscriptionId: "subscription_1",
    amount: 249,
    status: "paid",
    dueDate: now,
    createdAt: now,
    updatedAt: now,
  },
];

export const paymentsSeed: Payment[] = [
  {
    id: "payment_1",
    invoiceId: "invoice_1",
    amount: 249,
    method: "credit_card",
    paidAt: now,
    createdAt: now,
    updatedAt: now,
  },
];

export const planUsagesSeed: PlanUsage[] = [];
