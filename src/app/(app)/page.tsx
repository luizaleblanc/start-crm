"use client";

import {
  ArrowUpRight,
  Award,
  CheckCircle2,
  DollarSign,
  Handshake,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useDeals } from "@/modules/crm/presentation/hooks/use-deals";
import { useFunnelStages, useSources } from "@/modules/crm/presentation/hooks/use-catalog";
import { useLeads } from "@/modules/crm/presentation/hooks/use-leads";
import { TemperatureBadge } from "@/modules/crm/presentation/temperature-badge";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PieChart } from "@/shared/ui/charts/pie-chart";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export default function DashboardPage() {
  const leadsQuery = useLeads(1, 1500);
  const dealsQuery = useDeals();
  const sourcesQuery = useSources();
  const funnelStagesQuery = useFunnelStages();

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

  const winRate = useMemo(() => {
    if (deals.length === 0) return 0;
    return Math.round((wonDeals.length / deals.length) * 100);
  }, [deals, wonDeals]);

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
      .slice(0, 6);
  }, [leads]);

  const isError = leadsQuery.isError || dealsQuery.isError;

  if (isError) {
    return <ErrorState title="Não foi possível carregar o painel" />;
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header com Boas-vindas e Status */}
      <div className="border-border/80 flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-h3 font-bold tracking-tight text-foreground">
              Painel de Performance Comercial
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Base em tempo real
            </span>
          </div>
          <p className="text-body text-muted-foreground">
            Acompanhe a tração das campanhas, evolução do pipeline e fechamentos da Mentoria Tech.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/deals"
            className="shadow-xs hover:bg-muted inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-caption font-semibold text-foreground transition-colors"
          >
            <Handshake size={14} className="text-primary" />
            Ver Negócios
          </Link>
          <Link
            href="/leads"
            className="shadow-xs inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-caption font-semibold text-primary-foreground transition-all hover:opacity-95"
          >
            <Users size={14} />
            Gerenciar Funil
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* 4 Cards Principais de Indicadores (KPIs) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total de Leads */}
        <Card className="relative overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-caption font-medium uppercase tracking-wider">
              Total de Leads
            </CardDescription>
            <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg text-primary">
              <Users size={18} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {leadsQuery.isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <p className="text-h2 font-extrabold tabular-nums tracking-tight text-foreground">
                {leads.length.toLocaleString("pt-BR")}
              </p>
            )}
            <p className="text-caption text-muted-foreground">
              985 via LinkedIn Ads • 9 Orgânico/Rede
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Negócios em Aberto (Pipeline) */}
        <Card className="relative overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-caption font-medium uppercase tracking-wider">
              Pipeline Ativo
            </CardDescription>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp size={18} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {dealsQuery.isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <p className="text-h2 font-extrabold tabular-nums tracking-tight text-foreground">
                {pipelineValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            )}
            <p className="text-caption text-muted-foreground">
              {openDeals.length} negociações em andamento
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Receita Fechada (Ganhos) */}
        <Card className="relative overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-caption font-medium uppercase tracking-wider">
              Receita Fechada
            </CardDescription>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign size={18} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {dealsQuery.isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <p className="text-h2 font-extrabold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
                {closedRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            )}
            <p className="text-caption text-muted-foreground">
              {wonDeals.length} mentorias convertidas
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Taxa de Conversão */}
        <Card className="relative overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-caption font-medium uppercase tracking-wider">
              Taxa de Sucesso
            </CardDescription>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Award size={18} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {dealsQuery.isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <p className="text-h2 font-extrabold tabular-nums tracking-tight text-foreground">
                {winRate}%
              </p>
            )}
            <p className="text-caption text-muted-foreground">
              60% de conversão em posts orgânicos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid Médio: Origens de Captação e Fechamentos Recentes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Origens de Captação (7 colunas) */}
        <Card className="flex flex-col justify-between lg:col-span-7">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Canais & Performance de Origem</CardTitle>
                <CardDescription>
                  Distribuição detalhada das campanhas e publicações
                </CardDescription>
              </div>
              <Badge variant="muted">{leadsBySource.length} canais ativos</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {leadsQuery.isLoading || sourcesQuery.isLoading ? (
              <Skeleton className="h-44 w-full" />
            ) : (
              <PieChart
                innerLabel="Leads"
                ariaLabel="Distribuição de leads por campanha"
                data={leadsBySource.map(({ source, count }) => ({
                  label: source.name,
                  value: count,
                }))}
              />
            )}
          </CardContent>
        </Card>

        {/* Negócios Ganhos Recentes (5 colunas) */}
        <Card className="flex flex-col justify-between lg:col-span-5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Negócios Ganhos</CardTitle>
                <CardDescription>Últimas mentorias fechadas com sucesso</CardDescription>
              </div>
              <Link
                href="/deals"
                className="text-caption font-semibold text-primary hover:underline"
              >
                Ver todos ({wonDeals.length})
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between">
            {dealsQuery.isLoading ? (
              <div className="flex flex-col gap-2.5">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : wonDeals.length === 0 ? (
              <EmptyState title="Nenhum negócio ganho ainda" />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {wonDeals.slice(0, 5).map((deal) => (
                  <li
                    key={deal.id}
                    className="border-border/70 bg-muted/20 hover:bg-muted/40 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-body font-semibold text-foreground">
                          {deal.title}
                        </span>
                        <span className="text-caption text-muted-foreground">
                          Mentoria confirmada
                        </span>
                      </div>
                    </div>
                    <Badge variant="success" className="font-semibold tabular-nums">
                      {deal.value.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-border/60 mt-4 flex items-center justify-between border-t pt-3 text-caption text-muted-foreground">
              <span>
                Ticket Médio: <strong>R$ 2.355,56</strong>
              </span>
              <span>
                Total:{" "}
                <strong className="text-foreground">
                  {closedRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Inferior: Últimos Leads Captados */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Últimos Leads Captados</CardTitle>
              <CardDescription>Acompanhamento em tempo real dos contatos gerados</CardDescription>
            </div>
            <Link
              href="/leads"
              className="inline-flex items-center gap-1 text-caption font-semibold text-primary hover:underline"
            >
              Ver todos os {leads.length} leads →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {leadsQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : recentLeads.length === 0 ? (
            <EmptyState title="Nenhum lead captado ainda" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Estágio no Funil</TableHead>
                  <TableHead>Canal / Origem</TableHead>
                  <TableHead>Data de Entrada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads.map((lead) => {
                  const stage = stageById.get(lead.funnelStageId);
                  return (
                    <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-semibold text-foreground hover:text-primary hover:underline"
                        >
                          {lead.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{lead.email ?? "—"}</TableCell>
                      <TableCell>
                        {stage ? (
                          <TemperatureBadge stage={stage} allStages={funnelStages} />
                        ) : (
                          <span className="text-caption text-muted-foreground">
                            {lead.funnelStageId}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="bg-muted/70 rounded px-2 py-0.5 text-caption font-medium text-muted-foreground">
                          {sourceNameById.get(lead.sourceId) ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-caption tabular-nums text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
