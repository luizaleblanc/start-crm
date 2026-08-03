import { leadInteractionsRepository } from "@/modules/crm/infrastructure/repositories";
import { createCollectionRoute } from "@/shared/infrastructure/http/crud-route-factory";

export const { GET, POST } = createCollectionRoute(leadInteractionsRepository);
