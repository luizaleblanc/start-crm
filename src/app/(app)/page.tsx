"use client";

import Link from "next/link";
import { useDeals } from "@/modules/crm/presentation/hooks/use-deals";
import { useSources } from "@/modules/crm/presentation/hooks/use-catalog";
import { useLeads } from "@/modules/crm/presentation/hooks/use-leads";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export default function DashboardPage() {
  const leadsQuery = useLeads(1, 100);
  const dealsQuery = useDeals();
  const sourcesQuery = useSources();

  const leads = leadsQuery.data?.data ?? [];
  const deals = dealsQuery.data?.data ?? [];
  const sources = sourcesQuery.data?.data ?? [];

  const openDeals = deals.filter((deal) => deal.status === "open");
  const wonDeals = deals.filter((deal) => deal.status === "won");
  const pipelineValue = openDeals.reduce((total, deal) => total + deal.value, 0);

  const leadsBySource = sources.map((source) => ({
    source,
    count: leads.filter((lead) => lead.sourceId === source.id).length,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Leads captados</CardDescription>
            <p className="text-h2 text-foreground">{leadsQuery.isLoading ? "…" : leads.length}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Negócios em aberto</CardDescription>
            <p className="text-h2 text-foreground">
              {dealsQuery.isLoading ? "…" : openDeals.length}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Valor em pipeline</CardDescription>
            <p className="text-h2 text-foreground">
              {dealsQuery.isLoading
                ? "…"
                : pipelineValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leads por origem</CardTitle>
          <CardDescription>Distribuição das {leads.length} leads captadas</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {leadsBySource.map(({ source, count }) => (
              <li key={source.id} className="flex items-center justify-between text-body">
                <span className="text-foreground">{source.name}</span>
                <span className="text-muted-foreground">{count}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Negócios ganhos recentemente</CardTitle>
        </CardHeader>
        <CardContent>
          {wonDeals.length === 0 ? (
            <p className="text-caption text-muted-foreground">Nenhum negócio ganho ainda.</p>
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
