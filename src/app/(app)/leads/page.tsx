"use client";

import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FileType,
  Filter,
  LayoutGrid,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Table2,
  Upload,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { Select } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { cn } from "@/shared/ui/cn";

type ViewMode = "table" | "kanban";

const PAGE_SIZE = 25;

export default function LeadsPage() {
  const leadsQuery = useLeads(1, 3000);
  const funnelStagesQuery = useFunnelStages();
  const sourcesQuery = useSources();
  const updateLeadStage = useUpdateLeadStage();

  const { searchTerm, setSearchTerm } = useSearch();

  const [view, setView] = useState<ViewMode>("table");
  const [stageFilter, setStageFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  const leads = useMemo(() => leadsQuery.data?.data ?? [], [leadsQuery.data?.data]);
  const funnelStages = useMemo(
    () => [...(funnelStagesQuery.data?.data ?? [])].sort((a, b) => a.order - b.order),
    [funnelStagesQuery.data?.data],
  );
  const sources = useMemo(() => sourcesQuery.data?.data ?? [], [sourcesQuery.data?.data]);

  const stageById = useMemo(
    () => new Map(funnelStages.map((stage) => [stage.id, stage])),
    [funnelStages],
  );
  const sourceNameById = useMemo(
    () => new Map(sources.map((source) => [source.id, source.name])),
    [sources],
  );
  const stageNameById = useMemo(
    () => new Map(funnelStages.map((stage) => [stage.id, stage.name])),
    [funnelStages],
  );

  // Status pills calculados dinamicamente com base nos 1.005 leads
  const stageStats = useMemo(() => {
    return funnelStages.map((stage, idx) => {
      const count = leads.filter((lead) => lead.funnelStageId === stage.id).length;
      const pct = leads.length > 0 ? ((count / leads.length) * 100).toFixed(1) : "0";

      // Cores refinadas para o Dark Mode estilo Bento
      const colorSchemes = [
        {
          border: "border-blue-500/30",
          bg: "bg-blue-500/10",
          text: "text-blue-500 dark:text-blue-400",
          badgeBg: "bg-blue-500/15",
        },
        {
          border: "border-orange-500/30",
          bg: "bg-orange-500/10",
          text: "text-orange-500 dark:text-orange-400",
          badgeBg: "bg-orange-500/15",
        },
        {
          border: "border-amber-500/30",
          bg: "bg-amber-500/10",
          text: "text-amber-500 dark:text-amber-400",
          badgeBg: "bg-amber-500/15",
        },
        {
          border: "border-emerald-500/30",
          bg: "bg-emerald-500/10",
          text: "text-emerald-500 dark:text-emerald-400",
          badgeBg: "bg-emerald-500/15",
        },
      ];

      const scheme = colorSchemes[idx % colorSchemes.length] ?? colorSchemes[0]!;

      return {
        stage,
        count,
        pct,
        scheme,
      };
    });
  }, [funnelStages, leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
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
  }, [leads, stageFilter, sourceFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const paginatedLeads = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredLeads.slice(start, start + PAGE_SIZE);
  }, [filteredLeads, page]);

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

  const totalLeadsCount = leadsQuery.data?.meta?.total ?? leads.length;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header com Título e Estatísticas Gerais */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Leads da Operação
          </h1>
          <p className="text-caption text-muted-foreground sm:text-body">
            Gerencie e acompanhe todos os {totalLeadsCount.toLocaleString("pt-BR")} leads do funil
            de vendas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            className="shadow-xs rounded-full"
          >
            <Upload aria-hidden size={15} />
            Importar Tabela
          </Button>
          <div className="shadow-xs flex rounded-full bg-card p-1">
            <button
              type="button"
              onClick={() => setView("table")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-semibold transition-colors",
                view === "table"
                  ? "shadow-xs bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Table2 aria-hidden size={15} />
              Tabela
            </button>
            <button
              type="button"
              onClick={() => setView("kanban")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-semibold transition-colors",
                view === "kanban"
                  ? "shadow-xs bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid aria-hidden size={15} />
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bloco Bento: 4 Status Cards (Inspirado no Screenshot do Dashboard de Ordens) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        {stageStats.map(({ stage, count, pct, scheme }) => {
          const isSelected = stageFilter === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => {
                setStageFilter(isSelected ? "" : stage.id);
                setPage(1);
              }}
              className={cn(
                "shadow-xs group relative flex flex-col justify-between rounded-2xl p-4 text-left transition-all",
                scheme.bg,
                isSelected
                  ? "scale-[1.02] shadow-md ring-2 ring-primary"
                  : "hover:scale-[1.01] hover:shadow-md",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn("text-[12px] font-bold uppercase tracking-wider", scheme.text)}>
                  {stage.name}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    scheme.text,
                    scheme.badgeBg,
                  )}
                >
                  {pct}%
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black tabular-nums tracking-tight text-foreground sm:text-3xl">
                  {count.toLocaleString("pt-BR")}
                </span>
                <span className="text-[11px] text-muted-foreground">leads</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Barra de Filtros, Busca e Exportação */}
      <div className="shadow-xs flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-card p-4">
        <div className="flex min-w-[280px] flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              aria-hidden
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-full bg-background pl-9 pr-8 text-caption text-foreground shadow-inner placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setPage(1);
                }}
                aria-label="Limpar busca"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <Select
            aria-label="Filtrar por estágio"
            value={stageFilter}
            onChange={(event) => {
              setStageFilter(event.target.value);
              setPage(1);
            }}
            className="h-9 w-40 rounded-full text-caption"
          >
            <option value="">Todos estágios</option>
            {funnelStages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filtrar por origem"
            value={sourceFilter}
            onChange={(event) => {
              setSourceFilter(event.target.value);
              setPage(1);
            }}
            className="h-9 w-48 rounded-full text-caption"
          >
            <option value="">Todas as origens</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </Select>

          {(stageFilter || sourceFilter || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setStageFilter("");
                setSourceFilter("");
                setSearchTerm("");
              }}
              className="text-caption font-semibold text-primary hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filteredLeads.length === 0 || exportingFormat !== null}
            isLoading={exportingFormat === "xlsx"}
            onClick={() => handleExport("xlsx")}
            className="shadow-xs rounded-full"
          >
            <FileSpreadsheet aria-hidden size={14} />
            Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filteredLeads.length === 0 || exportingFormat !== null}
            isLoading={exportingFormat === "pdf"}
            onClick={() => handleExport("pdf")}
            className="shadow-xs rounded-full"
          >
            <FileText aria-hidden size={14} />
            PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filteredLeads.length === 0 || exportingFormat !== null}
            isLoading={exportingFormat === "docx"}
            onClick={() => handleExport("docx")}
            className="shadow-xs rounded-full"
          >
            <FileType aria-hidden size={14} />
            Word
          </Button>
        </div>
      </div>

      {/* 4. Visualização: Tabela com Paginação ou Kanban */}
      {view === "table" ? (
        <div className="flex flex-col gap-4">
          <div className="shadow-xs overflow-hidden rounded-2xl bg-card">
            <LeadsTableView
              leads={paginatedLeads}
              isLoading={leadsQuery.isLoading}
              stageById={stageById}
              funnelStages={funnelStages}
              sourceNameById={sourceNameById}
            />
          </div>

          {/* Paginação Estilo Minimalista e Direta */}
          {filteredLeads.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 px-2 py-1 text-caption text-muted-foreground">
              <span>
                Mostrando <strong className="text-foreground">{(page - 1) * PAGE_SIZE + 1}</strong>{" "}
                a{" "}
                <strong className="text-foreground">
                  {Math.min(page * PAGE_SIZE, filteredLeads.length)}
                </strong>{" "}
                de{" "}
                <strong className="text-foreground">
                  {filteredLeads.length.toLocaleString("pt-BR")}
                </strong>{" "}
                leads
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="shadow-xs hover:bg-muted flex h-8 items-center gap-1 rounded-full bg-card px-3 text-caption font-semibold text-foreground transition-colors disabled:opacity-40 disabled:hover:bg-card"
                >
                  <ChevronLeft size={14} />
                  Anterior
                </button>
                <span className="px-2 font-medium">
                  {page} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="shadow-xs hover:bg-muted flex h-8 items-center gap-1 rounded-full bg-card px-3 text-caption font-semibold text-foreground transition-colors disabled:opacity-40 disabled:hover:bg-card"
                >
                  Próxima
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
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

function getWhatsAppUrl(phone?: string, name?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits || digits.length < 8) return null;
  const fullNumber = digits.startsWith("55") ? digits : `55${digits}`;
  const firstName = name ? name.split(" ")[0] : "";
  const text = encodeURIComponent(`Olá ${firstName}! Tudo bem? Sou da equipe do Start CRM.`);
  return `https://wa.me/${fullNumber}?text=${text}`;
}

function LeadsTableView({
  leads,
  isLoading,
  stageById,
  funnelStages,
  sourceNameById,
}: LeadsTableViewProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-6">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          title="Nenhum lead encontrado"
          description="Ajuste os filtros de busca ou aguarde novos cadastros."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border/40 hover:bg-transparent">
            <TableHead className="min-w-[170px] font-semibold text-muted-foreground">
              Lead
            </TableHead>
            <TableHead className="min-w-[200px] font-semibold text-muted-foreground">
              Contato
            </TableHead>
            <TableHead className="min-w-[160px] font-semibold text-muted-foreground">
              Empresa / Cargo
            </TableHead>
            <TableHead className="min-w-[110px] font-semibold text-muted-foreground">
              Cidade
            </TableHead>
            <TableHead className="min-w-[90px] font-semibold text-muted-foreground">
              LinkedIn
            </TableHead>
            <TableHead className="min-w-[160px] font-semibold text-muted-foreground">
              Origem
            </TableHead>
            <TableHead className="min-w-[110px] font-semibold text-muted-foreground">
              Responsável
            </TableHead>
            <TableHead className="min-w-[130px] font-semibold text-muted-foreground">
              Estágio
            </TableHead>
            <TableHead className="min-w-[130px] font-semibold text-muted-foreground">
              Situação
            </TableHead>
            <TableHead className="min-w-[90px] text-right font-semibold text-muted-foreground">
              Data
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const stage = stageById.get(lead.funnelStageId);
            const waUrl = getWhatsAppUrl(lead.phone, lead.name);

            return (
              <TableRow
                key={lead.id}
                className="border-border/30 hover:bg-muted/40 transition-colors"
              >
                <TableCell className="py-3">
                  <div className="flex flex-col">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-semibold text-foreground hover:text-primary hover:underline"
                    >
                      {lead.name}
                    </Link>
                    {lead.jobTitle && (
                      <span className="line-clamp-1 text-[11px] text-muted-foreground">
                        {lead.jobTitle}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-foreground/90 max-w-[190px] truncate text-caption">
                      {lead.email ?? "—"}
                    </span>
                    {lead.phone && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {lead.phone}
                        </span>
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle size={10} />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-col">
                    <span className="text-caption font-medium text-foreground">
                      {lead.company || "—"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {lead.jobTitle || "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-caption text-muted-foreground">
                  {lead.city || "—"}
                </TableCell>
                <TableCell className="py-3">
                  {lead.linkedinUrl ? (
                    <a
                      href={lead.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-border/50 bg-muted/40 hover:bg-muted inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400"
                    >
                      <ExternalLink size={11} />
                      Perfil
                    </a>
                  ) : (
                    <span className="text-caption text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="py-3">
                  <span className="bg-muted/60 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium text-foreground">
                    {sourceNameById.get(lead.sourceId) ?? "—"}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-caption font-medium text-foreground">
                  {lead.ownerName || "—"}
                </TableCell>
                <TableCell className="py-3">
                  {stage ? (
                    <TemperatureBadge stage={stage} allStages={funnelStages} />
                  ) : (
                    <span className="text-caption text-muted-foreground">{lead.funnelStageId}</span>
                  )}
                </TableCell>
                <TableCell className="py-3">
                  <span
                    className="line-clamp-1 max-w-[140px] text-caption text-muted-foreground"
                    title={lead.situation}
                  >
                    {lead.situation || "—"}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap py-3 text-right text-caption tabular-nums text-muted-foreground">
                  {new Date(lead.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
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
              "shadow-xs flex flex-col gap-3 rounded-2xl bg-card p-3 transition-colors",
              isTarget && "bg-primary/5 ring-2 ring-primary",
            )}
          >
            <div
              className="flex items-center justify-between rounded-xl px-3 py-2"
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
                <p className="border-border/60 rounded-xl border border-dashed px-3 py-8 text-center text-caption text-muted-foreground">
                  Nenhum lead neste estágio.
                </p>
              ) : (
                stageLeads.slice(0, 100).map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", lead.id);
                      setDraggedLeadId(lead.id);
                    }}
                    onDragEnd={() => setDraggedLeadId(null)}
                    className={cn(
                      "shadow-xs group relative cursor-grab rounded-xl bg-background p-3 transition-all hover:shadow-md active:cursor-grabbing",
                      draggedLeadId === lead.id && "border-dashed border-primary opacity-50",
                    )}
                    style={{ borderLeft: `3px solid ${color}` }}
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

                    <div className="border-border/30 mt-2.5 flex items-center justify-between border-t pt-2 text-caption">
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
                            className="shadow-xs flex h-6 w-6 items-center justify-center rounded bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
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
                            className="shadow-xs flex h-6 w-6 items-center justify-center rounded bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
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
