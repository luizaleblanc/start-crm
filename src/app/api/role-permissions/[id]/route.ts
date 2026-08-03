import { rolePermissionsRepository } from "@/modules/iam/infrastructure/repositories";
import { createItemRoute } from "@/shared/infrastructure/http/crud-route-factory";

export const { GET, PATCH, DELETE } = createItemRoute(rolePermissionsRepository);
