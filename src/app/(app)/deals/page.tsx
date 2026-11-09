"use client";

import {
  Check,
  CheckCircle2,
  DollarSign,
  Handshake,
  TrendingUp,
  User,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import type { Deal, DealStatus } from "@/modules/crm/domain/entities";
import { useCloseDeal, useDeals } from "@/modules/crm/presentation/hooks/use-deals";
import { useLeads } from "@/modules/crm/presentation/hooks/use-leads";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { ErrorState } from "@/shared/ui/error-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/ui/cn";

interface ColumnConfig {
  status: DealStatus;
  label: string;
  badgeVariant: "default" | "success" | "muted";
  accentColor: string;
  bgColor: string;
  icon: typeof CheckCircle2;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: "open",
    label: "Em Aberto",
    badgeVariant: "default",
    accentColor: "#2a78d6",
    bgColor: "rgba(42, 120, 214, 0.08)",
    icon: TrendingUp,
  },
  {
    status: "won",
    label: "Fechados (Ganhos)",
    badgeVariant: "success",
    accentColor: "#159a6b",
    bgColor: "rgba(21, 154, 107, 0.08)",
    icon: CheckCircle2,
  },
  {
    status: "lost",
    label: "Perdidos",
    badgeVariant: "muted",
    accentColor: "#6a6678",
    bgColor: "rgba(106, 102, 120, 0.08)",
    icon: XCircle,
  },
];

export default function DealsPage() {
  const dealsQuery = useDeals();
  const leadsQuery = useLeads(1, 1500);
  const closeDeal = useCloseDeal();

  const deals = useMemo(() => dealsQuery.data?.data ?? [], [dealsQuery.data?.data]);
  const leadNameById = useMemo(
    () => new Map((leadsQuery.data?.data ?? []).map((lead) => [lead.id, lead.name])),
    [leadsQuery.data?.data],
  );

  const totalValue = useMemo(() => deals.reduce((acc, d) => acc + d.value, 0), [deals]);
  const wonValue = useMemo(
    () => deals.filter((d) => d.status === "won").reduce((acc, d) => acc + d.value, 0),
    [deals],
  );

  if (dealsQuery.isError) {
    return <ErrorState title="Não foi possível carregar os negócios" />;
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Top Banner de Resumo de Negócios */}
      <div className="border-border/80 flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-h3 font-bold tracking-tight text-foreground">
              Pipeline de Negócios & Vendas
            </h1>
            <span className="bg-primary/10 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              Mentoria Tech
            </span>
          </div>
          <p className="text-body text-muted-foreground">
            Acompanhe o valor total em negociação, converta propostas e monitore receitas fechadas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-caption font-medium uppercase tracking-wider text-muted-foreground">
              Faturado
            </span>
            <span className="text-h5 font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {wonValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col items-end">
            <span className="text-caption font-medium uppercase tracking-wider text-muted-foreground">
              Volume Total
            </span>
            <span className="text-h5 font-bold tabular-nums text-foreground">
              {totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Colunas de Negócios */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {COLUMNS.map((column) => {
          const columnDeals = deals.filter((deal) => deal.status === column.status);
          const columnTotal = columnDeals.reduce((total, deal) => total + deal.value, 0);
          const Icon = column.icon;

          return (
            <div
              key={column.status}
              className="border-border/80 bg-background/50 flex flex-col gap-3 rounded-lg border p-3"
            >
              <div
                className="flex items-center justify-between rounded-md px-3.5 py-2.5"
                style={{ backgroundColor: column.bgColor }}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} style={{ color: column.accentColor }} />
                  <span className="text-caption font-bold uppercase tracking-wide text-foreground">
                    {column.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-background/80 shadow-xs rounded-full px-2 py-0.5 text-caption font-semibold text-foreground">
                    {columnDeals.length}
                  </span>
                  <span className="text-caption font-bold tabular-nums text-foreground">
                    {columnTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
              </div>

              {dealsQuery.isLoading && (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              )}

              {!dealsQuery.isLoading && columnDeals.length === 0 && (
                <p className="rounded-md border border-dashed border-border px-3 py-10 text-center text-caption text-muted-foreground">
                  Nenhum negócio nesta etapa.
                </p>
              )}

              <div className="flex max-h-[calc(100vh-250px)] flex-col gap-3 overflow-y-auto pr-1">
                {columnDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    leadName={leadNameById.get(deal.leadId)}
                    onClose={(status) => closeDeal.mutate({ dealId: deal.id, status })}
                    isClosing={closeDeal.isPending}
                    accentColor={column.accentColor}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DealCard({
  deal,
  leadName,
  onClose,
  isClosing,
  accentColor,
}: {
  deal: Deal;
  leadName: string | undefined;
  onClose: (status: "won" | "lost") => void;
  isClosing: boolean;
  accentColor: string;
}) {
  return (
    <Card
      className="group transition-all hover:shadow-md"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-body font-bold text-foreground">{deal.title}</p>
          <Badge
            variant={
              deal.status === "won" ? "success" : deal.status === "lost" ? "muted" : "default"
            }
            className="shrink-0 font-semibold tabular-nums"
          >
            {deal.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </Badge>
        </div>
        {leadName ? (
          <Link
            href={`/leads/${deal.leadId}`}
            className="mt-1 flex items-center gap-1.5 text-caption font-medium text-muted-foreground hover:text-primary hover:underline"
          >
            <User size={12} className="shrink-0" />
            <span className="truncate">{leadName}</span>
          </Link>
        ) : (
          <span className="mt-1 flex items-center gap-1.5 text-caption text-muted-foreground">
            <User size={12} className="shrink-0" />
            <span>Lead #{deal.leadId.slice(0, 8)}</span>
          </span>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-1">
        {deal.status === "open" ? (
          <div className="border-border/60 mt-2 flex gap-2 border-t pt-2.5">
            <Button
              size="sm"
              variant="outline"
              disabled={isClosing}
              onClick={() => onClose("won")}
              className="flex-1 text-emerald-600 hover:border-emerald-500/30 hover:bg-emerald-500/10 dark:text-emerald-400"
            >
              <Check aria-hidden size={14} />
              Ganhar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isClosing}
              onClick={() => onClose("lost")}
              className="hover:bg-destructive/10 flex-1 text-muted-foreground hover:text-destructive"
            >
              <X aria-hidden size={14} />
              Perder
            </Button>
          </div>
        ) : (
          <div className="border-border/40 mt-2 flex items-center justify-between border-t pt-2 text-[11px] text-muted-foreground">
            <span>Status:</span>
            <span className="font-semibold text-foreground">
              {deal.status === "won" ? "Fechamento Confirmado" : "Proposta Recusada"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
