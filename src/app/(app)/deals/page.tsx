"use client";

import { Check, X } from "lucide-react";
import { useMemo } from "react";
import type { Deal, DealStatus } from "@/modules/crm/domain/entities";
import { useCloseDeal, useDeals } from "@/modules/crm/presentation/hooks/use-deals";
import { useLeads } from "@/modules/crm/presentation/hooks/use-leads";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { ErrorState } from "@/shared/ui/error-state";
import { Skeleton } from "@/shared/ui/skeleton";

const COLUMNS: Array<{ status: DealStatus; label: string }> = [
  { status: "open", label: "Em aberto" },
  { status: "won", label: "Ganhos" },
  { status: "lost", label: "Perdidos" },
];

export default function DealsPage() {
  const dealsQuery = useDeals();
  const leadsQuery = useLeads(1, 100);
  const closeDeal = useCloseDeal();

  const deals = dealsQuery.data?.data ?? [];
  const leadNameById = useMemo(
    () => new Map((leadsQuery.data?.data ?? []).map((lead) => [lead.id, lead.name])),
    [leadsQuery.data],
  );

  if (dealsQuery.isError) {
    return <ErrorState title="Não foi possível carregar os negócios" />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map((column) => {
        const columnDeals = deals.filter((deal) => deal.status === column.status);
        const columnTotal = columnDeals.reduce((total, deal) => total + deal.value, 0);

        return (
          <div key={column.status} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-h6 uppercase text-muted-foreground">{column.label}</h2>
              <span className="text-caption text-muted-foreground">
                {columnTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>

            {dealsQuery.isLoading && (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            )}
            {!dealsQuery.isLoading && columnDeals.length === 0 && (
              <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-caption text-muted-foreground">
                Nenhum negócio.
              </p>
            )}

            {columnDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                leadName={leadNameById.get(deal.leadId)}
                onClose={(status) => closeDeal.mutate({ dealId: deal.id, status })}
                isClosing={closeDeal.isPending}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function DealCard({
  deal,
  leadName,
  onClose,
  isClosing,
}: {
  deal: Deal;
  leadName: string | undefined;
  onClose: (status: "won" | "lost") => void;
  isClosing: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <p className="text-body font-semibold text-foreground">{deal.title}</p>
        {leadName && <p className="text-caption text-muted-foreground">{leadName}</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Badge>{deal.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</Badge>
        {deal.status === "open" && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={isClosing} onClick={() => onClose("won")}>
              <Check aria-hidden size={14} />
              Ganhar
            </Button>
            <Button size="sm" variant="ghost" disabled={isClosing} onClick={() => onClose("lost")}>
              <X aria-hidden size={14} />
              Perder
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
