import { subscriptionsRepository } from "@/modules/billing/infrastructure/repositories";
import { createCollectionRoute } from "@/shared/infrastructure/http/crud-route-factory";

export const { GET, POST } = createCollectionRoute(subscriptionsRepository);
