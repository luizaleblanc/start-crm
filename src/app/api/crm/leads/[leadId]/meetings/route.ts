import { NextResponse } from "next/server";
import { scheduleMeeting } from "@/modules/crm/application/schedule-meeting.use-case";
import { extractBearerToken, requireAuth } from "@/shared/infrastructure/auth/require-auth";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

export const POST = handleRoute<{ leadId: string }>(async (request, routeContext) => {
  requireAuth(request);
  const { leadId } = await routeContext.params;
  const { userId, scheduledAt, notes } = await request.json();
  const meeting = await scheduleMeeting(
    { leadId, userId, scheduledAt, notes },
    { token: extractBearerToken(request) },
  );
  return NextResponse.json(meeting, { status: 201 });
});
