import { NextResponse } from "next/server";
import { assignLead } from "@/modules/crm/application/assign-lead.use-case";
import { extractBearerToken, requireAuth } from "@/shared/infrastructure/auth/require-auth";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

export const POST = handleRoute<{ leadId: string }>(async (request, routeContext) => {
  requireAuth(request);
  const { leadId } = await routeContext.params;
  const { userId } = await request.json();
  const ownership = await assignLead({ leadId, userId }, { token: extractBearerToken(request) });
  return NextResponse.json(ownership, { status: 201 });
});
