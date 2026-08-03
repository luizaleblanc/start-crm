"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import type { LeadInteractionType } from "@/modules/crm/domain/entities";
import { useFunnelStages } from "@/modules/crm/presentation/hooks/use-catalog";
import {
  useAddLeadInteraction,
  useChangeLeadStage,
  useLead,
  useLeadInteractions,
  useLeadMeetings,
  useScheduleMeeting,
} from "@/modules/crm/presentation/hooks/use-leads";
import { useAuth } from "@/shared/auth/auth-context";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";

const INTERACTION_TYPES: LeadInteractionType[] = ["call", "email", "whatsapp", "note"];

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const leadQuery = useLead(id);
  const funnelStagesQuery = useFunnelStages();
  const interactionsQuery = useLeadInteractions(id);
  const meetingsQuery = useLeadMeetings(id);

  const changeStage = useChangeLeadStage(id);
  const addInteraction = useAddLeadInteraction(id);
  const scheduleMeeting = useScheduleMeeting(id);

  const [interactionNotes, setInteractionNotes] = useState("");
  const [interactionType, setInteractionType] = useState<LeadInteractionType>("note");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");

  if (leadQuery.isLoading) {
    return <p className="text-muted-foreground">Carregando…</p>;
  }

  if (!leadQuery.data) {
    return <p className="text-muted-foreground">Lead não encontrado.</p>;
  }

  const lead = leadQuery.data;
  const funnelStages = funnelStagesQuery.data?.data ?? [];
  const interactions = interactionsQuery.data?.data ?? [];
  const meetings = meetingsQuery.data?.data ?? [];

  function handleAddInteraction(event: FormEvent) {
    event.preventDefault();
    if (!user || !interactionNotes.trim()) return;
    addInteraction.mutate(
      { userId: user.id, type: interactionType, notes: interactionNotes },
      { onSuccess: () => setInteractionNotes("") },
    );
  }

  function handleScheduleMeeting(event: FormEvent) {
    event.preventDefault();
    if (!user || !meetingDate) return;
    scheduleMeeting.mutate(
      { userId: user.id, scheduledAt: new Date(meetingDate).toISOString(), notes: meetingNotes },
      {
        onSuccess: () => {
          setMeetingDate("");
          setMeetingNotes("");
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{lead.name}</CardTitle>
          <p className="text-caption text-muted-foreground">
            {lead.email} · {lead.phone}
          </p>
        </CardHeader>
        <CardContent className="flex items-end gap-4">
          <Select
            label="Estágio do funil"
            className="w-56"
            value={lead.funnelStageId}
            disabled={changeStage.isPending}
            onChange={(event) => changeStage.mutate(event.target.value)}
          >
            {funnelStages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </Select>
          {changeStage.isPending && (
            <span className="text-caption text-muted-foreground">Salvando…</span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interações</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form className="flex flex-wrap items-end gap-3" onSubmit={handleAddInteraction}>
            <Select
              label="Tipo"
              className="w-40"
              value={interactionType}
              onChange={(event) => setInteractionType(event.target.value as LeadInteractionType)}
            >
              {INTERACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
            <Input
              label="Notas"
              className="min-w-64 flex-1"
              value={interactionNotes}
              onChange={(event) => setInteractionNotes(event.target.value)}
              placeholder="O que aconteceu?"
            />
            <Button type="submit" disabled={addInteraction.isPending}>
              Registrar
            </Button>
          </form>

          <ul className="flex flex-col gap-3">
            {interactions.length === 0 && (
              <li className="text-caption text-muted-foreground">Nenhuma interação registrada.</li>
            )}
            {interactions.map((interaction) => (
              <li key={interaction.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <Badge variant="muted">{interaction.type}</Badge>
                  <span className="text-caption text-muted-foreground">
                    {new Date(interaction.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="mt-2 text-body text-foreground">{interaction.notes}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reuniões</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form className="flex flex-wrap items-end gap-3" onSubmit={handleScheduleMeeting}>
            <Input
              label="Data e hora"
              type="datetime-local"
              value={meetingDate}
              onChange={(event) => setMeetingDate(event.target.value)}
              required
            />
            <Input
              label="Notas"
              className="min-w-64 flex-1"
              value={meetingNotes}
              onChange={(event) => setMeetingNotes(event.target.value)}
              placeholder="Pauta da reunião"
            />
            <Button type="submit" disabled={scheduleMeeting.isPending}>
              Agendar
            </Button>
          </form>

          <ul className="flex flex-col gap-3">
            {meetings.length === 0 && (
              <li className="text-caption text-muted-foreground">Nenhuma reunião agendada.</li>
            )}
            {meetings.map((meeting) => (
              <li key={meeting.id} className="rounded-md border border-border p-3">
                <p className="text-body text-foreground">
                  {new Date(meeting.scheduledAt).toLocaleString("pt-BR")}
                </p>
                {meeting.notes && (
                  <p className="mt-1 text-caption text-muted-foreground">{meeting.notes}</p>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
