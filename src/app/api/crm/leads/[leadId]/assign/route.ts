import { NextResponse } from "next/server";
import { assignLead } from "@/modules/crm/application/assign-lead.use-case";
import { requireAuth } from "@/shared/infrastructure/auth/require-auth";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

export const POST = handleRoute<{ leadId: string }>(async (request, context) => {
  requireAuth(request);
  const { leadId } = await context.params;
  const { userId } = await request.json();
  const ownership = assignLead({ leadId, userId });
  return NextResponse.json(ownership, { status: 201 });
});
