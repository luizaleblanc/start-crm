import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Deal, DealStatus } from "@/modules/crm/domain/entities";
import type { PaginatedResult } from "@/shared/domain/pagination";
import { apiFetch } from "@/shared/infrastructure/http/api-client";

export function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: () => apiFetch<PaginatedResult<Deal>>("/api/deals?pageSize=100"),
  });
}

export function useCloseDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      dealId,
      status,
    }: {
      dealId: string;
      status: Extract<DealStatus, "won" | "lost">;
    }) =>
      apiFetch<Deal>(`/api/crm/deals/${dealId}/close`, {
        method: "PATCH",
        body: { status },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}
