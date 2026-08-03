import { notificationsRepository } from "@/modules/notifications/infrastructure/repositories";
import { createCollectionRoute } from "@/shared/infrastructure/http/crud-route-factory";

export const { GET, POST } = createCollectionRoute(notificationsRepository);
