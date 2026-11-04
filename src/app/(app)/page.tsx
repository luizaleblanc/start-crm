"use client";

import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Filter,
  Layers,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useDeals } from "@/modules/crm/presentation/hooks/use-deals";
import { useFunnelStages, useSources } from "@/modules/crm/presentation/hooks/use-catalog";
import { useLeads } from "@/modules/crm/presentation/hooks/use-leads";
import { TemperatureBadge } from "@/modules/crm/presentation/temperature-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PieChart } from "@/shared/ui/charts/pie-chart";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { cn } from "@/shared/ui/cn";

export default function DashboardPage() {
  const leadsQuery = useLeads(1, 1500);
  const dealsQuery = useDeals();
  const sourcesQuery = useSources();
  const funnelStagesQuery = useFunnelStages();

  const [activePeriod, setActivePeriod] = useState("Este mês");

  const leads = leadsQuery.data?.data ?? [];
  const deals = dealsQuery.data?.data ?? [];
  const sources = sourcesQuery.data?.data ?? [];
  const funnelStages = funnelStagesQuery.data?.data ?? [];

  const stageById = useMemo(
    () => new Map(funnelStages.map((stage) => [stage.id, stage])),
    [funnelStages],
  );

  const sourceNameById = useMemo(
    () => new Map(sources.map((source) => [source.id, source.name])),
    [sources],
  );

  const openDeals = useMemo(() => deals.filter((deal) => deal.status === "open"), [deals]);
  const wonDeals = useMemo(() => deals.filter((deal) => deal.status === "won"), [deals]);
  const pipelineValue = useMemo(
    () => openDeals.reduce((total, deal) => total + deal.value, 0),
    [openDeals],
  );
  const closedRevenue = useMemo(
    () => wonDeals.reduce((total, deal) => total + deal.value, 0),
    [wonDeals],
  );

  const leadsBySource = useMemo(() => {
    return sources
      .map((source) => ({
        source,
        count: leads.filter((lead) => lead.sourceId === source.id).length,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [sources, leads]);

  const recentLeads = useMemo(() => {
    return [...leads]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 7);
  }, [leads]);

  // Simulação das semanas para o BarChart (inspirado no screenshot)
  const revenueBars = [
    { label: "1 MAR", height: "45%", value: "R$ 4.800" },
    { label: "5 MAR", height: "35%", value: "R$ 2.400" },
    { label: "10 MAR", height: "65%", value: "R$ 7.200" },
    { label: "15 MAR", height: "55%", value: "R$ 4.800" },
    { label: "20 MAR", height: "80%", value: "R$ 14.800", isHighlighted: true },
    { label: "24 MAR", height: "95%", value: "R$ 21.200" },
    { label: "26 MAR", height: "70%", value: "R$ 12.500" },
  ];

  const isError = leadsQuery.isError || dealsQuery.isError;

  if (isError) {
    return <ErrorState title="Não foi possível carregar o painel" />;
  }

  return (
    <div className="flex flex-col gap-7 pb-12">
      {/* 1. Header do Dashboard com Saudação no Estilo do Screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Olá, Cleiton! 👋
          </h1>
          <p className="text-caption text-muted-foreground sm:text-body">
            Aqui está o que está acontecendo na sua operação comercial este mês.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="border-border/80 shadow-xs hover:bg-muted flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-caption font-semibold text-foreground transition-colors"
          >
            <span>{activePeriod}</span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>
          <Link
            href="/deals"
            className="border-border/80 shadow-xs hover:bg-muted flex h-9 w-9 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:text-foreground"
            title="Ir para Negócios"
          >
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      {/* 2. Bento Grid Superior: 2x2 Métricas à Esquerda + Gráfico de Barras à Direita */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Bloco Esquerdo (2x2 Grid de Cards) - 6 colunas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-6">
          {/* Card 1: Hero Card Branco / Destaque com Botão Azul Circular */}
          <div className="border-border/70 relative flex flex-col justify-between rounded-2xl border bg-white p-5 text-zinc-950 shadow-sm transition-all hover:shadow-md dark:bg-white dark:text-zinc-950">
            <div className="flex items-start justify-between">
              <span className="text-caption font-semibold text-zinc-600">Total de leads</span>
              <div className="shadow-xs flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
                <ArrowUpRight size={14} />
              </div>
            </div>
            <div className="my-3 flex flex-col gap-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-extrabold tabular-nums tracking-tight">
                  {leads.length.toLocaleString("pt-BR")}
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  + 2.67%
                </span>
              </div>
            </div>
            <span className="text-[11px] font-medium text-zinc-500">
              985 tráfego pago • 9 orgânico
            </span>
          </div>

          {/* Card 2: Pipeline em Aberto */}
          <div className="border-border/80 shadow-xs relative flex flex-col justify-between rounded-2xl border bg-card p-5 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <span className="text-caption font-medium text-muted-foreground">Pipeline ativo</span>
              <div className="bg-muted/60 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground">
                <ArrowUpRight size={14} />
              </div>
            </div>
            <div className="my-3 flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
                  {openDeals.length}
                </span>
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  {pipelineValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground">Negociações em andamento</span>
          </div>

          {/* Card 3: Mentorias Ganhas */}
          <div className="border-border/80 shadow-xs relative flex flex-col justify-between rounded-2xl border bg-card p-5 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <span className="text-caption font-medium text-muted-foreground">
                Vendas fechadas
              </span>
              <div className="bg-muted/60 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground">
                <ArrowUpRight size={14} />
              </div>
            </div>
            <div className="my-3 flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
                  {wonDeals.length}
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  53% conv.
                </span>
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground">Mentorias confirmadas</span>
          </div>

          {/* Card 4: Receita Faturada */}
          <div className="border-border/80 shadow-xs relative flex flex-col justify-between rounded-2xl border bg-card p-5 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <span className="text-caption font-medium text-muted-foreground">
                Receita faturada
              </span>
              <div className="bg-muted/60 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground">
                <ArrowUpRight size={14} />
              </div>
            </div>
            <div className="my-3 flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-3xl">
                  {closedRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground">Ticket médio: R$ 2.355,56</span>
          </div>
        </div>

        {/* Bloco Direito: Gráfico de Barras de Evolução da Receita - 6 colunas */}
        <div className="border-border/80 shadow-xs flex flex-col justify-between rounded-2xl border bg-card p-6 lg:col-span-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <h2 className="text-body font-bold text-foreground">Receita & Tração Comercial</h2>
              <p className="text-[11px] text-muted-foreground">Este mês vs período anterior</p>
            </div>
            <div className="bg-muted/60 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground">
              <ArrowUpRight size={14} />
            </div>
          </div>

          {/* Área do Gráfico de Barras no estilo do print */}
          <div className="mt-6 flex h-48 items-end gap-3 px-2 sm:gap-5">
            <div className="text-muted-foreground/80 flex flex-col justify-between self-stretch pr-2 text-[10px]">
              <span>R$ 25k</span>
              <span>R$ 20k</span>
              <span>R$ 15k</span>
              <span>R$ 10k</span>
              <span>R$ 5k</span>
              <span>R$ 0</span>
            </div>

            <div className="border-border/60 flex h-full flex-1 items-end justify-between gap-2 border-b pb-1">
              {revenueBars.map((bar) => (
                <div
                  key={bar.label}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end"
                >
                  {bar.isHighlighted && (
                    <div className="absolute -top-7 rounded-md bg-foreground px-1.5 py-0.5 text-[9px] font-bold text-background shadow-md">
                      {bar.value}
                    </div>
                  )}
                  <div
                    className={cn(
                      "w-full max-w-[28px] rounded-t-md transition-all duration-300 hover:opacity-90",
                      bar.isHighlighted
                        ? "bg-blue-600 dark:bg-blue-500"
                        : "bg-blue-500/70 dark:bg-blue-600/70",
                    )}
                    style={{ height: bar.height }}
                  />
                  <span className="mt-2 text-[10px] font-medium text-muted-foreground">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Segunda Linha Bento: Card de Leads + Card de Oportunidades + Gráfico Donut de Categorias */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-12">
        {/* Card A: 985 Leads de Anúncios (3 colunas) */}
        <div className="border-border/80 shadow-xs relative flex flex-col justify-between rounded-2xl border bg-card p-6 lg:col-span-3">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full text-primary">
            <Check size={16} />
          </div>
          <div className="my-4 flex flex-col">
            <span className="text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
              985 <span className="text-h6 font-normal text-muted-foreground">leads</span>
            </span>
            <span className="mt-1 text-caption text-muted-foreground">
              86 leads em andamento no funil
            </span>
          </div>
          <span className="text-muted-foreground/80 text-[11px] font-medium">
            Campanha NEW - MENTORIA TECH
          </span>
        </div>

        {/* Card B: 17 Oportunidades (3 colunas) */}
        <div className="border-border/80 shadow-xs relative flex flex-col justify-between rounded-2xl border bg-card p-6 lg:col-span-3">
          <div className="flex items-start justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <User size={16} />
            </div>
            <div className="bg-muted/60 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground">
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="my-4 flex flex-col">
            <span className="text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
              17 <span className="text-h6 font-normal text-muted-foreground">oportunidades</span>
            </span>
            <span className="mt-1 text-caption text-muted-foreground">
              5 negociações aguardando resposta
            </span>
          </div>
          <span className="text-muted-foreground/80 text-[11px] font-medium">
            9 já fechadas com sucesso
          </span>
        </div>

        {/* Card C: Donut Chart "Sales by Category / Leads por Origem" (6 colunas) */}
        <div className="border-border/80 shadow-xs flex flex-col justify-between rounded-2xl border bg-card p-6 lg:col-span-6">
          <div className="flex items-start justify-between pb-2">
            <div className="flex flex-col">
              <h2 className="text-body font-bold text-foreground">Leads por Origem de Captação</h2>
              <p className="text-[11px] text-muted-foreground">
                Distribuição entre campanhas e posts
              </p>
            </div>
            <div className="bg-muted/60 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground">
              <ArrowUpRight size={14} />
            </div>
          </div>

          <PieChart
            innerLabel="Total"
            ariaLabel="Distribuição de leads por canal"
            data={leadsBySource.map(({ source, count }) => ({
              label: source.name,
              value: count,
            }))}
          />
        </div>
      </div>

      {/* 4. Terceira Linha: Tabela e Lista Recente no Estilo do Screen 2 do Screenshot */}
      <div className="border-border/80 shadow-xs flex flex-col gap-5 rounded-2xl border bg-card p-6">
        {/* Header e 4 Status Pills em Linha */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-h4 font-bold tracking-tight text-foreground">
                Lista de Leads Recentes
              </h2>
              <p className="text-caption text-muted-foreground">
                Últimos contatos captados e prontos para follow-up
              </p>
            </div>
            <Link
              href="/leads"
              className="shadow-xs inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-caption font-semibold text-background transition-opacity hover:opacity-90 dark:bg-white dark:text-zinc-950"
            >
              <span>Ver todos os 994 leads</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {/* 4 Status Pills Alinhados como no Screen 2 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3.5">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                Novos Leads
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold tabular-nums text-foreground">872</span>
                <span className="text-[10px] text-muted-foreground">87.7%</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-orange-500/20 bg-orange-500/10 p-3.5">
              <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                Em Andamento
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold tabular-nums text-foreground">86</span>
                <span className="text-[10px] text-muted-foreground">8.6%</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Convite Enviado
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold tabular-nums text-foreground">27</span>
                <span className="text-[10px] text-muted-foreground">2.7%</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Fechados (Ganhos)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold tabular-nums text-foreground">9</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  R$ 21.2k
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Dados Refinada */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground">Nome do Lead</TableHead>
                <TableHead className="font-semibold text-muted-foreground">E-mail</TableHead>
                <TableHead className="font-semibold text-muted-foreground">
                  Origem da Campanha
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground">Estágio</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">
                  Data
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLeads.map((lead) => {
                const stage = stageById.get(lead.funnelStageId);
                return (
                  <TableRow
                    key={lead.id}
                    className="border-border/40 hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="py-3.5">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-semibold text-foreground hover:text-primary hover:underline"
                      >
                        {lead.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{lead.email ?? "—"}</TableCell>
                    <TableCell>
                      <span className="bg-muted/60 rounded-full px-2.5 py-1 text-[11px] font-medium text-foreground">
                        {sourceNameById.get(lead.sourceId) ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {stage ? (
                        <TemperatureBadge stage={stage} allStages={funnelStages} />
                      ) : (
                        <span className="text-caption text-muted-foreground">
                          {lead.funnelStageId}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-caption tabular-nums text-muted-foreground">
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
      </div>
    </div>
  );
}
