import { createResourceRepository } from "@/shared/infrastructure/repository-factory";
import type { Notification } from "../domain/entities";

const now = new Date().toISOString();

const notificationsSeed: Notification[] = [
  {
    id: "notification_1",
    userId: "user_admin",
    title: "Bem-vindo ao Start CRM",
    message: "Sua conta foi provisionada com sucesso.",
    read: false,
    createdAt: now,
    updatedAt: now,
  },
];

export const notificationsRepository = createResourceRepository<Notification>({
  resource: "notifications",
  seed: notificationsSeed,
});
