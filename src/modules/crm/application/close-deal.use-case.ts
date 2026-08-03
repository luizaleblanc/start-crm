import type { RequestContext } from "@/shared/domain/repository";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import type { DealStatus } from "../domain/entities";
import { dealsRepository } from "../infrastructure/repositories";

interface CloseDealInput {
  dealId: string;
  status: Extract<DealStatus, "won" | "lost">;
}

export async function closeDeal({ dealId, status }: CloseDealInput, context?: RequestContext) {
  const deal = await dealsRepository.update(
    dealId,
    { status, closedAt: new Date().toISOString() },
    context,
  );
  if (!deal) throw new ApiError(404, "Negócio não encontrado");
  return deal;
}
