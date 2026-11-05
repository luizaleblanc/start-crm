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
  const isReal = process.env.API_MODE === "real";
  const nestUrl = process.env.NEST_API_URL;

  // Se estiver em produção e NEST_API_URL não estiver configurado ou apontar para localhost,
  // faz fallback automático para InMemoryRepository para evitar que a aplicação quebre
  if (
    isReal &&
    (!nestUrl || (nestUrl.includes("localhost") && process.env.NODE_ENV === "production"))
  ) {
    return new InMemoryRepository<T>(seed, { softDelete });
  }

  if (isReal) {
    return new HttpRepository<T>(resource);
  }
  return new InMemoryRepository<T>(seed, { softDelete });
}
