import type { BaseEntity } from "@/shared/domain/base-entity";
import type { Repository } from "@/shared/domain/repository";
import { HttpRepository } from "./http/http-repository";
import { InMemoryRepository } from "./mock/in-memory-repository";

interface CreateResourceRepositoryOptions<T> {
  resource: string;
  seed: T[];
  softDelete?: boolean;
}

export function createResourceRepository<T extends BaseEntity>({
  resource,
  seed,
  softDelete,
}: CreateResourceRepositoryOptions<T>): Repository<T> {
  if (process.env.API_MODE === "real") {
    return new HttpRepository<T>(resource);
  }
  return new InMemoryRepository<T>(seed, { softDelete });
}
