import { createResourceRepository } from "@/shared/infrastructure/repository-factory";
import type { AuditLog } from "../domain/entities";

export const auditLogsRepository = createResourceRepository<AuditLog>({
  resource: "audit-logs",
  seed: [],
});
