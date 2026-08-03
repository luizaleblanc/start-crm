import { NextResponse } from "next/server";
import type { BaseEntity } from "@/shared/domain/base-entity";
import { requireAuth } from "@/shared/infrastructure/auth/require-auth";
import type { InMemoryRepository } from "@/shared/infrastructure/mock/in-memory-repository";
import { ApiError } from "./api-error";
import { handleRoute } from "./handle-route";
import { parseFilters, parsePagination } from "./pagination";

export function createCollectionRoute<T extends BaseEntity>(repository: InMemoryRepository<T>) {
  const GET = handleRoute(async (request) => {
    requireAuth(request);
    return NextResponse.json(repository.list(parsePagination(request), parseFilters(request)));
  });

  const POST = handleRoute(async (request) => {
    requireAuth(request);
    const body = await request.json();
    return NextResponse.json(repository.create(body), { status: 201 });
  });

  return { GET, POST };
}

interface ItemParams {
  id: string;
}

export function createItemRoute<T extends BaseEntity>(repository: InMemoryRepository<T>) {
  const GET = handleRoute<ItemParams>(async (request, context) => {
    requireAuth(request);
    const { id } = await context.params;
    const record = repository.findById(id);
    if (!record) throw new ApiError(404, "Registro não encontrado");
    return NextResponse.json(record);
  });

  const PATCH = handleRoute<ItemParams>(async (request, context) => {
    requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const record = repository.update(id, body);
    if (!record) throw new ApiError(404, "Registro não encontrado");
    return NextResponse.json(record);
  });

  const DELETE = handleRoute<ItemParams>(async (request, context) => {
    requireAuth(request);
    const { id } = await context.params;
    const deleted = repository.delete(id);
    if (!deleted) throw new ApiError(404, "Registro não encontrado");
    return new NextResponse(null, { status: 204 });
  });

  return { GET, PATCH, DELETE };
}
