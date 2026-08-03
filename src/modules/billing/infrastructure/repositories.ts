import { createResourceRepository } from "@/shared/infrastructure/repository-factory";
import type {
  Invoice,
  Payment,
  Plan,
  PlanFeature,
  PlanUsage,
  Subscription,
} from "../domain/entities";
import {
  invoicesSeed,
  planFeaturesSeed,
  planUsagesSeed,
  plansSeed,
  paymentsSeed,
  subscriptionsSeed,
} from "./seed";

export const plansRepository = createResourceRepository<Plan>({
  resource: "plans",
  seed: plansSeed,
  softDelete: true,
});
export const planFeaturesRepository = createResourceRepository<PlanFeature>({
  resource: "plan-features",
  seed: planFeaturesSeed,
  softDelete: true,
});
export const subscriptionsRepository = createResourceRepository<Subscription>({
  resource: "subscriptions",
  seed: subscriptionsSeed,
});
export const invoicesRepository = createResourceRepository<Invoice>({
  resource: "invoices",
  seed: invoicesSeed,
});
export const paymentsRepository = createResourceRepository<Payment>({
  resource: "payments",
  seed: paymentsSeed,
});
export const planUsagesRepository = createResourceRepository<PlanUsage>({
  resource: "plan-usages",
  seed: planUsagesSeed,
});
