import type { BaseEntity } from "@/shared/domain/base-entity";
import type { Repository } from "@/shared/domain/repository";
import { isRealApi } from "./config/api-mode";
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
  if (isRealApi()) {
    return new HttpRepository<T>(resource);
  }
  return new InMemoryRepository<T>(seed, { softDelete });
}
