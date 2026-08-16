"use client";

import { AlertTriangle, CheckCircle2, Trash2, UploadCloud } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { FunnelStage, Source } from "@/modules/crm/domain/entities";
import { extractTableFromFile } from "@/modules/crm/infrastructure/import/extract-table";
import { useCreateLead } from "@/modules/crm/presentation/hooks/use-leads";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { Select } from "@/shared/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

type LeadField = "name" | "email" | "phone" | "ignore";
type Step = "upload" | "processing" | "review" | "importing" | "done";

interface ImportLeadsModalProps {
  open: boolean;
  onClose: () => void;
  funnelStages: FunnelStage[];
  sources: Source[];
}

interface ImportResult {
  success: number;
  errors: string[];
}

const FIELD_LABELS: Record<LeadField, string> = {
  name: "Nome",
  email: "E-mail",
  phone: "Telefone",
  ignore: "Ignorar",
};

const DIACRITICS_PATTERN = new RegExp(
  "[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]",
  "g",
);

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(DIACRITICS_PATTERN, "");
}

function guessMapping(header: string[]): LeadField[] {
  return header.map((cell) => {
    const normalized = stripDiacritics(cell).toLowerCase();
    if (normalized.includes("nome") || normalized.includes("name")) return "name";
    if (normalized.includes("mail")) return "email";
    if (
      normalized.includes("fone") ||
      normalized.includes("phone") ||
      normalized.includes("celular") ||
      normalized.includes("whatsapp")
    )
      return "phone";
    return "ignore";
  });
}

export function ImportLeadsModal({ open, onClose, funnelStages, sources }: ImportLeadsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createLead = useCreateLead();

  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

  const [rows, setRows] = useState<string[][]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [mapping, setMapping] = useState<LeadField[]>([]);
  const [funnelStageId, setFunnelStageId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [result, setResult] = useState<ImportResult>({ success: 0, errors: [] });

  const dataRows = useMemo(() => (hasHeader ? rows.slice(1) : rows), [rows, hasHeader]);
  const nameColumnIndex = mapping.indexOf("name");

  function reset() {
    setStep("upload");
    setError(null);
    setProgress(0);
    setRows([]);
    setMapping([]);
    setResult({ success: 0, errors: [] });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStep("processing");
    setError(null);
    setProgress(0);
    setProgressLabel("Lendo arquivo…");

    try {
      const extracted = await extractTableFromFile(file, (progressEvent) => {
        setProgress(progressEvent.progress);
        setProgressLabel(
          progressEvent.stage === "ocr" ? "Reconhecendo texto na imagem…" : "Processando tabela…",
        );
      });

      if (extracted.length === 0) {
        setError("Não foi possível identificar uma tabela nesse arquivo.");
        setStep("upload");
        return;
      }

      setRows(extracted);
      setMapping(guessMapping(extracted[0] ?? []));
      setFunnelStageId(funnelStages[0]?.id ?? "");
      setSourceId(sources[0]?.id ?? "");
      setStep("review");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao processar o arquivo");
      setStep("upload");
    }
  }

  function updateCell(rowIndex: number, cellIndex: number, value: string) {
    const offset = hasHeader ? rowIndex + 1 : rowIndex;
    setRows((current) => {
      const next = current.map((row) => [...row]);
      const targetRow = next[offset];
      if (targetRow) targetRow[cellIndex] = value;
      return next;
    });
  }

  function removeRow(rowIndex: number) {
    const offset = hasHeader ? rowIndex + 1 : rowIndex;
    setRows((current) => current.filter((_, index) => index !== offset));
  }

  function updateMapping(columnIndex: number, field: LeadField) {
    setMapping((current) => {
      const next = [...current];
      next[columnIndex] = field;
      return next;
    });
  }

  async function handleImport() {
    if (nameColumnIndex === -1) {
      setError("Marque qual coluna corresponde ao nome do lead.");
      return;
    }
    if (!funnelStageId) {
      setError("Selecione o estágio de funil padrão para os leads importados.");
      return;
    }

    setError(null);
    setStep("importing");
    setProgress(0);

    const emailColumnIndex = mapping.indexOf("email");
    const phoneColumnIndex = mapping.indexOf("phone");

    let success = 0;
    const errors: string[] = [];
    const rowsToImport = dataRows.filter((row) => row[nameColumnIndex]?.trim());

    for (let i = 0; i < rowsToImport.length; i++) {
      const row = rowsToImport[i];
      const name = row?.[nameColumnIndex]?.trim();
      if (!row || !name) continue;

      try {
        await createLead.mutateAsync({
          name,
          email: emailColumnIndex >= 0 ? row[emailColumnIndex]?.trim() || undefined : undefined,
          phone: phoneColumnIndex >= 0 ? row[phoneColumnIndex]?.trim() || undefined : undefined,
          sourceId: sourceId || undefined,
          funnelStageId,
        });
        success += 1;
      } catch (cause) {
        const message = cause instanceof ApiError ? cause.message : "Erro desconhecido";
        errors.push(`${name}: ${message}`);
      }
      setProgress((i + 1) / rowsToImport.length);
    }

    setResult({ success, errors });
    setStep("done");
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Importar leads de uma tabela"
      style={{ maxWidth: "56rem" }}
    >
      <div className="flex flex-col gap-4">
        {step === "upload" && (
          <div className="flex flex-col items-center gap-4 rounded-md border border-dashed border-border p-10 text-center">
            <UploadCloud aria-hidden size={32} className="text-muted-foreground" />
            <div>
              <p className="text-body font-medium text-foreground">
                Envie uma foto, PDF ou planilha da tabela
              </p>
              <p className="text-caption text-muted-foreground">
                Imagens e PDFs são lidos por reconhecimento óptico de caracteres (OCR), direto no
                navegador. Planilhas (.xlsx, .xls, .csv) são lidas diretamente.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileSelected}
            />
            <Button type="button" onClick={() => fileInputRef.current?.click()}>
              Escolher arquivo
            </Button>
            {error && (
              <p className="flex items-center gap-2 text-caption text-destructive">
                <AlertTriangle aria-hidden size={14} />
                {error}
              </p>
            )}
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="bg-foreground/10 h-2 w-full max-w-sm overflow-hidden rounded-full">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="text-caption text-muted-foreground">{progressLabel}</p>
          </div>
        )}

        {step === "review" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-4">
              <label className="flex items-center gap-2 text-caption text-foreground">
                <input
                  type="checkbox"
                  checked={hasHeader}
                  onChange={(event) => setHasHeader(event.target.checked)}
                />
                Primeira linha é cabeçalho
              </label>
              <Select
                label="Estágio padrão"
                value={funnelStageId}
                onChange={(event) => setFunnelStageId(event.target.value)}
                className="w-48"
              >
                {funnelStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </Select>
              <Select
                label="Origem padrão"
                value={sourceId}
                onChange={(event) => setSourceId(event.target.value)}
                className="w-48"
              >
                <option value="">Nenhuma</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </Select>
            </div>

            <p className="text-caption text-muted-foreground">
              Escolha o que cada coluna representa e revise os dados extraídos antes de importar.
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  {mapping.map((field, columnIndex) => (
                    <TableHead key={columnIndex}>
                      <Select
                        value={field}
                        onChange={(event) =>
                          updateMapping(columnIndex, event.target.value as LeadField)
                        }
                        className="h-8 text-caption"
                      >
                        {(Object.keys(FIELD_LABELS) as LeadField[]).map((option) => (
                          <option key={option} value={option}>
                            {FIELD_LABELS[option]}
                          </option>
                        ))}
                      </Select>
                    </TableHead>
                  ))}
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <input
                          value={cell}
                          onChange={(event) => updateCell(rowIndex, cellIndex, event.target.value)}
                          className="w-full min-w-24 rounded border border-transparent bg-transparent px-1 py-0.5 text-body hover:border-border focus-visible:border-border focus-visible:outline-none"
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => removeRow(rowIndex)}
                        aria-label="Remover linha"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 aria-hidden size={14} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {error && (
              <p className="flex items-center gap-2 text-caption text-destructive">
                <AlertTriangle aria-hidden size={14} />
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleImport}>
                Importar {dataRows.length} leads
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="bg-foreground/10 h-2 w-full max-w-sm overflow-hidden rounded-full">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="text-caption text-muted-foreground">Importando leads…</p>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-body text-foreground">
              <CheckCircle2 aria-hidden size={18} className="text-success" />
              {result.success} lead(s) importado(s) com sucesso.
            </div>
            {result.errors.length > 0 && (
              <div className="border-destructive/30 bg-destructive/5 flex flex-col gap-1 rounded-md border p-3">
                <p className="flex items-center gap-2 text-caption font-medium text-destructive">
                  <AlertTriangle aria-hidden size={14} />
                  {result.errors.length} falha(s)
                </p>
                <ul className="list-disc pl-5 text-caption text-muted-foreground">
                  {result.errors.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end">
              <Button type="button" onClick={handleClose}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
