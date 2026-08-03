import { createResourceRepository } from "@/shared/infrastructure/repository-factory";
import type { UserAbsence } from "../domain/entities";

export const userAbsencesRepository = createResourceRepository<UserAbsence>({
  resource: "user-absences",
  seed: [],
});
