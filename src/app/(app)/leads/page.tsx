"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FunnelStage, Lead } from "@/modules/crm/domain/entities";
import { useFunnelStages, useSources } from "@/modules/crm/presentation/hooks/use-catalog";
import { useLeads } from "@/modules/crm/presentation/hooks/use-leads";
import {
  getStageTemperatureColor,
  getStageTemperatureColorAlpha,
} from "@/modules/crm/presentation/lead-temperature";
import { TemperatureBadge } from "@/modules/crm/presentation/temperature-badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Select } from "@/shared/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

type ViewMode = "table" | "kanban";

export default function LeadsPage() {
  const leadsQuery = useLeads(1, 100);
  const funnelStagesQuery = useFunnelStages();
  const sourcesQuery = useSources();

  const [view, setView] = useState<ViewMode>("table");
  const [stageFilter, setStageFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const leads = leadsQuery.data?.data ?? [];
  const funnelStages = useMemo(
    () => [...(funnelStagesQuery.data?.data ?? [])].sort((a, b) => a.order - b.order),
    [funnelStagesQuery.data],
  );
  const sources = sourcesQuery.data?.data ?? [];

  const stageById = useMemo(
    () => new Map(funnelStages.map((stage) => [stage.id, stage])),
    [funnelStages],
  );
  const sourceNameById = useMemo(
    () => new Map((sourcesQuery.data?.data ?? []).map((source) => [source.id, source.name])),
    [sourcesQuery.data],
  );

  const filteredLeads = leads.filter((lead) => {
    if (stageFilter && lead.funnelStageId !== stageFilter) return false;
    if (sourceFilter && lead.sourceId !== sourceFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <span className="self-center text-caption font-medium text-muted-foreground">
            Filtrar por
          </span>
          <Select
            label="Estágio"
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
            className="w-48"
          >
            <option value="">Todos</option>
            {funnelStages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </Select>
          <Select
            label="Origem"
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            className="w-48"
          >
            <option value="">Todas</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={view === "table" ? "primary" : "outline"}
            size="sm"
            onClick={() => setView("table")}
          >
            Tabela
          </Button>
          <Button
            type="button"
            variant={view === "kanban" ? "primary" : "outline"}
            size="sm"
            onClick={() => setView("kanban")}
          >
            Kanban
          </Button>
        </div>
      </div>

      <p className="flex items-center gap-2 text-caption text-muted-foreground">
        Temperatura do lead:
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className="h-2 w-2 rounded-full bg-[#3b82f6]" />
          Frio
        </span>
        <span aria-hidden>→</span>
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className="h-2 w-2 rounded-full bg-[#ef4444]" />
          Quente
        </span>
      </p>

      {view === "table" ? (
        <LeadsTableView
          leads={filteredLeads}
          isLoading={leadsQuery.isLoading}
          stageById={stageById}
          funnelStages={funnelStages}
          sourceNameById={sourceNameById}
        />
      ) : (
        <LeadsKanbanView
          leads={filteredLeads}
          funnelStages={funnelStages}
          sourceNameById={sourceNameById}
        />
      )}
    </div>
  );
}

interface LeadsTableViewProps {
  leads: Lead[];
  isLoading: boolean;
  stageById: Map<string, FunnelStage>;
  funnelStages: FunnelStage[];
  sourceNameById: Map<string, string>;
}

function LeadsTableView({
  leads,
  isLoading,
  stageById,
  funnelStages,
  sourceNameById,
}: LeadsTableViewProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Origem</TableHead>
          <TableHead>Estágio</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && (
          <TableRow>
            <TableCell colSpan={4} className="text-muted-foreground">
              Carregando…
            </TableCell>
          </TableRow>
        )}
        {!isLoading && leads.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-muted-foreground">
              Nenhum lead encontrado.
            </TableCell>
          </TableRow>
        )}
        {leads.map((lead) => {
          const stage = stageById.get(lead.funnelStageId);
          const color = stage ? getStageTemperatureColor(stage, funnelStages) : undefined;
          return (
            <TableRow key={lead.id}>
              <TableCell>
                <Link
                  href={`/leads/${lead.id}`}
                  className="inline-block text-foreground"
                  style={color ? { borderBottom: `2px solid ${color}` } : undefined}
                >
                  {lead.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{lead.email}</TableCell>
              <TableCell>{sourceNameById.get(lead.sourceId) ?? lead.sourceId}</TableCell>
              <TableCell>
                {stage ? (
                  <TemperatureBadge stage={stage} allStages={funnelStages} />
                ) : (
                  lead.funnelStageId
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

interface LeadsKanbanViewProps {
  leads: Lead[];
  funnelStages: FunnelStage[];
  sourceNameById: Map<string, string>;
}

function LeadsKanbanView({ leads, funnelStages, sourceNameById }: LeadsKanbanViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {funnelStages.map((stage) => {
        const color = getStageTemperatureColor(stage, funnelStages);
        const backgroundTint = getStageTemperatureColorAlpha(stage, funnelStages, 0.1);
        const stageLeads = leads.filter((lead) => lead.funnelStageId === stage.id);

        return (
          <div key={stage.id} className="flex flex-col gap-3">
            <div
              className="flex items-center justify-between rounded-md px-3 py-2"
              style={{ backgroundColor: backgroundTint }}
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-caption font-medium text-foreground">{stage.name}</span>
              </div>
              <span className="text-caption text-muted-foreground">{stageLeads.length}</span>
            </div>

            {stageLeads.length === 0 && (
              <p className="text-caption text-muted-foreground">Nenhum lead.</p>
            )}

            {stageLeads.map((lead) => (
              <Link key={lead.id} href={`/leads/${lead.id}`}>
                <Card
                  className="transition-shadow hover:shadow-md"
                  style={{ borderLeft: `3px solid ${color}` }}
                >
                  <CardHeader>
                    <p className="text-body font-semibold text-foreground">{lead.name}</p>
                    <p className="text-caption text-muted-foreground">{lead.email}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-caption text-muted-foreground">
                      {sourceNameById.get(lead.sourceId) ?? lead.sourceId}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        );
      })}
    </div>
  );
}
