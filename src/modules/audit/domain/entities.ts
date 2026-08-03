import type { Timestamps } from "@/shared/domain/base-entity";

export interface AuditLog extends Timestamps {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, unknown>;
}
