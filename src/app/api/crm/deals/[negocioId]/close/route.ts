import { NextResponse } from "next/server";
import { closeDeal } from "@/modules/crm/application/close-deal.use-case";
import { requireAuth } from "@/shared/infrastructure/auth/require-auth";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

export const PATCH = handleRoute<{ negocioId: string }>(async (request, context) => {
  requireAuth(request);
  const { negocioId } = await context.params;
  const { status } = await request.json();
  const deal = closeDeal({ dealId: negocioId, status });
  return NextResponse.json(deal);
});
