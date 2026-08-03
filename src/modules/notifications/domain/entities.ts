import type { Timestamps } from "@/shared/domain/base-entity";

export interface Notification extends Timestamps {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
}
