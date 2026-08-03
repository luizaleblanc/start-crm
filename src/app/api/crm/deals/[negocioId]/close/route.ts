import { NextResponse } from "next/server";
import { closeDeal } from "@/modules/crm/application/close-deal.use-case";
import { extractBearerToken, requireAuth } from "@/shared/infrastructure/auth/require-auth";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

export const PATCH = handleRoute<{ negocioId: string }>(async (request, routeContext) => {
  requireAuth(request);
  const { negocioId } = await routeContext.params;
  const { status } = await request.json();
  const deal = await closeDeal(
    { dealId: negocioId, status },
    { token: extractBearerToken(request) },
  );
  return NextResponse.json(deal);
});
