import { dealsRepository } from "@/modules/crm/infrastructure/repositories";
import { createItemRoute } from "@/shared/infrastructure/http/crud-route-factory";

export const { GET, PATCH, DELETE } = createItemRoute(dealsRepository);
