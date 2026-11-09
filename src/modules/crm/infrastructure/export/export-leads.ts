import type { Lead } from "@/modules/crm/domain/entities";
import { downloadBlob } from "./download-blob";

export type ExportFormat = "xlsx" | "pdf" | "docx";

export interface ExportLookup {
  stageNameById: Map<string, string>;
  sourceNameById: Map<string, string>;
}

const HEADERS = [
  "Nome",
  "E-mail",
  "Telefone",
  "Empresa",
  "Cargo",
  "Cidade",
  "LinkedIn",
  "Origem",
  "Responsável",
  "Estágio",
  "Situação",
  "Data",
];

function sanitizeSpreadsheetCell(value: string): string {
  if (!value) return "";
  const trimmed = value.trimStart();
  if (/^[=@+\-\t\r]/.test(trimmed)) {
    return `'${value}`;
  }
  return value;
}

function leadsToRows(leads: Lead[], lookup: ExportLookup): string[][] {
  return leads.map((lead) => [
    sanitizeSpreadsheetCell(lead.name),
    sanitizeSpreadsheetCell(lead.email ?? ""),
    sanitizeSpreadsheetCell(lead.phone ?? ""),
    sanitizeSpreadsheetCell(lead.company ?? ""),
    sanitizeSpreadsheetCell(lead.jobTitle ?? ""),
    sanitizeSpreadsheetCell(lead.city ?? ""),
    sanitizeSpreadsheetCell(lead.linkedinUrl ?? ""),
    sanitizeSpreadsheetCell(lookup.sourceNameById.get(lead.sourceId) ?? ""),
    sanitizeSpreadsheetCell(lead.ownerName ?? ""),
    sanitizeSpreadsheetCell(lookup.stageNameById.get(lead.funnelStageId) ?? ""),
    sanitizeSpreadsheetCell(lead.situation ?? ""),
    sanitizeSpreadsheetCell(
      lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("pt-BR") : "",
    ),
  ]);
}

function timestampedFilename(extension: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `leads-${stamp}.${extension}`;
}

export async function exportLeads(
  format: ExportFormat,
  leads: Lead[],
  lookup: ExportLookup,
): Promise<void> {
  const rows = leadsToRows(leads, lookup);

  if (format === "xlsx") return exportToXlsx(rows);
  if (format === "pdf") return exportToPdf(rows);
  return exportToDocx(rows);
}

async function exportToXlsx(rows: string[][]): Promise<void> {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  worksheet["!cols"] = [
    { wch: 26 }, // Nome
    { wch: 28 }, // E-mail
    { wch: 18 }, // Telefone
    { wch: 24 }, // Empresa
    { wch: 22 }, // Cargo
    { wch: 18 }, // Cidade
    { wch: 30 }, // LinkedIn
    { wch: 24 }, // Origem
    { wch: 16 }, // Responsável
    { wch: 16 }, // Estágio
    { wch: 24 }, // Situação
    { wch: 14 }, // Data
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, timestampedFilename("xlsx"));
}

async function exportToPdf(rows: string[][]): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Relatório de Leads — Start CRM", 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Total: ${rows.length} leads exportados`, 14, 21);

  autoTable(doc, {
    head: [HEADERS],
    body: rows,
    startY: 25,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255] },
  });

  downloadBlob(doc.output("blob"), timestampedFilename("pdf"));
}

async function exportToDocx(rows: string[][]): Promise<void> {
  const { Document, Packer, Table, TableRow, TableCell, Paragraph, HeadingLevel, WidthType } =
    await import("docx");

  const colWidthPct = Math.floor(100 / HEADERS.length);

  const headerRow = new TableRow({
    tableHeader: true,
    children: HEADERS.map(
      (header) =>
        new TableCell({
          width: { size: colWidthPct, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ text: header, heading: HeadingLevel.HEADING_6 })],
        }),
    ),
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              width: { size: colWidthPct, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ text: cell })],
            }),
        ),
      }),
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Start CRM — Exportação de Leads",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: `Data de exportação: ${new Date().toLocaleDateString("pt-BR")} | Total: ${rows.length} leads`,
          }),
          new Paragraph({ text: "" }),
          new Table({
            rows: [headerRow, ...dataRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, timestampedFilename("docx"));
}
