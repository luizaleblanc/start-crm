"use client";

import Link from "next/link";
import { useDeals } from "@/modules/crm/presentation/hooks/use-deals";
import { useFunnelStages, useSources } from "@/modules/crm/presentation/hooks/use-catalog";
import { useLeads } from "@/modules/crm/presentation/hooks/use-leads";
import { TemperatureBadge } from "@/modules/crm/presentation/temperature-badge";
import { Badge } from "@/shared/ui/badge";
import { PieChart } from "@/shared/ui/charts/pie-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export default function DashboardPage() {
  const leadsQuery = useLeads(1, 100);
  const dealsQuery = useDeals();
  const sourcesQuery = useSources();
  const funnelStagesQuery = useFunnelStages();

  const leads = leadsQuery.data?.data ?? [];
  const deals = dealsQuery.data?.data ?? [];
  const sources = sourcesQuery.data?.data ?? [];
  const funnelStages = funnelStagesQuery.data?.data ?? [];
  const stageById = new Map(funnelStages.map((stage) => [stage.id, stage]));

  const openDeals = deals.filter((deal) => deal.status === "open");
  const wonDeals = deals.filter((deal) => deal.status === "won");
  const pipelineValue = openDeals.reduce((total, deal) => total + deal.value, 0);

  const leadsBySource = sources.map((source) => ({
    source,
    count: leads.filter((lead) => lead.sourceId === source.id).length,
  }));

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const sourceNameById = new Map(sources.map((source) => [source.id, source.name]));

  const isError = leadsQuery.isError || dealsQuery.isError;

  if (isError) {
    return <ErrorState title="Não foi possível carregar o painel" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Leads captados</CardDescription>
            {leadsQuery.isLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <p className="text-h2 text-foreground">{leads.length}</p>
            )}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Negócios em aberto</CardDescription>
            {dealsQuery.isLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <p className="text-h2 text-foreground">{openDeals.length}</p>
            )}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Valor em pipeline</CardDescription>
            {dealsQuery.isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <p className="text-h2 text-foreground">
                {pipelineValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            )}
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leads recentes</CardTitle>
          <CardDescription>Os últimos leads captados</CardDescription>
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
                  <TableHead>Estágio</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads.map((lead) => {
                  const stage = stageById.get(lead.funnelStageId);
                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Link href={`/leads/${lead.id}`} className="hover:underline">
                          {lead.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {stage && <TemperatureBadge stage={stage} allStages={funnelStages} />}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sourceNameById.get(lead.sourceId) ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leads por origem</CardTitle>
          <CardDescription>Distribuição das {leads.length} leads captadas</CardDescription>
        </CardHeader>
        <CardContent>
          {leadsQuery.isLoading || sourcesQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <PieChart
              ariaLabel="Distribuição de leads por origem"
              data={leadsBySource.map(({ source, count }) => ({
                label: source.name,
                value: count,
              }))}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Negócios ganhos recentemente</CardTitle>
        </CardHeader>
        <CardContent>
          {dealsQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : wonDeals.length === 0 ? (
            <EmptyState title="Nenhum negócio ganho ainda" />
          ) : (
            <ul className="flex flex-col gap-3">
              {wonDeals.map((deal) => (
                <li key={deal.id} className="flex items-center justify-between text-body">
                  <span className="text-foreground">{deal.title}</span>
                  <Badge variant="success">
                    {deal.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Link href="/leads" className="text-body text-primary underline-offset-4 hover:underline">
        Ver todos os leads →
      </Link>
    </div>
  );
}
