/**
 * Evaluate workbook formulas in the browser so the editor can show results.
 *
 * Files written by tools other than Excel (e.g. openpyxl) store formulas without their
 * results, so a viewer that only reads stored results shows blanks/zeros. This computes
 * them on demand, including the user's unsaved edits, using fast-formula-parser (MIT).
 * Cells whose formula can't be evaluated here fall back to the stored result.
 */
import FormulaParser from "fast-formula-parser";
import { parseInput } from "./xlsxPatch";

export type CellValue = number | string | boolean | null | { error: string };

interface Ref { sheet?: string; row: number; col: number }
interface RangeRef { sheet?: string; from: { row: number; col: number }; to: { row: number; col: number } }

export interface Evaluator {
  /** Computed value of a cell (0-based row/col); undefined if it can't be computed */
  value(sheet: string, r: number, c: number): CellValue | undefined;
}

const keyOf = (sheet: string, addr: string) => `${sheet}\u0000${addr}`;

export function createEvaluator(XLSX: any, wb: any, edits: Map<string, string>): Evaluator {
  const cache = new Map<string, CellValue | undefined>();
  const visiting = new Set<string>();
  const sheetNames: string[] = wb.SheetNames;
  const resolveSheet = (name?: string, fallback?: string) => {
    if (!name) return fallback || sheetNames[0];
    return sheetNames.find((s) => s.toLowerCase() === name.toLowerCase()) || name;
  };
  const sheetBounds = (sheet: string) => {
    const ws = wb.Sheets[sheet];
    return ws?.["!ref"] ? XLSX.utils.decode_range(ws["!ref"]) : { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
  };

  // Workbook-level defined names (e.g. Rate = Calculation!$B$9)
  const names = new Map<string, string>();
  for (const n of wb.Workbook?.Names || []) if (n.Name && n.Ref && n.Sheet == null) names.set(String(n.Name).toUpperCase(), n.Ref);

  // A parser can't be re-entered mid-parse, and evaluating a referenced formula happens inside
  // the outer formula's callbacks, so each nesting level gets its own parser instance.
  const parsers: any[] = [];
  let depth = 0;
  const parserAt = (d: number) => (parsers[d] ??= makeParser());
  const makeParser = () => new FormulaParser({
    onCell: (ref: Ref) => toParser(value(resolveSheet(ref.sheet, current), ref.row - 1, ref.col - 1)),
    onRange: (ref: RangeRef) => {
      const sheet = resolveSheet(ref.sheet, current);
      const b = sheetBounds(sheet);
      // Whole-column/row references (A:A, 1:1) only need to cover the used area
      const toRow = Math.min(ref.to.row, b.e.r + 1);
      const toCol = Math.min(ref.to.col, b.e.c + 1);
      const out: unknown[][] = [];
      for (let r = ref.from.row; r <= toRow; r++) {
        const row: unknown[] = [];
        for (let c = ref.from.col; c <= toCol; c++) row.push(toParser(value(sheet, r - 1, c - 1)));
        out.push(row);
      }
      return out;
    },
    onVariable: (name: string, sheet?: string) => {
      const target = names.get(name.toUpperCase());
      if (!target) return null;
      const [sheetPart, cellPart] = target.includes("!") ? target.split("!") : [sheet, target];
      const s = sheetPart?.replace(/^'|'$/g, "").replace(/''/g, "'");
      const clean = (cellPart || "").replace(/\$/g, "");
      if (clean.includes(":")) {
        const rg = XLSX.utils.decode_range(clean);
        return { sheet: s, from: { row: rg.s.r + 1, col: rg.s.c + 1 }, to: { row: rg.e.r + 1, col: rg.e.c + 1 } };
      }
      const a = XLSX.utils.decode_cell(clean);
      return { sheet: s, row: a.r + 1, col: a.c + 1 };
    },
  });

  let current = sheetNames[0];

  // Errors must reach the parser as FormulaError so they propagate (e.g. SUM over an error is an error)
  function toParser(v: CellValue | undefined): unknown {
    if (v && typeof v === "object" && "error" in v) return new FormulaParser.FormulaError(v.error);
    return v ?? null;
  }

  function evalFormula(formula: string, sheet: string, r: number, c: number): CellValue | undefined {
    const prev = current;
    current = sheet;
    const parser = parserAt(depth++);
    try {
      const res = parser.parse(formula, { sheet, row: r + 1, col: c + 1 });
      if (res instanceof FormulaParser.FormulaError || (res && typeof res === "object" && "_error" in res)) {
        const msg = String((res as any).error ?? (res as any)._error ?? "#VALUE!");
        // Functions this engine doesn't know: let the caller use Excel's stored result instead
        return msg === "#NAME?" ? undefined : { error: msg };
      }
      if (Array.isArray(res)) return (res[0]?.[0] ?? null) as CellValue;
      return res as CellValue;
    } catch (e: any) {
      const msg = e?.error || e?._error;
      return msg && msg !== "#NAME?" ? { error: String(msg) } : undefined;
    } finally {
      depth--;
      current = prev;
    }
  }

  function value(sheet: string, r: number, c: number): CellValue | undefined {
    const addr = XLSX.utils.encode_cell({ r, c });
    const k = keyOf(sheet, addr);
    if (cache.has(k)) return cache.get(k);
    if (visiting.has(k)) return { error: "#REF!" }; // circular reference
    visiting.add(k);
    let v: CellValue | undefined;
    try {
      if (edits.has(k)) {
        const p = parseInput(edits.get(k)!);
        v = p.kind === "formula" ? evalFormula(p.formula, sheet, r, c)
          : p.kind === "number" || p.kind === "bool" ? p.value
          : p.kind === "text" ? p.value : null;
      } else {
        const cell = wb.Sheets[sheet]?.[addr];
        if (!cell) v = null;
        else if (cell.f) {
          v = evalFormula(cell.f, sheet, r, c);
          if (v === undefined) v = cell.v ?? null; // fall back to Excel's stored result
        } else if (cell.t === "e") v = { error: cell.w || "#N/A" };
        else v = cell.v ?? null;
      }
    } finally {
      visiting.delete(k);
    }
    cache.set(k, v);
    return v;
  }

  return { value };
}
