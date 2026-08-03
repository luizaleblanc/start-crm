"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFunnelStages, useSources } from "@/modules/crm/presentation/hooks/use-catalog";
import { useLeads } from "@/modules/crm/presentation/hooks/use-leads";
import { Badge } from "@/shared/ui/badge";
import { Select } from "@/shared/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export default function LeadsPage() {
  const leadsQuery = useLeads(1, 100);
  const funnelStagesQuery = useFunnelStages();
  const sourcesQuery = useSources();

  const [stageFilter, setStageFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const leads = leadsQuery.data?.data ?? [];
  const funnelStages = funnelStagesQuery.data?.data ?? [];
  const sources = sourcesQuery.data?.data ?? [];

  const stageNameById = useMemo(
    () => new Map((funnelStagesQuery.data?.data ?? []).map((stage) => [stage.id, stage.name])),
    [funnelStagesQuery.data],
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
      <div className="flex flex-wrap items-end gap-4">
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
          {leadsQuery.isLoading && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                Carregando…
              </TableCell>
            </TableRow>
          )}
          {!leadsQuery.isLoading && filteredLeads.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                Nenhum lead encontrado.
              </TableCell>
            </TableRow>
          )}
          {filteredLeads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <Link
                  href={`/leads/${lead.id}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  {lead.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{lead.email}</TableCell>
              <TableCell>{sourceNameById.get(lead.sourceId) ?? lead.sourceId}</TableCell>
              <TableCell>
                <Badge>{stageNameById.get(lead.funnelStageId) ?? lead.funnelStageId}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
