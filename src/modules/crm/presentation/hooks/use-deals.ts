import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Deal, DealStatus } from "@/modules/crm/domain/entities";
import type { PaginatedResult } from "@/shared/domain/pagination";
import { apiFetch } from "@/shared/infrastructure/http/api-client";

interface RawDeal {
  id: string;
  leadId: string;
  closerId?: string | null;
  organizationId?: string;
  title?: string;
  value?: number | string;
  estimatedValue?: number | string | null;
  closedValue?: number | string | null;
  status: string;
  closedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

function normalizeDeal(raw: RawDeal): Deal {
  let status: DealStatus = "open";
  const stLower = (raw.status || "").toLowerCase();
  if (stLower === "ganho" || stLower === "won") {
    status = "won";
  } else if (stLower === "perdido" || stLower === "lost") {
    status = "lost";
  } else {
    status = "open";
  }

  const rawVal = raw.closedValue ?? raw.estimatedValue ?? raw.value ?? 0;
  const numValue = typeof rawVal === "number" ? rawVal : parseFloat(String(rawVal)) || 0;

  return {
    id: raw.id,
    organizationId: raw.organizationId ?? "",
    leadId: raw.leadId,
    title: raw.title || "Mentoria Tech",
    value: numValue,
    status,
    closedAt: raw.closedAt ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? raw.createdAt,
  };
}

export function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const result = await apiFetch<PaginatedResult<RawDeal>>("/api/deals?pageSize=1000");
      return {
        ...result,
        data: (result.data ?? []).map(normalizeDeal),
      };
    },
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
