import { userRolesRepository } from "@/modules/iam/infrastructure/repositories";
import { createCollectionRoute } from "@/shared/infrastructure/http/crud-route-factory";

export const { GET, POST } = createCollectionRoute(userRolesRepository);
