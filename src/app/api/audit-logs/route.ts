import { auditLogsRepository } from "@/modules/audit/infrastructure/repositories";
import { createCollectionRoute } from "@/shared/infrastructure/http/crud-route-factory";

export const { GET, POST } = createCollectionRoute(auditLogsRepository);
