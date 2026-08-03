import { NextResponse } from "next/server";
import { scheduleMeeting } from "@/modules/crm/application/schedule-meeting.use-case";
import { requireAuth } from "@/shared/infrastructure/auth/require-auth";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

export const POST = handleRoute<{ leadId: string }>(async (request, context) => {
  requireAuth(request);
  const { leadId } = await context.params;
  const { userId, scheduledAt, notes } = await request.json();
  const meeting = scheduleMeeting({ leadId, userId, scheduledAt, notes });
  return NextResponse.json(meeting, { status: 201 });
});
