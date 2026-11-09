import { useQuery } from "@tanstack/react-query";
import type { FunnelStage, Source } from "@/modules/crm/domain/entities";
import type { PaginatedResult } from "@/shared/domain/pagination";
import { apiFetch } from "@/shared/infrastructure/http/api-client";

export function useFunnelStages() {
  return useQuery({
    queryKey: ["funnel-stages"],
    queryFn: async () => {
      const result = await apiFetch<PaginatedResult<FunnelStage>>(
        "/api/funnel-stages?pageSize=100",
      );
      return {
        ...result,
        data: Array.isArray(result?.data) ? result.data : [],
      };
    },
  });
}

export function useSources() {
  return useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const result = await apiFetch<PaginatedResult<Source>>("/api/sources?pageSize=100");
      return {
        ...result,
        data: Array.isArray(result?.data) ? result.data : [],
      };
    },
  });
}
