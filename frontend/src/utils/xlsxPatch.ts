/**
 * Apply cell edits to an .xlsx file by rewriting only the edited cells' XML.
 *
 * Everything else in the package (other sheets, styles, pivot tables, charts, comments,
 * validation, conditional formatting) is left byte-for-byte as it was. Libraries that load
 * the whole workbook and write it back drop pivots/charts/comments, so we avoid them here.
 *
 * Formula results are not recalculated in the browser; the workbook is flagged so Excel
 * recalculates everything when it is next opened.
 */
import JSZip from "jszip";

export interface CellEdit {
  sheet: string;   // sheet name as shown on the tab
  address: string; // A1-style address, e.g. "C12"
  input: string;   // what the user typed: "=SUM(A1:A3)", "1,00,000", "10-Oct-2026", "text", or "" to clear
}

export class XlsxPatchError extends Error {
  constructor(message: string, public cells: string[] = []) {
    super(message);
  }
}

const REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function colIndex(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}
function splitAddress(address: string): { col: number; row: number; letters: string } {
  const m = /^([A-Za-z]{1,3})(\d+)$/.exec(address.trim());
  if (!m) throw new XlsxPatchError(`Invalid cell address: ${address}`);
  return { col: colIndex(m[1]), row: Number(m[2]), letters: m[1].toUpperCase() };
}
function resolvePath(base: string, target: string): string {
  if (target.startsWith("/")) return target.slice(1);
  const parts = base.split("/").slice(0, -1);
  for (const seg of target.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== ".") parts.push(seg);
  }
  return parts.join("/");
}
function relsPathFor(partPath: string): string {
  const i = partPath.lastIndexOf("/");
  return `${partPath.slice(0, i)}/_rels/${partPath.slice(i + 1)}.rels`;
}
function childrenByLocalName(el: Element, name: string): Element[] {
  return Array.from(el.childNodes).filter((n): n is Element => n.nodeType === 1 && (n as Element).localName === name);
}

/** Excel serial date (1900 system) for a calendar date. */
function excelSerial(y: number, m: number, d: number): number | null {
  const dt = Date.UTC(y, m - 1, d);
  const check = new Date(dt);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return null;
  return Math.round((dt - Date.UTC(1899, 11, 30)) / 86400000);
}

type Parsed =
  | { kind: "empty" }
  | { kind: "formula"; formula: string }
  | { kind: "number"; value: number }
  | { kind: "bool"; value: boolean }
  | { kind: "text"; value: string };

/** Interpret what the user typed the way Excel would (numbers, dates, percentages, booleans, formulas). */
export function parseInput(raw: string): Parsed {
  const input = raw;
  if (input.trim() === "") return { kind: "empty" };
  if (input.startsWith("=") && input.length > 1) return { kind: "formula", formula: input.slice(1) };
  const t = input.trim();
  if (/^(true|false)$/i.test(t)) return { kind: "bool", value: t.toLowerCase() === "true" };
  // Keep codes with leading zeros (phone numbers, PIN codes) as text
  if (/^0\d/.test(t)) return { kind: "text", value: input };
  const num = t.replace(/,/g, "");
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(num) && (t === num || /^[-+]?\d{1,3}(,\d{2,3})*(\.\d+)?$/.test(t))) {
    return { kind: "number", value: Number(num) };
  }
  if (/^[-+]?(\d+\.?\d*|\.\d+)%$/.test(num)) return { kind: "number", value: Number(num.slice(0, -1)) / 100 };
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (m) { const s = excelSerial(+m[1], +m[2], +m[3]); if (s !== null) return { kind: "number", value: s }; }
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(t); // dd-mm-yyyy (Indian order)
  if (m) { const s = excelSerial(+m[3], +m[2], +m[1]); if (s !== null) return { kind: "number", value: s }; }
  m = /^(\d{1,2})[- ]([A-Za-z]{3})[a-z]*[- ,]+(\d{4})$/.exec(t); // 10-Oct-2026, 10 October 2026
  if (m && MONTHS.includes(m[2].toLowerCase())) {
    const s = excelSerial(+m[3], MONTHS.indexOf(m[2].toLowerCase()) + 1, +m[1]);
    if (s !== null) return { kind: "number", value: s };
  }
  return { kind: "text", value: input };
}

export async function patchXlsx(data: ArrayBuffer | Uint8Array, edits: CellEdit[]): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(data);
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  const readXml = async (path: string) => {
    const f = zip.file(path);
    if (!f) throw new XlsxPatchError(`Missing part ${path} in workbook`);
    return parser.parseFromString(await f.async("string"), "application/xml");
  };
  const writeXml = (path: string, doc: Document) => {
    let xml = serializer.serializeToString(doc);
    if (!xml.startsWith("<?xml")) xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xml}`;
    zip.file(path, xml);
  };

  // Locate the workbook part and map sheet names to their XML parts
  const rootRels = await readXml("_rels/.rels");
  const wbTarget = Array.from(rootRels.getElementsByTagName("Relationship"))
    .find((r) => (r.getAttribute("Type") || "").endsWith("/officeDocument"))?.getAttribute("Target") || "xl/workbook.xml";
  const wbPath = resolvePath("", wbTarget);
  const wbRelsPath = relsPathFor(wbPath);
  const wbDoc = await readXml(wbPath);
  const wbRels = await readXml(wbRelsPath);
  const relTarget = new Map<string, { target: string; type: string }>();
  Array.from(wbRels.getElementsByTagName("Relationship")).forEach((r) =>
    relTarget.set(r.getAttribute("Id") || "", { target: r.getAttribute("Target") || "", type: r.getAttribute("Type") || "" }));
  const sheetPath = new Map<string, string>();
  Array.from(wbDoc.getElementsByTagName("*"))
    .filter((e) => e.localName === "sheet")
    .forEach((s) => {
      const rid = s.getAttributeNS(REL_NS, "id") || s.getAttribute("r:id") || "";
      const rel = relTarget.get(rid);
      if (rel) sheetPath.set(s.getAttribute("name") || "", resolvePath(wbPath, rel.target));
    });

  // Group edits by sheet; the last edit to a cell wins
  const bySheet = new Map<string, Map<string, string>>();
  for (const e of edits) {
    if (!sheetPath.has(e.sheet)) throw new XlsxPatchError(`Sheet "${e.sheet}" not found`);
    const addr = splitAddress(e.address).letters + splitAddress(e.address).row;
    if (!bySheet.has(e.sheet)) bySheet.set(e.sheet, new Map());
    bySheet.get(e.sheet)!.set(addr, e.input);
  }

  const blocked: string[] = [];
  for (const [sheetName, cells] of bySheet) {
    const path = sheetPath.get(sheetName)!;
    const doc = await readXml(path);
    const ns = doc.documentElement.namespaceURI;
    const sheetData = Array.from(doc.getElementsByTagName("*")).find((e) => e.localName === "sheetData");
    if (!sheetData) throw new XlsxPatchError(`Sheet "${sheetName}" has no cell data`);

    // Tables on this sheet: header cells must stay in sync with the table's column names
    const tableHeaders = new Map<string, { path: string; doc: Document; index: number }>();
    const sheetRelsFile = zip.file(relsPathFor(path));
    if (sheetRelsFile) {
      const sheetRels = parser.parseFromString(await sheetRelsFile.async("string"), "application/xml");
      for (const r of Array.from(sheetRels.getElementsByTagName("Relationship"))) {
        if (!(r.getAttribute("Type") || "").endsWith("/table")) continue;
        const tPath = resolvePath(path, r.getAttribute("Target") || "");
        const tDoc = await readXml(tPath);
        const tbl = tDoc.documentElement;
        if (tbl.getAttribute("headerRowCount") === "0") continue;
        const [start] = (tbl.getAttribute("ref") || "").split(":");
        if (!start) continue;
        const s = splitAddress(start);
        const cols = Array.from(tDoc.getElementsByTagName("*")).filter((e) => e.localName === "tableColumn");
        cols.forEach((_, i) => {
          tableHeaders.set(`${s.row}:${s.col + i}`, { path: tPath, doc: tDoc, index: i });
        });
      }
    }
    const touchedTables = new Set<string>();

    for (const [addr, input] of cells) {
      const { row, col } = splitAddress(addr);
      // Find or create the row, keeping rows in order
      const rows = childrenByLocalName(sheetData, "row");
      let rowEl = rows.find((r) => Number(r.getAttribute("r")) === row);
      if (!rowEl) {
        rowEl = doc.createElementNS(ns, "row");
        rowEl.setAttribute("r", String(row));
        const after = rows.find((r) => Number(r.getAttribute("r")) > row);
        sheetData.insertBefore(rowEl, after || null);
      }
      // Find or create the cell, keeping cells in column order
      const cellsInRow = childrenByLocalName(rowEl, "c");
      let cEl = cellsInRow.find((c) => (c.getAttribute("r") || "").toUpperCase() === addr);
      if (!cEl) {
        cEl = doc.createElementNS(ns, "c");
        cEl.setAttribute("r", addr);
        const after = cellsInRow.find((c) => splitAddress(c.getAttribute("r") || "A1").col > col);
        rowEl.insertBefore(cEl, after || null);
        // New cell picks up the row's default style, if any
        if (rowEl.getAttribute("customFormat") === "1" && rowEl.getAttribute("s")) cEl.setAttribute("s", rowEl.getAttribute("s")!);
      }
      // Shared/array formula anchors drive other cells — editing them in the browser would break those cells
      const f = childrenByLocalName(cEl, "f")[0];
      if (f && ((f.getAttribute("t") === "shared" && f.getAttribute("ref")) || f.getAttribute("t") === "array")) {
        blocked.push(`${sheetName}!${addr}`);
        continue;
      }
      // Reset content, keep the style
      Array.from(cEl.childNodes).forEach((n) => cEl!.removeChild(n));
      ["t", "cm", "vm"].forEach((a) => cEl!.removeAttribute(a));
      const parsed = parseInput(input);
      const add = (name: string, text: string, attrs: Record<string, string> = {}) => {
        const el = doc.createElementNS(ns, name);
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
        el.textContent = text;
        cEl!.appendChild(el);
        return el;
      };
      if (parsed.kind === "formula") add("f", parsed.formula);
      else if (parsed.kind === "number") add("v", String(parsed.value));
      else if (parsed.kind === "bool") { cEl.setAttribute("t", "b"); add("v", parsed.value ? "1" : "0"); }
      else if (parsed.kind === "text") {
        cEl.setAttribute("t", "inlineStr");
        const is = doc.createElementNS(ns, "is");
        const t = doc.createElementNS(ns, "t");
        t.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
        t.textContent = parsed.value;
        is.appendChild(t);
        cEl.appendChild(is);
      }
      // Keep table column names in step with edited header cells
      const th = tableHeaders.get(`${row}:${col}`);
      if (th) {
        const name = parsed.kind === "text" ? parsed.value : input.trim();
        if (!name) { blocked.push(`${sheetName}!${addr}`); continue; }
        const cols = Array.from(th.doc.getElementsByTagName("*")).filter((e) => e.localName === "tableColumn");
        cols[th.index].setAttribute("name", name);
        touchedTables.add(th.path);
      }
    }
    if (blocked.length) {
      throw new XlsxPatchError(
        "Some cells drive a block of formulas (shared or array formulas) or are table headers that can't be blank. Change them in Excel instead.",
        blocked,
      );
    }
    writeXml(path, doc);
    for (const tPath of touchedTables) {
      for (const th of tableHeaders.values()) if (th.path === tPath) { writeXml(tPath, th.doc); break; }
    }
  }

  // Excel rebuilds the calculation chain itself; a stale one makes it offer to "repair" the file
  for (const r of Array.from(wbRels.getElementsByTagName("Relationship"))) {
    if ((r.getAttribute("Type") || "").endsWith("/calcChain")) {
      zip.remove(resolvePath(wbPath, r.getAttribute("Target") || ""));
      r.parentNode?.removeChild(r);
      const ct = await readXml("[Content_Types].xml");
      Array.from(ct.getElementsByTagName("Override"))
        .filter((o) => (o.getAttribute("PartName") || "").toLowerCase().endsWith("calcchain.xml"))
        .forEach((o) => o.parentNode?.removeChild(o));
      writeXml("[Content_Types].xml", ct);
      writeXml(wbRelsPath, wbRels);
    }
  }

  // Ask Excel to recalculate every formula on open
  const wbEl = wbDoc.documentElement;
  let calcPr = childrenByLocalName(wbEl, "calcPr")[0];
  if (!calcPr) {
    calcPr = wbDoc.createElementNS(wbEl.namespaceURI, "calcPr");
    const laterSiblings = ["oleSize", "customWorkbookViews", "pivotCaches", "smartTagPr", "smartTagTypes", "webPublishing",
      "fileRecoveryPr", "webPublishObjects", "extLst"];
    const before = Array.from(wbEl.childNodes).find((n) => n.nodeType === 1 && laterSiblings.includes((n as Element).localName));
    wbEl.insertBefore(calcPr, before || null);
  }
  calcPr.setAttribute("fullCalcOnLoad", "1");
  writeXml(wbPath, wbDoc);

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
