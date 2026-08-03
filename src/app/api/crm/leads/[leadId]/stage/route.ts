import { NextResponse } from "next/server";
import { changeLeadStage } from "@/modules/crm/application/change-lead-stage.use-case";
import { requireAuth } from "@/shared/infrastructure/auth/require-auth";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

export const PATCH = handleRoute<{ leadId: string }>(async (request, context) => {
  requireAuth(request);
  const { leadId } = await context.params;
  const { funnelStageId } = await request.json();
  const lead = changeLeadStage({ leadId, funnelStageId });
  return NextResponse.json(lead);
});
