import { blocksToRows, normalizeRows } from "./table-parsing";

export interface ExtractProgress {
  stage: "loading" | "ocr" | "parsing";
  progress: number;
}

export type ProgressListener = (progress: ExtractProgress) => void;

const SPREADSHEET_EXTENSIONS = [".xlsx", ".xls", ".csv"];

function isSpreadsheet(file: File): boolean {
  return SPREADSHEET_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension));
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/**
 * Extrai uma tabela (linhas de strings) de um arquivo enviado pelo usuário.
 * Planilhas (.xlsx/.xls/.csv) são lidas diretamente — sem OCR, mais rápido
 * e confiável. Imagens e PDFs passam por reconhecimento óptico de
 * caracteres (Tesseract.js), rodando inteiramente no navegador.
 */
export async function extractTableFromFile(
  file: File,
  onProgress?: ProgressListener,
): Promise<string[][]> {
  if (isSpreadsheet(file)) {
    onProgress?.({ stage: "parsing", progress: 0.5 });
    const { extractTableFromSpreadsheet } = await import("./parse-spreadsheet");
    const rows = await extractTableFromSpreadsheet(file);
    onProgress?.({ stage: "parsing", progress: 1 });
    return normalizeRows(rows);
  }

  if (isPdf(file)) {
    return extractTableFromPdf(file, onProgress);
  }

  return extractTableFromImage(file, onProgress);
}

async function extractTableFromImage(
  source: File | HTMLCanvasElement,
  onProgress?: ProgressListener,
): Promise<string[][]> {
  const { createWorker, PSM } = await import("tesseract.js");

  const worker = await createWorker("por", undefined, {
    logger: (message) => {
      if (message.status === "recognizing text") {
        onProgress?.({ stage: "ocr", progress: message.progress });
      }
    },
  });

  try {
    // PSM 6 (bloco único e uniforme) lida melhor com tabelas do que o modo
    // automático, que tende a fragmentar/mesclar linhas quando há bordas.
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
    const { data } = await worker.recognize(source, {}, { blocks: true });
    onProgress?.({ stage: "parsing", progress: 1 });
    return normalizeRows(blocksToRows(data.blocks ?? []));
  } finally {
    await worker.terminate();
  }
}

async function extractTableFromPdf(file: File, onProgress?: ProgressListener): Promise<string[][]> {
  onProgress?.({ stage: "loading", progress: 0 });
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const allRows: string[][] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvas, viewport }).promise;

    const pageRows = await extractTableFromImage(canvas, (progress) => {
      const pageShare = 1 / pdf.numPages;
      const base = (pageNumber - 1) * pageShare;
      onProgress?.({
        stage: progress.stage,
        progress: base + progress.progress * pageShare,
      });
    });
    allRows.push(...pageRows);
  }

  return normalizeRows(allRows);
}
