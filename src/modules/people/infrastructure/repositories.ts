import { InMemoryRepository } from "@/shared/infrastructure/mock/in-memory-repository";
import type { UserAbsence } from "../domain/entities";

export const userAbsencesRepository = new InMemoryRepository<UserAbsence>([]);
