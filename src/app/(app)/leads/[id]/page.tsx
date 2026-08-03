"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import type { LeadInteractionType } from "@/modules/crm/domain/entities";
import { useFunnelStages } from "@/modules/crm/presentation/hooks/use-catalog";
import {
  useAddLeadInteraction,
  useChangeLeadStage,
  useDeleteLeadInteraction,
  useDeleteMeeting,
  useLead,
  useLeadInteractions,
  useLeadMeetings,
  useScheduleMeeting,
} from "@/modules/crm/presentation/hooks/use-leads";
import { getStageTemperatureColor } from "@/modules/crm/presentation/lead-temperature";
import { useAuth } from "@/shared/auth/auth-context";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Modal } from "@/shared/ui/modal";
import { Select } from "@/shared/ui/select";

const INTERACTION_TYPES: LeadInteractionType[] = ["call", "email", "whatsapp", "note"];

const INTERACTION_TYPE_LABELS: Record<LeadInteractionType, string> = {
  call: "Ligação",
  email: "E-mail",
  whatsapp: "WhatsApp",
  note: "Nota",
};

type DeleteTarget = { kind: "interaction" | "meeting"; id: string } | null;

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
  const deleteInteraction = useDeleteLeadInteraction(id);
  const deleteMeeting = useDeleteMeeting(id);

  const [interactionNotes, setInteractionNotes] = useState("");
  const [interactionType, setInteractionType] = useState<LeadInteractionType>("note");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

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

  const currentStage = funnelStages.find((stage) => stage.id === lead.funnelStageId);
  const temperatureColor = currentStage
    ? getStageTemperatureColor(currentStage, funnelStages)
    : undefined;

  const isInteractionFormComplete = interactionNotes.trim().length > 0;
  const isMeetingFormComplete = meetingDate.trim().length > 0 && meetingNotes.trim().length > 0;
  const isDeletingTarget = deleteInteraction.isPending || deleteMeeting.isPending;

  function handleAddInteraction(event: FormEvent) {
    event.preventDefault();
    if (!user || !isInteractionFormComplete) return;
    addInteraction.mutate(
      { userId: user.id, type: interactionType, notes: interactionNotes },
      { onSuccess: () => setInteractionNotes("") },
    );
  }

  function handleScheduleMeeting(event: FormEvent) {
    event.preventDefault();
    if (!user || !isMeetingFormComplete) return;
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

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    const mutation = deleteTarget.kind === "interaction" ? deleteInteraction : deleteMeeting;
    mutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle
            className="inline-block w-fit"
            style={temperatureColor ? { borderBottom: `2px solid ${temperatureColor}` } : undefined}
          >
            {lead.name}
          </CardTitle>
          <p className="text-caption text-muted-foreground">
            {lead.email} · {lead.phone}
          </p>
        </CardHeader>
        <CardContent className="flex items-start gap-4">
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
            <span className="mt-8 text-caption text-muted-foreground">Salvando…</span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interações</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <form className="flex flex-col gap-4" onSubmit={handleAddInteraction}>
            <Select
              label="Tipo"
              className="w-40"
              value={interactionType}
              onChange={(event) => setInteractionType(event.target.value as LeadInteractionType)}
            >
              {INTERACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {INTERACTION_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
            <Input
              label="Notas"
              className="w-full"
              value={interactionNotes}
              onChange={(event) => setInteractionNotes(event.target.value)}
              placeholder="Sobre a conversão..."
            />
            <Button
              type="submit"
              className="self-start"
              disabled={!isInteractionFormComplete || addInteraction.isPending}
            >
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
                  <div className="flex items-center gap-2">
                    <Badge variant="muted">{INTERACTION_TYPE_LABELS[interaction.type]}</Badge>
                    <span className="text-caption text-muted-foreground">
                      {new Date(interaction.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget({ kind: "interaction", id: interaction.id })}
                  >
                    Excluir
                  </Button>
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
        <CardContent className="flex flex-col gap-6">
          <form className="flex flex-col gap-4" onSubmit={handleScheduleMeeting}>
            <Input
              label="Data e hora"
              type="datetime-local"
              className="w-56"
              value={meetingDate}
              onChange={(event) => setMeetingDate(event.target.value)}
              required
            />
            <Input
              label="Notas"
              className="w-full"
              value={meetingNotes}
              onChange={(event) => setMeetingNotes(event.target.value)}
              placeholder="Pauta da reunião"
            />
            <Button
              type="submit"
              className="self-start"
              disabled={!isMeetingFormComplete || scheduleMeeting.isPending}
            >
              Agendar
            </Button>
          </form>

          <ul className="flex flex-col gap-3">
            {meetings.length === 0 && (
              <li className="text-caption text-muted-foreground">Nenhuma reunião agendada.</li>
            )}
            {meetings.map((meeting) => (
              <li key={meeting.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-body text-foreground">
                    {new Date(meeting.scheduledAt).toLocaleString("pt-BR")}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget({ kind: "meeting", id: meeting.id })}
                  >
                    Excluir
                  </Button>
                </div>
                {meeting.notes && (
                  <p className="mt-1 text-caption text-muted-foreground">{meeting.notes}</p>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={deleteTarget?.kind === "meeting" ? "Excluir reunião" : "Excluir interação"}
      >
        <div className="flex flex-col gap-4">
          <p className="text-body text-muted-foreground">
            Tem certeza que deseja excluir? Essa ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="primary" disabled={isDeletingTarget} onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
