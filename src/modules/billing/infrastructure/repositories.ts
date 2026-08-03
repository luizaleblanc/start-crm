import { InMemoryRepository } from "@/shared/infrastructure/mock/in-memory-repository";
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

export const plansRepository = new InMemoryRepository<Plan>(plansSeed, { softDelete: true });
export const planFeaturesRepository = new InMemoryRepository<PlanFeature>(planFeaturesSeed, {
  softDelete: true,
});
export const subscriptionsRepository = new InMemoryRepository<Subscription>(subscriptionsSeed);
export const invoicesRepository = new InMemoryRepository<Invoice>(invoicesSeed);
export const paymentsRepository = new InMemoryRepository<Payment>(paymentsSeed);
export const planUsagesRepository = new InMemoryRepository<PlanUsage>(planUsagesSeed);
