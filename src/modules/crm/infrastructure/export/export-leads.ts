import type { Lead } from "@/modules/crm/domain/entities";
import { downloadBlob } from "./download-blob";

export type ExportFormat = "xlsx" | "pdf" | "docx";

export interface ExportLookup {
  stageNameById: Map<string, string>;
  sourceNameById: Map<string, string>;
}

const HEADERS = ["Nome", "E-mail", "Telefone", "Origem", "Estágio"];

function leadsToRows(leads: Lead[], lookup: ExportLookup): string[][] {
  return leads.map((lead) => [
    lead.name,
    lead.email ?? "",
    lead.phone ?? "",
    lookup.sourceNameById.get(lead.sourceId) ?? "",
    lookup.stageNameById.get(lead.funnelStageId) ?? "",
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
  worksheet["!cols"] = HEADERS.map(() => ({ wch: 24 }));

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
  doc.text("Leads", 14, 15);
  autoTable(doc, {
    head: [HEADERS],
    body: rows,
    startY: 20,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  downloadBlob(doc.output("blob"), timestampedFilename("pdf"));
}

async function exportToDocx(rows: string[][]): Promise<void> {
  const { Document, Packer, Table, TableRow, TableCell, Paragraph, HeadingLevel, WidthType } =
    await import("docx");

  const headerRow = new TableRow({
    tableHeader: true,
    children: HEADERS.map(
      (header) =>
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
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
              width: { size: 20, type: WidthType.PERCENTAGE },
              children: [new Paragraph(cell)],
            }),
        ),
      }),
  );

  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "Leads", heading: HeadingLevel.HEADING_1 }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  downloadBlob(blob, timestampedFilename("docx"));
}
