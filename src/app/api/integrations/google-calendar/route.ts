import { NextResponse } from "next/server";
import {
  leadsRepository,
  meetingsRepository,
  leadInteractionsRepository,
} from "@/modules/crm/infrastructure/repositories";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";
import { requireAuth } from "@/shared/infrastructure/auth/require-auth";

interface CreateCalendarEventBody {
  summary?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  leadId?: string;
  attendeeEmail?: string;
  attendeeName?: string;
}

export const GET = handleRoute(async (request) => {
  requireAuth(request);

  const meetingsResult = await meetingsRepository.list({ page: 1, pageSize: 100 });
  const leadsResult = await leadsRepository.list({ page: 1, pageSize: 1500 });
  const leadMap = new Map(leadsResult.data.map((l) => [l.id, l]));

  const googleEvents = meetingsResult.data.map((m) => {
    const lead = leadMap.get(m.leadId);
    const startDate = new Date(m.scheduledAt);
    const endDate = new Date(startDate.getTime() + 45 * 60 * 1000); // 45 min duração padrão

    return {
      kind: "calendar#event",
      id: m.id,
      status: "confirmed",
      htmlLink: `https://calendar.google.com/calendar/u/0/r/eventedit/${m.id}`,
      created: m.createdAt,
      updated: m.updatedAt,
      summary: m.notes ? `Reunião: ${m.notes}` : `Alinhamento Comercial — ${lead?.name ?? "Lead"}`,
      description: `Reunião comercial agendada via Start CRM com ${lead?.name ?? "Lead"}.\nEmpresa: ${lead?.company ?? "Não informada"}\nTelefone: ${lead?.phone ?? "Não informado"}\nNotas: ${m.notes ?? ""}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      attendees: lead?.email
        ? [
            {
              email: "notificacoes@startcrm.com.br",
              displayName: "Start CRM Team",
              responseStatus: "accepted",
            },
            { email: lead.email, displayName: lead.name, responseStatus: "needsAction" },
          ]
        : [
            {
              email: "notificacoes@startcrm.com.br",
              displayName: "Start CRM Team",
              responseStatus: "accepted",
            },
          ],
      conferenceData: {
        entryPoints: [
          {
            entryPointType: "video",
            uri: `https://meet.google.com/crm-${m.id.replace(/[^a-z0-9]/gi, "").slice(-9)}`,
            label: "meet.google.com",
          },
        ],
      },
      lead: lead
        ? {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
          }
        : null,
    };
  });

  return NextResponse.json({
    kind: "calendar#events",
    summary: "Start CRM — Google Workspace Calendar",
    timeZone: "America/Sao_Paulo",
    defaultReminders: [
      { method: "popup", minutes: 10 },
      { method: "email", minutes: 30 },
    ],
    items: googleEvents,
  });
});

export const POST = handleRoute(async (request) => {
  requireAuth(request);

  const body = (await request.json()) as CreateCalendarEventBody;
  const { summary, description, startDateTime, leadId, attendeeEmail, attendeeName } = body;

  if (!startDateTime) {
    throw new ApiError(400, "startDateTime é obrigatório no padrão ISO 8601");
  }

  const scheduledAt = new Date(startDateTime).toISOString();
  const notes = summary || description || "Alinhamento de Proposta Comercial";

  const targetLeadId = leadId || "lead_1";

  // Cria a reunião no repositório de meetings
  const meeting = await meetingsRepository.create({
    leadId: targetLeadId,
    userId: "user_admin",
    scheduledAt,
    notes,
  });

  // Registra a interação no histórico do lead
  try {
    await leadInteractionsRepository.create({
      leadId: targetLeadId,
      userId: "user_admin",
      type: "note",
      notes: `Reunião agendada via Google Calendar para ${new Date(scheduledAt).toLocaleString("pt-BR")}: "${notes}"`,
    });
  } catch (err) {
    console.warn("[calendar] Não foi possível registrar interação:", err);
  }

  const startDate = new Date(scheduledAt);
  const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);
  const meetCode = `meet.google.com/str-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;

  return NextResponse.json(
    {
      kind: "calendar#event",
      id: meeting.id,
      status: "confirmed",
      htmlLink: `https://calendar.google.com/calendar/u/0/r/eventedit/${meeting.id}`,
      summary: notes,
      description: description || `Reunião com ${attendeeName || "Lead"} agendada via Start CRM`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      conferenceData: {
        entryPoints: [{ entryPointType: "video", uri: `https://${meetCode}`, label: meetCode }],
      },
      attendees: attendeeEmail ? [{ email: attendeeEmail, displayName: attendeeName }] : [],
    },
    { status: 201 },
  );
});
