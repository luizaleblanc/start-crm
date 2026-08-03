import { InMemoryRepository } from "@/shared/infrastructure/mock/in-memory-repository";
import type { AuditLog } from "../domain/entities";

export const auditLogsRepository = new InMemoryRepository<AuditLog>([]);
