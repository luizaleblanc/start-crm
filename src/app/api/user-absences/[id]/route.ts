import { userAbsencesRepository } from "@/modules/people/infrastructure/repositories";
import { createItemRoute } from "@/shared/infrastructure/http/crud-route-factory";

export const { GET, PATCH, DELETE } = createItemRoute(userAbsencesRepository);
