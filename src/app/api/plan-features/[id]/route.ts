import { planFeaturesRepository } from "@/modules/billing/infrastructure/repositories";
import { createItemRoute } from "@/shared/infrastructure/http/crud-route-factory";

export const { GET, PATCH, DELETE } = createItemRoute(planFeaturesRepository);
