import { NextResponse } from "next/server";
import { addLeadInteraction } from "@/modules/crm/application/add-lead-interaction.use-case";
import { extractBearerToken, requireAuth } from "@/shared/infrastructure/auth/require-auth";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

export const POST = handleRoute<{ leadId: string }>(async (request, routeContext) => {
  requireAuth(request);
  const { leadId } = await routeContext.params;
  const { userId, type, notes } = await request.json();
  const interaction = await addLeadInteraction(
    { leadId, userId, type, notes },
    { token: extractBearerToken(request) },
  );
  return NextResponse.json(interaction, { status: 201 });
});
