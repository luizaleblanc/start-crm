import type { BaseEntity } from "@/shared/domain/base-entity";
import type { PaginatedResult, PaginationParams } from "@/shared/domain/pagination";
import type { Repository, RequestContext } from "@/shared/domain/repository";
import { ApiError } from "./api-error";

function getBaseUrl(): string {
  const url = process.env.NEST_API_URL;
  if (!url) throw new Error("NEST_API_URL não configurado (necessário quando API_MODE=real)");
  return url;
}

function getTimeoutMs(): number {
  return Number(process.env.API_TIMEOUT_MS ?? "5000");
}

async function request<TResult>(
  path: string,
  init: Omit<RequestInit, "headers"> & { context?: RequestContext } = {},
): Promise<TResult> {
  const { context, ...requestInit } = init;
  const headers = new Headers({ "Content-Type": "application/json" });
  if (context?.token) headers.set("Authorization", `Bearer ${context.token}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      ...requestInit,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    throw new ApiError(502, `Falha ao conectar ao back-end real: ${(error as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 204) return undefined as TResult;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : "Erro no back-end real";
    throw new ApiError(response.status, message);
  }

  return payload as TResult;
}

/**
 * Implementação de Repository<T> que fala com o Nest.js real via HTTP,
 * usada quando API_MODE=real. Espelha o mesmo contrato REST do
 * InMemoryRepository (GET|POST /{resource}, GET|PATCH|DELETE
 * /{resource}/:id), então os Route Handlers que a consomem não mudam.
 */
export class HttpRepository<T extends BaseEntity> implements Repository<T> {
  constructor(private readonly resource: string) {}

  list(
    params: PaginationParams,
    filters?: Record<string, string>,
    context?: RequestContext,
  ): Promise<PaginatedResult<T>> {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
      ...filters,
    });
    return request<PaginatedResult<T>>(`/${this.resource}?${query.toString()}`, { context });
  }

  findById(id: string, context?: RequestContext): Promise<T | undefined> {
    return request<T>(`/${this.resource}/${id}`, { context });
  }

  create(input: Omit<T, "id" | "createdAt" | "updatedAt">, context?: RequestContext): Promise<T> {
    return request<T>(`/${this.resource}`, {
      method: "POST",
      body: JSON.stringify(input),
      context,
    });
  }

  update(
    id: string,
    patch: Partial<Omit<T, "id" | "createdAt">>,
    context?: RequestContext,
  ): Promise<T | undefined> {
    return request<T>(`/${this.resource}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
      context,
    });
  }

  async delete(id: string, context?: RequestContext): Promise<boolean> {
    await request<void>(`/${this.resource}/${id}`, { method: "DELETE", context });
    return true;
  }
}
