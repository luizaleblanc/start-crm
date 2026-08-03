import type { Timestamps } from "@/shared/domain/base-entity";

export interface UserAbsence extends Timestamps {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
}
