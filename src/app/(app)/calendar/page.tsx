"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  RefreshCw,
  User,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLeads } from "@/modules/crm/presentation/hooks/use-leads";
import { apiFetch } from "@/shared/infrastructure/http/api-client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Modal } from "@/shared/ui/modal";
import { Select } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/ui/cn";

interface GoogleEvent {
  id: string;
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  htmlLink: string;
  status: string;
  conferenceData?: { entryPoints?: Array<{ uri: string; label: string }> };
  lead?: { id: string; name: string; email: string; phone: string; company?: string };
}

interface CalendarApiResponse {
  kind: string;
  summary: string;
  timeZone: string;
  items: GoogleEvent[];
}

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const leadsQuery = useLeads(1, 1500);
  const leads = useMemo(() => leadsQuery.data?.data ?? [], [leadsQuery.data?.data]);

  const calendarQuery = useQuery({
    queryKey: ["google-calendar-events"],
    queryFn: () => apiFetch<CalendarApiResponse>("/api/integrations/google-calendar"),
  });

  const events = useMemo(() => calendarQuery.data?.items ?? [], [calendarQuery.data?.items]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulário de nova reunião
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [title, setTitle] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [notes, setNotes] = useState("");

  const scheduleMutation = useMutation({
    mutationFn: (body: {
      summary: string;
      description: string;
      startDateTime: string;
      leadId: string;
      attendeeEmail?: string;
      attendeeName?: string;
    }) =>
      apiFetch("/api/integrations/google-calendar", {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setIsModalOpen(false);
      setTitle("");
      setStartDateTime("");
      setNotes("");
      setSelectedLeadId("");
    },
  });

  function handleSchedule(event: FormEvent) {
    event.preventDefault();
    if (!startDateTime || !selectedLeadId) return;

    const chosenLead = leads.find((l) => l.id === selectedLeadId);

    scheduleMutation.mutate({
      summary: title || `Reunião Comercial — ${chosenLead?.name ?? "Lead"}`,
      description: notes,
      startDateTime,
      leadId: selectedLeadId,
      attendeeEmail: chosenLead?.email,
      attendeeName: chosenLead?.name,
    });
  }

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime(),
    );
  }, [events]);

  const isLoading = calendarQuery.isLoading;

  return (
    <div className="flex flex-col gap-6">
      {/* Header com Status do Google Calendar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Calendário & Reuniões
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={12} />
              Google Calendar v3 Conectado
            </span>
          </div>
          <p className="text-caption text-muted-foreground sm:text-body">
            Sincronização em tempo real com Google Workspace e links automáticos do Google Meet.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => calendarQuery.refetch()}
            isLoading={calendarQuery.isFetching}
            className="shadow-xs rounded-full"
          >
            <RefreshCw size={14} className={cn(calendarQuery.isFetching && "animate-spin")} />
            Atualizar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="shadow-xs rounded-full"
          >
            <Plus size={14} />
            Agendar Reunião
          </Button>
        </div>
      </div>

      {/* Grid de Métricas de Agendamento */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="shadow-xs flex items-center justify-between rounded-2xl bg-card p-5">
          <div className="flex flex-col">
            <span className="text-caption font-medium text-muted-foreground">
              Total de Reuniões
            </span>
            <span className="text-2xl font-extrabold text-foreground">{events.length}</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <CalendarIcon size={18} />
          </div>
        </div>

        <div className="shadow-xs flex items-center justify-between rounded-2xl bg-card p-5">
          <div className="flex flex-col">
            <span className="text-caption font-medium text-muted-foreground">
              Com Link Google Meet
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {events.filter((e) => e.conferenceData?.entryPoints?.length).length}
            </span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Video size={18} />
          </div>
        </div>

        <div className="shadow-xs flex items-center justify-between rounded-2xl bg-card p-5">
          <div className="flex flex-col">
            <span className="text-caption font-medium text-muted-foreground">Fuso Horário</span>
            <span className="text-body font-semibold text-foreground">America/São Paulo (BRT)</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Clock size={18} />
          </div>
        </div>
      </div>

      {/* Lista de Reuniões Agendadas */}
      <div className="shadow-xs flex flex-col gap-4 rounded-2xl bg-card p-6">
        <div className="border-border/40 flex items-center justify-between border-b pb-4">
          <h2 className="text-body font-bold text-foreground">Próximos Compromissos</h2>
          <span className="text-caption text-muted-foreground">
            {sortedEvents.length} compromissos no funil
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3 py-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="py-12 text-center text-caption text-muted-foreground">
            Nenhuma reunião agendada no momento. Clique em &quot;Agendar Reunião&quot; para marcar
            com um lead.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedEvents.map((evt) => {
              const startDate = new Date(evt.start.dateTime);
              const meetUrl = evt.conferenceData?.entryPoints?.[0]?.uri;

              return (
                <div
                  key={evt.id}
                  className="hover:border-border/80 border-border/40 bg-background/50 flex flex-col justify-between gap-4 rounded-xl border p-4 transition-all sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-500/10 font-semibold text-blue-600 dark:text-blue-400">
                      <span className="text-[10px] uppercase leading-none">
                        {startDate.toLocaleDateString("pt-BR", { month: "short" })}
                      </span>
                      <span className="text-lg leading-tight">{startDate.getDate()}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-body font-bold text-foreground">{evt.summary}</span>
                        <span className="bg-muted/60 rounded-full px-2 py-0.5 text-[10px] font-semibold text-foreground">
                          {startDate.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
                        {evt.lead && (
                          <Link
                            href={`/leads/${evt.lead.id}`}
                            className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary hover:underline"
                          >
                            <User size={13} />
                            {evt.lead.name}
                            {evt.lead.company && ` (${evt.lead.company})`}
                          </Link>
                        )}
                        {evt.description && (
                          <span className="line-clamp-1 max-w-[320px] text-muted-foreground">
                            • {evt.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {meetUrl && (
                      <a
                        href={meetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-caption font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
                      >
                        <Video size={13} />
                        Entrar no Meet
                      </a>
                    )}
                    <a
                      href={evt.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-muted border-border/50 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-caption font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ExternalLink size={12} />
                      Google Calendar
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Agendamento */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Reunião Comercial"
      >
        <form className="flex flex-col gap-4" onSubmit={handleSchedule}>
          <div>
            <label className="mb-1 block text-caption font-medium text-foreground">
              Selecionar Lead (1.005 disponíveis)
            </label>
            <Select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              required
              className="w-full"
            >
              <option value="">Selecione um lead...</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.company ? `— ${l.company}` : ""} ({l.email || l.phone})
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Título / Pauta da Reunião"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Apresentação de Proposta e Fechamento"
            required
          />

          <Input
            label="Data e Horário"
            type="datetime-local"
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
            required
          />

          <Input
            label="Notas Internas / Observações"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anotações para a equipe comercial..."
          />

          <div className="border-border/40 bg-muted/30 rounded-lg border p-3 text-[11px] text-muted-foreground">
            O convite será enviado automaticamente com sala do <strong>Google Meet</strong>{" "}
            vinculada à conta Google Workspace.
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={scheduleMutation.isPending}>
              Confirmar Agendamento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
