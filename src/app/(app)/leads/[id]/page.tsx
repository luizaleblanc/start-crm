"use client";

import { Calendar, ChevronLeft, Mail, MessageCircle, Phone, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import type { LeadInteractionType } from "@/modules/crm/domain/entities";
import { useFunnelStages, useSources } from "@/modules/crm/presentation/hooks/use-catalog";
import { useDeals } from "@/modules/crm/presentation/hooks/use-deals";
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
import { TemperatureBadge } from "@/modules/crm/presentation/temperature-badge";
import { useAuth } from "@/shared/auth/auth-context";
import { Badge } from "@/shared/ui/badge";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { Input } from "@/shared/ui/input";
import { Modal } from "@/shared/ui/modal";
import { Select } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { Spinner } from "@/shared/ui/spinner";

const INTERACTION_TYPES: LeadInteractionType[] = ["call", "email", "whatsapp", "note"];

const INTERACTION_TYPE_LABELS: Record<LeadInteractionType, string> = {
  call: "Ligação",
  email: "E-mail",
  whatsapp: "WhatsApp",
  note: "Nota",
};

const DEAL_STATUS_LABELS: Record<string, string> = {
  open: "Em aberto",
  won: "Ganho",
  lost: "Perdido",
};

type DeleteTarget = { kind: "interaction" | "meeting"; id: string } | null;

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const leadQuery = useLead(id);
  const funnelStagesQuery = useFunnelStages();
  const sourcesQuery = useSources();
  const dealsQuery = useDeals();
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

  if (leadQuery.isError) {
    return <ErrorState title="Não foi possível carregar o lead" />;
  }

  if (leadQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!leadQuery.data) {
    return <EmptyState title="Lead não encontrado" description="Ele pode ter sido removido." />;
  }

  const lead = leadQuery.data;
  const funnelStages = funnelStagesQuery.data?.data ?? [];
  const sources = sourcesQuery.data?.data ?? [];
  const deals = dealsQuery.data?.data ?? [];
  const interactions = interactionsQuery.data?.data ?? [];
  const meetings = meetingsQuery.data?.data ?? [];

  const currentStage = funnelStages.find((stage) => stage.id === lead.funnelStageId);
  const source = sources.find((item) => item.id === lead.sourceId);
  const leadDeals = deals.filter((deal) => deal.leadId === lead.id);

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
      <Link
        href="/leads"
        className="inline-flex w-fit items-center gap-1.5 text-caption text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft aria-hidden size={16} />
        Voltar
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-h4 font-semibold text-foreground">{lead.name}</h1>
            {currentStage && <TemperatureBadge stage={currentStage} allStages={funnelStages} />}
          </div>
          <p className="text-caption text-muted-foreground">{lead.email}</p>
        </div>

        {lead.phone && (
          <div className="flex gap-2">
            <a
              href={`https://wa.me/${onlyDigits(lead.phone)}`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <MessageCircle aria-hidden size={16} />
              WhatsApp
            </a>
            <a
              href={`tel:${lead.phone}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Phone aria-hidden size={16} />
              Ligar
            </a>
            <a href="#reunioes" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Calendar aria-hidden size={16} />
              Agendar
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
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
                  onChange={(event) =>
                    setInteractionType(event.target.value as LeadInteractionType)
                  }
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
                  disabled={!isInteractionFormComplete}
                  isLoading={addInteraction.isPending}
                >
                  Registrar
                </Button>
              </form>

              {interactions.length === 0 ? (
                <EmptyState title="Nenhuma interação registrada" />
              ) : (
                <ul className="flex flex-col">
                  {interactions.map((interaction, index) => (
                    <li key={interaction.id} className="relative flex gap-3 pb-5 last:pb-0">
                      {index !== interactions.length - 1 && (
                        <span
                          aria-hidden
                          className="absolute left-4 top-8 h-[calc(100%-1.5rem)] w-px bg-border"
                        />
                      )}
                      <span className="border-primary/40 relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-card text-caption font-semibold text-primary">
                        {INTERACTION_TYPE_LABELS[interaction.type][0]}
                      </span>
                      <div className="flex min-w-0 flex-1 items-start justify-between gap-2 pt-0.5">
                        <div className="min-w-0">
                          <p className="text-body font-medium text-foreground">
                            {INTERACTION_TYPE_LABELS[interaction.type]}
                          </p>
                          <p className="text-caption text-muted-foreground">{interaction.notes}</p>
                          <p className="text-muted-foreground/70 mt-1 text-caption">
                            {new Date(interaction.createdAt).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="Excluir interação"
                          title="Excluir"
                          onClick={() =>
                            setDeleteTarget({ kind: "interaction", id: interaction.id })
                          }
                        >
                          <Trash2 aria-hidden size={14} />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card id="reunioes">
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
                  disabled={!isMeetingFormComplete}
                  isLoading={scheduleMeeting.isPending}
                >
                  Agendar
                </Button>
              </form>

              {meetings.length === 0 ? (
                <EmptyState title="Nenhuma reunião agendada" />
              ) : (
                <ul className="flex flex-col">
                  {meetings.map((meeting, index) => (
                    <li key={meeting.id} className="relative flex gap-3 pb-5 last:pb-0">
                      {index !== meetings.length - 1 && (
                        <span
                          aria-hidden
                          className="absolute left-4 top-8 h-[calc(100%-1.5rem)] w-px bg-border"
                        />
                      )}
                      <span className="border-primary/40 relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-card text-primary">
                        <Calendar aria-hidden size={14} />
                      </span>
                      <div className="flex min-w-0 flex-1 items-start justify-between gap-2 pt-0.5">
                        <div className="min-w-0">
                          <p className="text-body font-medium text-foreground">
                            {new Date(meeting.scheduledAt).toLocaleString("pt-BR")}
                          </p>
                          {meeting.notes && (
                            <p className="text-caption text-muted-foreground">{meeting.notes}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="Excluir reunião"
                          title="Excluir"
                          onClick={() => setDeleteTarget({ kind: "meeting", id: meeting.id })}
                        >
                          <Trash2 aria-hidden size={14} />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-h6 uppercase text-muted-foreground">Contato</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-2 text-body text-foreground hover:underline"
              >
                <Mail aria-hidden size={16} className="shrink-0 text-muted-foreground" />
                {lead.email}
              </a>
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-2 text-body text-foreground hover:underline"
                >
                  <Phone aria-hidden size={16} className="shrink-0 text-muted-foreground" />
                  {lead.phone}
                </a>
              )}
              <span className="flex items-center gap-2 text-body text-foreground">
                <Tag aria-hidden size={16} className="shrink-0 text-muted-foreground" />
                Origem: {source?.name ?? "—"}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estágio do funil</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Select
                className="w-full"
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
              {changeStage.isPending && <Spinner size={14} className="shrink-0" />}
            </CardContent>
          </Card>

          {leadDeals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-h6 uppercase text-muted-foreground">Negócio</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {leadDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-body text-foreground">{deal.title}</p>
                      <p className="text-caption text-muted-foreground">
                        {DEAL_STATUS_LABELS[deal.status] ?? deal.status}
                      </p>
                    </div>
                    <Badge
                      variant={
                        deal.status === "won"
                          ? "success"
                          : deal.status === "lost"
                            ? "muted"
                            : "default"
                      }
                    >
                      {deal.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
            <Button variant="primary" isLoading={isDeletingTarget} onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
