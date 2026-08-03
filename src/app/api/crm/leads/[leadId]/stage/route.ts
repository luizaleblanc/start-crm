import { NextResponse } from "next/server";
import { changeLeadStage } from "@/modules/crm/application/change-lead-stage.use-case";
import { extractBearerToken, requireAuth } from "@/shared/infrastructure/auth/require-auth";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

export const PATCH = handleRoute<{ leadId: string }>(async (request, routeContext) => {
  requireAuth(request);
  const { leadId } = await routeContext.params;
  const { funnelStageId } = await request.json();
  const lead = await changeLeadStage(
    { leadId, funnelStageId },
    { token: extractBearerToken(request) },
  );
  return NextResponse.json(lead);
});
