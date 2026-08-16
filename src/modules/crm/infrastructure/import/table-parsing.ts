import type Tesseract from "tesseract.js";

type Block = Tesseract.Block;
type Line = Tesseract.Line;
type Word = Tesseract.Word;

interface Interval {
  start: number;
  end: number;
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Interval[] = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end) {
      last.end = Math.max(last.end, interval.end);
    } else {
      merged.push({ ...interval });
    }
  }
  return merged;
}

/**
 * Detecta colunas por "corredores" verticais de espaço em branco comuns a
 * TODAS as linhas — a mesma ideia usada por extratores de tabela de texto
 * (ex: `pdftotext -layout`). Um gap que é vazio em uma linha mas ocupado em
 * outra não é um separador de coluna real; só sobrevive à união o espaço
 * que nenhuma linha jamais preenche.
 */
function detectColumnRanges(lines: Line[]): Interval[] {
  const wordIntervals = lines.flatMap((line) =>
    line.words.map((word) => ({ start: word.bbox.x0, end: word.bbox.x1 })),
  );
  if (wordIntervals.length === 0) return [];

  const covered = mergeIntervals(wordIntervals);
  const minX = Math.min(...wordIntervals.map((interval) => interval.start));
  const maxX = Math.max(...wordIntervals.map((interval) => interval.end));

  const gaps: Interval[] = [];
  for (let i = 1; i < covered.length; i++) {
    const previous = covered[i - 1];
    const current = covered[i];
    if (previous && current) gaps.push({ start: previous.end, end: current.start });
  }

  const avgWordWidth =
    wordIntervals.reduce((sum, interval) => sum + (interval.end - interval.start), 0) /
    wordIntervals.length;
  const minGapWidth = Math.max(avgWordWidth * 0.6, 8);

  const separators = gaps
    .filter((gap) => gap.end - gap.start >= minGapWidth)
    .map((gap) => (gap.start + gap.end) / 2);

  const boundaries = [minX, ...separators, maxX + 1];
  const ranges: Interval[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    if (start !== undefined && end !== undefined) ranges.push({ start, end });
  }
  return ranges;
}

function columnIndexFor(word: Word, columns: Interval[]): number {
  const center = (word.bbox.x0 + word.bbox.x1) / 2;
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    if (!column) continue;
    if (center >= column.start && center < column.end) return i;
    const distance = center < column.start ? column.start - center : center - column.end;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function lineToRow(line: Line, columns: Interval[]): string[] {
  const row = columns.map(() => [] as string[]);
  const words = [...line.words].sort((a, b) => a.bbox.x0 - b.bbox.x0);
  for (const word of words) {
    row[columnIndexFor(word, columns)]?.push(word.text);
  }
  return row.map((cellWords) => cellWords.join(" ").trim());
}

/**
 * Tesseract já agrupa palavras em linhas por análise de layout; cada linha
 * vira uma linha de tabela. As colunas são inferidas globalmente (ver
 * detectColumnRanges) e depois cada palavra da linha é encaixada na coluna
 * mais próxima.
 */
export function blocksToRows(blocks: Block[]): string[][] {
  const lines: Line[] = [];
  for (const block of blocks) {
    for (const paragraph of block.paragraphs) {
      for (const line of paragraph.lines) {
        if (line.words.length > 0) lines.push(line);
      }
    }
  }

  lines.sort((a, b) => a.bbox.y0 - b.bbox.y0);

  const columns = detectColumnRanges(lines);
  if (columns.length === 0) return [];

  return lines
    .map((line) => lineToRow(line, columns))
    .filter((row) => row.some((cell) => cell.length > 0));
}

/**
 * Planilhas/CSVs lidos diretamente podem ter linhas com números de coluna
 * diferentes (linhas em branco, células finais vazias omitidas). Normaliza
 * para a contagem mais comum entre as linhas com mais de uma célula,
 * preenchendo/cortando o resto.
 */
export function normalizeRows(rows: string[][]): string[][] {
  const multiCellRows = rows.filter((row) => row.length > 1);
  if (multiCellRows.length === 0) return rows.map((row) => row);

  const counts = new Map<number, number>();
  for (const row of multiCellRows) {
    counts.set(row.length, (counts.get(row.length) ?? 0) + 1);
  }
  let columnCount = multiCellRows[0]?.length ?? 0;
  let bestFrequency = 0;
  for (const [length, frequency] of counts) {
    if (frequency > bestFrequency) {
      bestFrequency = frequency;
      columnCount = length;
    }
  }

  return rows
    .filter((row) => row.length > 0)
    .map((row) => {
      const normalized = row.slice(0, columnCount);
      while (normalized.length < columnCount) normalized.push("");
      return normalized;
    });
}
