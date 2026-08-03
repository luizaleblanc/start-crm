import { ApiError } from "@/shared/infrastructure/http/api-error";
import type { DealStatus } from "../domain/entities";
import { dealsRepository } from "../infrastructure/repositories";

interface CloseDealInput {
  dealId: string;
  status: Extract<DealStatus, "won" | "lost">;
}

export function closeDeal({ dealId, status }: CloseDealInput) {
  const deal = dealsRepository.update(dealId, { status, closedAt: new Date().toISOString() });
  if (!deal) throw new ApiError(404, "Negócio não encontrado");
  return deal;
}
