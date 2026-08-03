import { userAbsencesRepository } from "@/modules/people/infrastructure/repositories";
import { createCollectionRoute } from "@/shared/infrastructure/http/crud-route-factory";

export const { GET, POST } = createCollectionRoute(userAbsencesRepository);
