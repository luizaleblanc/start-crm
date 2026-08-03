import type { BaseEntity } from "./base-entity";
import type { PaginatedResult, PaginationParams } from "./pagination";

export interface RequestContext {
  token?: string;
}

export interface Repository<T extends BaseEntity> {
  list(
    params: PaginationParams,
    filters?: Record<string, string>,
    context?: RequestContext,
  ): Promise<PaginatedResult<T>>;
  findById(id: string, context?: RequestContext): Promise<T | undefined>;
  create(input: Omit<T, "id" | "createdAt" | "updatedAt">, context?: RequestContext): Promise<T>;
  update(
    id: string,
    patch: Partial<Omit<T, "id" | "createdAt">>,
    context?: RequestContext,
  ): Promise<T | undefined>;
  delete(id: string, context?: RequestContext): Promise<boolean>;
}
