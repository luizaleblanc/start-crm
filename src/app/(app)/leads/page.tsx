"use client";

import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  FileType,
  LayoutGrid,
  Mail,
  Phone,
  Search,
  Table2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { FunnelStage, Lead } from "@/modules/crm/domain/entities";
import type { ExportFormat } from "@/modules/crm/infrastructure/export/export-leads";
import { exportLeads } from "@/modules/crm/infrastructure/export/export-leads";
import { ImportLeadsModal } from "@/modules/crm/presentation/import/import-leads-modal";
import { useFunnelStages, useSources } from "@/modules/crm/presentation/hooks/use-catalog";
import { useLeads, useUpdateLeadStage } from "@/modules/crm/presentation/hooks/use-leads";
import {
  getStageTemperatureColor,
  getStageTemperatureColorAlpha,
} from "@/modules/crm/presentation/lead-temperature";
import { TemperatureBadge } from "@/modules/crm/presentation/temperature-badge";
import { useSearch } from "@/shared/search/search-context";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { Select } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { cn } from "@/shared/ui/cn";

type ViewMode = "table" | "kanban";

export default function LeadsPage() {
  const leadsQuery = useLeads(1, 1500);
  const funnelStagesQuery = useFunnelStages();
  const sourcesQuery = useSources();
  const updateLeadStage = useUpdateLeadStage();

  const { searchTerm, setSearchTerm } = useSearch();

  const [view, setView] = useState<ViewMode>("table");
  const [stageFilter, setStageFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

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
  const stageNameById = useMemo(
    () => new Map(funnelStages.map((stage) => [stage.id, stage.name])),
    [funnelStages],
  );

  const filteredLeads = leads.filter((lead) => {
    if (stageFilter && lead.funnelStageId !== stageFilter) return false;
    if (sourceFilter && lead.sourceId !== sourceFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      const matchesName = lead.name?.toLowerCase().includes(term);
      const matchesEmail = lead.email?.toLowerCase().includes(term);
      const matchesPhone = lead.phone?.toLowerCase().includes(term);
      if (!matchesName && !matchesEmail && !matchesPhone) return false;
    }
    return true;
  });

  async function handleExport(format: ExportFormat) {
    setExportingFormat(format);
    try {
      await exportLeads(format, filteredLeads, { stageNameById, sourceNameById });
    } finally {
      setExportingFormat(null);
    }
  }

  if (leadsQuery.isError) {
    return <ErrorState title="Não foi possível carregar os leads" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="relative w-72">
            <span className="mb-1 block text-caption font-medium text-muted-foreground">
              Buscar lead
            </span>
            <div className="relative">
              <Search
                aria-hidden
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Nome, e-mail ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-8 text-body text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Limpar busca"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
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
            <Table2 aria-hidden size={16} />
            Tabela
          </Button>
          <Button
            type="button"
            variant={view === "kanban" ? "primary" : "outline"}
            size="sm"
            onClick={() => setView("kanban")}
          >
            <LayoutGrid aria-hidden size={16} />
            Kanban
          </Button>
        </div>
      </div>

      <div className="border-border/60 flex flex-wrap items-center justify-between gap-3 border-y py-3">
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

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload aria-hidden size={16} />
            Importar minha Tabela
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filteredLeads.length === 0 || exportingFormat !== null}
            isLoading={exportingFormat === "xlsx"}
            onClick={() => handleExport("xlsx")}
          >
            <FileSpreadsheet aria-hidden size={16} />
            Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filteredLeads.length === 0 || exportingFormat !== null}
            isLoading={exportingFormat === "pdf"}
            onClick={() => handleExport("pdf")}
          >
            <FileText aria-hidden size={16} />
            PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filteredLeads.length === 0 || exportingFormat !== null}
            isLoading={exportingFormat === "docx"}
            onClick={() => handleExport("docx")}
          >
            <FileType aria-hidden size={16} />
            Word
          </Button>
        </div>
      </div>

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
          onMoveStage={(leadId, stageId) =>
            updateLeadStage.mutate({ leadId, funnelStageId: stageId })
          }
          isMoving={updateLeadStage.isPending}
        />
      )}

      <ImportLeadsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        funnelStages={funnelStages}
        sources={sources}
      />
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
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          title="Nenhum lead encontrado"
          description="Ajuste os filtros ou aguarde novos leads chegarem."
        />
      ) : (
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
      )}
    </div>
  );
}

interface LeadsKanbanViewProps {
  leads: Lead[];
  funnelStages: FunnelStage[];
  sourceNameById: Map<string, string>;
  onMoveStage: (leadId: string, stageId: string) => void;
  isMoving?: boolean;
}

function LeadsKanbanView({
  leads,
  funnelStages,
  sourceNameById,
  onMoveStage,
  isMoving,
}: LeadsKanbanViewProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {funnelStages.map((stage, stageIndex) => {
        const color = getStageTemperatureColor(stage, funnelStages);
        const backgroundTint = getStageTemperatureColorAlpha(stage, funnelStages, 0.1);
        const stageLeads = leads.filter((lead) => lead.funnelStageId === stage.id);
        const isTarget = dragOverStageId === stage.id;

        const prevStage = stageIndex > 0 ? funnelStages[stageIndex - 1] : null;
        const nextStage =
          stageIndex < funnelStages.length - 1 ? funnelStages[stageIndex + 1] : null;

        return (
          <div
            key={stage.id}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOverStageId(stage.id);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              if (dragOverStageId === stage.id) setDragOverStageId(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStageId(null);
              const leadId = e.dataTransfer.getData("text/plain") || draggedLeadId;
              if (leadId) {
                const lead = leads.find((l) => l.id === leadId);
                if (lead && lead.funnelStageId !== stage.id) {
                  onMoveStage(leadId, stage.id);
                }
              }
              setDraggedLeadId(null);
            }}
            className={cn(
              "border-border/80 bg-background/50 flex flex-col gap-3 rounded-lg border p-2.5 transition-colors",
              isTarget && "ring-primary/80 bg-primary/5 ring-2",
            )}
          >
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
                <span className="text-caption font-semibold text-foreground">{stage.name}</span>
              </div>
              <span className="bg-background/80 shadow-xs rounded-full px-2 py-0.5 text-caption font-semibold text-foreground">
                {stageLeads.length}
              </span>
            </div>

            <div className="flex max-h-[calc(100vh-270px)] flex-col gap-2.5 overflow-y-auto pr-1">
              {stageLeads.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-3 py-8 text-center text-caption text-muted-foreground">
                  Arraste um lead para este estágio.
                </p>
              ) : (
                stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", lead.id);
                      setDraggedLeadId(lead.id);
                    }}
                    onDragEnd={() => setDraggedLeadId(null)}
                    className={cn(
                      "shadow-xs group relative cursor-grab rounded-lg border border-border bg-card p-3 transition-all hover:shadow-md active:cursor-grabbing",
                      draggedLeadId === lead.id && "border-dashed border-primary opacity-50",
                    )}
                    style={{ borderLeft: `4px solid ${color}` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-body font-semibold text-foreground transition-colors hover:text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {lead.name}
                      </Link>
                    </div>

                    {lead.email && (
                      <p className="mt-1 flex items-center gap-1.5 truncate text-caption text-muted-foreground">
                        <Mail size={12} className="shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </p>
                    )}

                    {lead.phone && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-caption text-muted-foreground">
                        <Phone size={12} className="shrink-0" />
                        <span>{lead.phone}</span>
                      </p>
                    )}

                    <div className="border-border/50 mt-2.5 flex items-center justify-between border-t pt-2 text-caption">
                      <span className="bg-muted/60 max-w-[140px] truncate rounded px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {sourceNameById.get(lead.sourceId) ?? "Origem padrão"}
                      </span>

                      <div className="flex items-center gap-1">
                        {prevStage && (
                          <button
                            type="button"
                            title={`Mover para ${prevStage.name}`}
                            disabled={isMoving}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveStage(lead.id, prevStage.id);
                            }}
                            className="hover:bg-muted flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                          >
                            <ChevronLeft size={13} />
                          </button>
                        )}
                        {nextStage && (
                          <button
                            type="button"
                            title={`Avançar para ${nextStage.name}`}
                            disabled={isMoving}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveStage(lead.id, nextStage.id);
                            }}
                            className="hover:bg-muted flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                          >
                            <ChevronRight size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
