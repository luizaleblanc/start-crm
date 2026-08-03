import type { PaginationParams } from "@/shared/domain/pagination";

export function parsePagination(request: Request): PaginationParams {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 20,
  };
}

export function parseFilters(request: Request): Record<string, string> | undefined {
  const url = new URL(request.url);
  const filters: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key === "page" || key === "pageSize") continue;
    filters[key] = value;
  }
  return Object.keys(filters).length > 0 ? filters : undefined;
}
