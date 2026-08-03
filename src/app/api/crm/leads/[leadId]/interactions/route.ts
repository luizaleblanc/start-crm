import { NextResponse } from "next/server";
import { addLeadInteraction } from "@/modules/crm/application/add-lead-interaction.use-case";
import { requireAuth } from "@/shared/infrastructure/auth/require-auth";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

export const POST = handleRoute<{ leadId: string }>(async (request, context) => {
  requireAuth(request);
  const { leadId } = await context.params;
  const { userId, type, notes } = await request.json();
  const interaction = addLeadInteraction({ leadId, userId, type, notes });
  return NextResponse.json(interaction, { status: 201 });
});
