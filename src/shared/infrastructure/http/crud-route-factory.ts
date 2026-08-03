import { NextResponse } from "next/server";
import type { BaseEntity } from "@/shared/domain/base-entity";
import type { Repository } from "@/shared/domain/repository";
import { extractBearerToken, requireAuth } from "@/shared/infrastructure/auth/require-auth";
import { ApiError } from "./api-error";
import { handleRoute } from "./handle-route";
import { parseFilters, parsePagination } from "./pagination";

export function createCollectionRoute<T extends BaseEntity>(repository: Repository<T>) {
  const GET = handleRoute(async (request) => {
    requireAuth(request);
    const result = await repository.list(parsePagination(request), parseFilters(request), {
      token: extractBearerToken(request),
    });
    return NextResponse.json(result);
  });

  const POST = handleRoute(async (request) => {
    requireAuth(request);
    const body = await request.json();
    const created = await repository.create(body, { token: extractBearerToken(request) });
    return NextResponse.json(created, { status: 201 });
  });

  return { GET, POST };
}

interface ItemParams {
  id: string;
}

export function createItemRoute<T extends BaseEntity>(repository: Repository<T>) {
  const GET = handleRoute<ItemParams>(async (request, routeContext) => {
    requireAuth(request);
    const { id } = await routeContext.params;
    const record = await repository.findById(id, { token: extractBearerToken(request) });
    if (!record) throw new ApiError(404, "Registro não encontrado");
    return NextResponse.json(record);
  });

  const PATCH = handleRoute<ItemParams>(async (request, routeContext) => {
    requireAuth(request);
    const { id } = await routeContext.params;
    const body = await request.json();
    const record = await repository.update(id, body, { token: extractBearerToken(request) });
    if (!record) throw new ApiError(404, "Registro não encontrado");
    return NextResponse.json(record);
  });

  const DELETE = handleRoute<ItemParams>(async (request, routeContext) => {
    requireAuth(request);
    const { id } = await routeContext.params;
    const deleted = await repository.delete(id, { token: extractBearerToken(request) });
    if (!deleted) throw new ApiError(404, "Registro não encontrado");
    return new NextResponse(null, { status: 204 });
  });

  return { GET, PATCH, DELETE };
}
