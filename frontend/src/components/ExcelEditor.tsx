import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { documentService, type DocumentDto } from "../services/documentService";
import DocumentVersionsPanel from "./DocumentVersionsPanel";
import { patchXlsx, parseInput, XlsxPatchError, type CellEdit } from "../utils/xlsxPatch";
import { createEvaluator, type CellValue } from "../utils/formulaEngine";

/* SheetJS is loaded from its CDN on demand (same build the viewer used before). */
const SHEETJS_URL = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
async function loadSheetJS(): Promise<any> {
  const w = window as any;
  if (w.XLSX) return w.XLSX;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SHEETJS_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load the spreadsheet reader"));
    document.head.appendChild(script);
  });
  return w.XLSX;
}

const MAX_RENDER_ROWS = 3000;
const EXTRA_ROWS = 30; // blank rows below the data so new rows can be added
const EXTRA_COLS = 3;
const ROW_HEADER_W = 46;
const DEFAULT_COL_W = 90;
const DEFAULT_ROW_H = 24;

const keyOf = (sheet: string, addr: string) => `${sheet}\u0000${addr}`;
interface Props {
  doc: DocumentDto;
  objectUrl: string;
  canEdit: boolean;
  canDownload: boolean;
  fullscreen?: boolean;
  /** Called after a save or restore with the new file contents */
  onContentChanged: (bytes: Uint8Array, dto: DocumentDto) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function ExcelEditor({ doc, objectUrl, canEdit, canDownload, fullscreen, onContentChanged, onDirtyChange }: Props) {
  const isXlsx = doc.contentType.includes("spreadsheetml") || doc.originalFileName.toLowerCase().endsWith(".xlsx");
  const editable = canEdit && isXlsx;

  const [XLSX, setXLSX] = useState<any>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [wb, setWb] = useState<any>(null);
  const [loadError, setLoadError] = useState("");
  const [activeSheet, setActiveSheet] = useState("");
  const [sel, setSel] = useState({ r: 0, c: 0 });
  const [editing, setEditing] = useState<string | null>(null); // current input text while editing
  const [edits, setEdits] = useState<Map<string, string>>(new Map());
  const [undo, setUndo] = useState<{ key: string; prev: string | undefined }[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string; cells?: string[] } | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [savedCount, setSavedCount] = useState(0); // bumps the versions list after each save
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dirty = edits.size > 0;
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const parse = useCallback((lib: any, buf: ArrayBuffer, keepSheet?: string) => {
    // sheetStubs keeps formula cells that have no stored result (files written by tools other than Excel)
    const book = lib.read(buf, { type: "array", cellFormula: true, cellNF: true, cellText: true, cellStyles: true, sheetStubs: true });
    setWb(book);
    const visible = (book.SheetNames as string[]).filter((_, i) => (book.Workbook?.Sheets?.[i]?.Hidden ?? 0) !== 2);
    const startIdx = book.Workbook?.WBView?.[0]?.activeTab ?? 0;
    const start = keepSheet && visible.includes(keepSheet) ? keepSheet : book.SheetNames[startIdx] ?? visible[0];
    setActiveSheet(visible.includes(start) ? start : visible[0]);
  }, []);

  // Load the file and the reader
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lib = await loadSheetJS();
        const buf = await (await fetch(objectUrl)).arrayBuffer();
        if (cancelled) return;
        setXLSX(() => lib);
        setBuffer(buf);
        parse(lib, buf);
      } catch (e: any) {
        if (!cancelled) setLoadError(e.message || "Could not read this spreadsheet");
      }
    })();
    return () => { cancelled = true; };
  }, [objectUrl, parse]);

  const ws = wb && activeSheet ? wb.Sheets[activeSheet] : null;

  // Grid geometry for the active sheet
  const grid = useMemo(() => {
    if (!ws || !XLSX) return null;
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
    const lastRow = Math.min(range.e.r + EXTRA_ROWS, MAX_RENDER_ROWS - 1);
    const lastCol = Math.min(range.e.c + EXTRA_COLS, 16383);
    const colsMeta: any[] = ws["!cols"] || [];
    const rowsMeta: any[] = ws["!rows"] || [];
    const cols: { c: number; w: number }[] = [];
    for (let c = 0; c <= lastCol; c++) {
      const m = colsMeta[c];
      if (m?.hidden) continue;
      const w = m?.wpx ?? (m?.wch ? Math.round(m.wch * 7 + 10) : m?.width ? Math.round(m.width * 7 + 5) : DEFAULT_COL_W);
      cols.push({ c, w: Math.max(28, Math.min(w, 420)) });
    }
    const rows: { r: number; h: number }[] = [];
    for (let r = 0; r <= lastRow; r++) {
      const m = rowsMeta[r];
      if (m?.hidden) continue;
      rows.push({ r, h: Math.max(20, Math.min(m?.hpx ?? DEFAULT_ROW_H, 120)) });
    }
    const span = new Map<string, { rs: number; cs: number }>();
    const covered = new Set<string>();
    for (const m of ws["!merges"] || []) {
      span.set(`${m.s.r}:${m.s.c}`, { rs: m.e.r - m.s.r + 1, cs: m.e.c - m.s.c + 1 });
      for (let r = m.s.r; r <= m.e.r; r++) for (let c = m.s.c; c <= m.e.c; c++) if (r !== m.s.r || c !== m.s.c) covered.add(`${r}:${c}`);
    }
    return { range, rows, cols, span, covered, truncated: range.e.r + 1 > MAX_RENDER_ROWS };
  }, [ws, XLSX]);

  const addrOf = useCallback((r: number, c: number) => (XLSX ? XLSX.utils.encode_cell({ r, c }) : ""), [XLSX]);

  // Formula results computed in the browser (includes unsaved edits); rebuilt whenever edits change
  const evaluator = useMemo(() => (XLSX && wb ? createEvaluator(XLSX, wb, edits) : null), [XLSX, wb, edits]);
  const formatValue = (v: CellValue | undefined, numFmt?: string): string => {
    if (v === undefined || v === null) return "";
    if (typeof v === "object") return v.error;
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
    if (typeof v === "number") {
      // Excel's General format shows about 10 significant digits (9666.99164345404 -> 9666.991643)
      if (!numFmt || numFmt === "General") return Math.abs(v) >= 1e11 ? v.toExponential(5) : String(Number(v.toPrecision(10)));
      try { return XLSX.SSF.format(numFmt, v); } catch { return String(v); }
    }
    return String(v);
  };

  /** The saved cell as the user would type it: formula with "=", ISO date for date cells, raw number, or text */
  const originalRaw = useCallback((addr: string): string => {
    const cell = ws?.[addr];
    if (!cell) return "";
    if (cell.f) return `=${cell.f}`;
    if (cell.t === "b") return cell.v ? "TRUE" : "FALSE";
    if (cell.t === "n" && cell.z && XLSX?.SSF?.is_date(cell.z)) {
      const d = XLSX.SSF.parse_date_code(cell.v);
      if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
    if (cell.t === "e") return cell.w ?? "";
    if (cell.t === "z") return "";
    return cell.v == null ? "" : String(cell.v);
  }, [ws, XLSX]);

  /** What the formula bar and in-cell editor show: the unsaved edit if any, else the saved cell */
  const rawOf = useCallback((r: number, c: number): string => {
    const addr = addrOf(r, c);
    const k = keyOf(activeSheet, addr);
    return edits.has(k) ? edits.get(k)! : originalRaw(addr);
  }, [addrOf, activeSheet, edits, originalRaw]);

  const displayOf = (r: number, c: number): { text: string; edited: boolean; num: boolean } => {
    const addr = addrOf(r, c);
    const k = keyOf(activeSheet, addr);
    const cell = ws?.[addr];
    const edited = edits.has(k);
    // Formulas (saved or newly typed) and edited cells show the computed value in the cell's number format
    if (edited || cell?.f) {
      if (edited && parseInput(edits.get(k)!).kind === "text") return { text: edits.get(k)!, edited, num: false };
      const v = evaluator?.value(activeSheet, r, c);
      if (v !== undefined) return { text: formatValue(v, cell?.z), edited, num: typeof v === "number" };
      if (edited) return { text: edits.get(k)!, edited, num: false };
    }
    if (!cell || cell.t === "z") return { text: "", edited: false, num: false };
    return { text: cell.w ?? (cell.v == null ? "" : String(cell.v)), edited: false, num: cell.t === "n" };
  };

  const commit = useCallback((r: number, c: number, value: string) => {
    if (!editable) return;
    const addr = addrOf(r, c);
    const k = keyOf(activeSheet, addr);
    const prevEdit = edits.get(k);
    const orig = originalRaw(addr);
    if ((prevEdit ?? orig) === value) return;
    // Typing the original value back removes the edit
    const next = new Map(edits);
    if (value === orig) next.delete(k); else next.set(k, value);
    setUndo((u) => [...u, { key: k, prev: prevEdit }]);
    setEdits(next);
    setMessage(null);
  }, [editable, addrOf, activeSheet, edits, originalRaw]);

  const startEdit = (initial?: string) => {
    if (!editable) return;
    // The in-cell input mounts with autoFocus in this same (synchronous) render, so the next keystrokes land in it
    setEditing(initial ?? rawOf(sel.r, sel.c));
  };
  const finishEdit = (move?: { dr: number; dc: number }) => {
    if (editing !== null) commit(sel.r, sel.c, editing);
    setEditing(null);
    if (move) moveSel(move.dr, move.dc);
    setTimeout(() => gridRef.current?.focus(), 0);
  };

  const moveSel = (dr: number, dc: number) => {
    if (!grid) return;
    const ri = grid.rows.findIndex((x) => x.r === sel.r);
    const ci = grid.cols.findIndex((x) => x.c === sel.c);
    const nr = grid.rows[Math.max(0, Math.min(grid.rows.length - 1, (ri < 0 ? 0 : ri) + dr))]?.r ?? 0;
    const nc = grid.cols[Math.max(0, Math.min(grid.cols.length - 1, (ci < 0 ? 0 : ci) + dc))]?.c ?? 0;
    setSel({ r: nr, c: nc });
    requestAnimationFrame(() => {
      document.getElementById(`xl-cell-${nr}-${nc}`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  };

  const undoLast = () => {
    const last = undo[undo.length - 1];
    if (!last) return;
    const next = new Map(edits);
    if (last.prev === undefined) next.delete(last.key); else next.set(last.key, last.prev);
    setEdits(next);
    setUndo(undo.slice(0, -1));
  };

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    // Keep the viewer's own shortcuts (arrows switch file, F = full screen, Esc = close) out of the grid
    e.stopPropagation();
    if (editing !== null) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); undoLast(); return; }
    if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); void save(); return; }
    if (mod) return;
    const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1], Tab: [0, e.shiftKey ? -1 : 1] };
    if (moves[e.key]) { e.preventDefault(); moveSel(...moves[e.key]); return; }
    if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); startEdit(); return; }
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); commit(sel.r, sel.c, ""); return; }
    if (e.key.length === 1 && editable) { e.preventDefault(); startEdit(e.key); }
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") { e.preventDefault(); finishEdit({ dr: e.shiftKey ? -1 : 1, dc: 0 }); }
    else if (e.key === "Tab") { e.preventDefault(); finishEdit({ dr: 0, dc: e.shiftKey ? -1 : 1 }); }
    else if (e.key === "Escape") { e.preventDefault(); setEditing(null); setTimeout(() => gridRef.current?.focus(), 0); }
  };

  const changedSheets = useMemo(
    () => Array.from(new Set(Array.from(edits.keys()).map((k) => k.split("\u0000")[0]))),
    [edits],
  );

  async function save() {
    if (!buffer || !dirty || saving) return;
    const list: CellEdit[] = Array.from(edits.entries()).map(([k, input]) => {
      const [sheet, address] = k.split("\u0000");
      return { sheet, address, input };
    });
    if (!window.confirm(`Save ${list.length} changed cell${list.length === 1 ? "" : "s"} in ${changedSheets.join(", ")}?\n\nThe current file is kept as a previous version, so you can restore it later.`)) return;
    setSaving(true);
    setMessage(null);
    try {
      const bytes = await patchXlsx(buffer, list);
      const dto = await documentService.replaceContent(doc.id, bytes, doc.originalFileName, doc.contentType);
      const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      setBuffer(ab);
      setEdits(new Map());
      setUndo([]);
      parse(XLSX, ab, activeSheet);
      onContentChanged(bytes, dto);
      setSavedCount((n) => n + 1);
      setMessage({ kind: "ok", text: "Saved. The previous file is kept under Versions. Pivot tables refresh when the file is opened in Excel." });
    } catch (e: any) {
      if (e instanceof XlsxPatchError) setMessage({ kind: "error", text: e.message, cells: e.cells });
      else setMessage({ kind: "error", text: e?.response?.data?.error || e.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  const discard = () => {
    if (!dirty || !window.confirm("Discard all unsaved changes?")) return;
    setEdits(new Map());
    setUndo([]);
    setMessage(null);
  };

  if (loadError) return <div className="p-6 text-sm text-red-600">Failed to open spreadsheet: {loadError}</div>;
  if (!wb || !grid || !ws) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm justify-center py-12">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-arcadia-600" />
        Opening spreadsheet...
      </div>
    );
  }

  const selAddr = addrOf(sel.r, sel.c);
  const sheetTabs = (wb.SheetNames as string[]).map((name, i) => ({ name, hidden: wb.Workbook?.Sheets?.[i]?.Hidden ?? 0 })).filter((s) => s.hidden !== 2);
  const editedCount = (sheet: string) => Array.from(edits.keys()).filter((k) => k.startsWith(`${sheet}\u0000`)).length;

  return (
    <div className={`w-full flex flex-col bg-white ${fullscreen ? "h-full" : "h-[70vh] rounded-lg border border-gray-200"}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
        <span className={`text-xs px-2 py-1 rounded font-medium ${editable ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
          {editable ? "Editing enabled" : isXlsx ? "View only" : "View only (.xls files can't be edited — save as .xlsx)"}
        </span>
        {dirty && <span className="text-xs text-amber-700 font-medium">{edits.size} unsaved change{edits.size === 1 ? "" : "s"}</span>}
        <div className="flex-1" />
        {editable && (
          <>
            <button onClick={undoLast} disabled={!undo.length} className="px-3 py-1.5 text-xs rounded-md bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-40" title="Undo (Ctrl/⌘+Z)">Undo</button>
            <button onClick={discard} disabled={!dirty} className="px-3 py-1.5 text-xs rounded-md bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-40">Discard</button>
            <button onClick={() => void save()} disabled={!dirty || saving} className="px-4 py-1.5 text-xs rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-40" title="Save (Ctrl/⌘+S)">
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        )}
        <button onClick={() => setShowVersions((v) => !v)} className="px-3 py-1.5 text-xs rounded-md bg-white border border-gray-300 hover:bg-gray-100">
          Versions
        </button>
      </div>

      {message && (
        <div className={`px-3 py-2 text-xs border-b ${message.kind === "ok" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {message.text}
          {message.cells && message.cells.length > 0 && <span className="font-mono"> ({message.cells.join(", ")})</span>}
        </div>
      )}

      {/* Formula bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 text-sm">
        <span className="w-16 text-center font-mono text-xs bg-gray-100 rounded px-1 py-1 text-gray-700">{selAddr}</span>
        <span className="text-gray-400 italic text-xs">fx</span>
        <input
          className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded font-mono disabled:bg-white disabled:text-gray-700"
          value={editing ?? rawOf(sel.r, sel.c)}
          disabled={!editable}
          onFocus={() => { if (editing === null) setEditing(rawOf(sel.r, sel.c)); }}
          onChange={(e) => setEditing(e.target.value)}
          onKeyDown={onInputKeyDown}
          onBlur={() => { if (editing !== null) finishEdit(); }}
        />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Grid */}
        <div ref={gridRef} tabIndex={0} onKeyDown={onGridKeyDown} className="flex-1 overflow-auto outline-none relative text-[13px]" style={{ fontFamily: "Calibri, Arial, sans-serif" }}>
          <table className="border-collapse" style={{ tableLayout: "fixed", width: ROW_HEADER_W + grid.cols.reduce((s, c) => s + c.w, 0) }}>
            <colgroup>
              <col style={{ width: ROW_HEADER_W }} />
              {grid.cols.map((c) => <col key={c.c} style={{ width: c.w }} />)}
            </colgroup>
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-30 bg-gray-100 border border-gray-300" />
                {grid.cols.map((c) => (
                  <th key={c.c} className={`sticky top-0 z-20 border border-gray-300 text-[11px] font-medium ${c.c === sel.c ? "bg-green-100 text-green-900" : "bg-gray-100 text-gray-600"}`}>
                    {XLSX.utils.encode_col(c.c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.rows.map((row) => (
                <tr key={row.r} style={{ height: row.h }}>
                  <th className={`sticky left-0 z-10 border border-gray-300 text-[11px] font-medium ${row.r === sel.r ? "bg-green-100 text-green-900" : "bg-gray-100 text-gray-600"}`}>{row.r + 1}</th>
                  {grid.cols.map((col) => {
                    const pos = `${row.r}:${col.c}`;
                    if (grid.covered.has(pos)) return null;
                    const sp = grid.span.get(pos);
                    const isSel = row.r === sel.r && col.c === sel.c;
                    const d = displayOf(row.r, col.c);
                    const cell = ws[addrOf(row.r, col.c)];
                    const fill = cell?.s?.fgColor?.rgb && cell?.s?.patternType === "solid" ? `#${String(cell.s.fgColor.rgb).slice(-6)}` : undefined;
                    return (
                      <td
                        key={col.c}
                        id={`xl-cell-${row.r}-${col.c}`}
                        rowSpan={sp?.rs}
                        colSpan={sp?.cs}
                        onMouseDown={() => { if (editing !== null) finishEdit(); setSel({ r: row.r, c: col.c }); }}
                        onDoubleClick={() => startEdit()}
                        className={`relative border border-gray-200 px-1.5 overflow-hidden whitespace-nowrap text-ellipsis ${isSel ? "outline outline-2 outline-green-600 -outline-offset-1 z-[5]" : ""}`}
                        style={{ background: d.edited ? "#FEF3C7" : fill, textAlign: d.num ? "right" : "left", maxWidth: 0 }}
                        title={d.edited ? `Unsaved: ${d.text}` : d.text.length > 20 ? d.text : undefined}
                      >
                        {isSel && editing !== null ? (
                          <input
                            ref={inputRef}
                            autoFocus
                            onFocus={(e) => { const n = e.target.value.length; e.target.setSelectionRange(n, n); }}
                            className="absolute inset-0 w-full h-full px-1.5 text-[13px] bg-white outline-none border-2 border-green-600"
                            value={editing}
                            onChange={(e) => setEditing(e.target.value)}
                            onKeyDown={onInputKeyDown}
                            onBlur={() => finishEdit()}
                          />
                        ) : (
                          <span>{d.text}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {grid.truncated && (
            <p className="p-2 text-xs text-amber-700">Showing the first {MAX_RENDER_ROWS.toLocaleString()} rows. Download the file to work with the rest.</p>
          )}
        </div>

        {/* Versions panel */}
        {showVersions && (
          <DocumentVersionsPanel
            doc={doc}
            canDownload={canDownload}
            canRestore={editable}
            dirty={dirty}
            refreshKey={savedCount}
            onClose={() => setShowVersions(false)}
            onMessage={setMessage}
            onRestored={(bytes, dto) => {
              const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
              setBuffer(ab);
              parse(XLSX, ab, activeSheet);
              onContentChanged(bytes, dto);
            }}
          />
        )}
      </div>

      {/* Sheet tabs */}
      <div className="flex gap-1 px-2 py-1.5 border-t border-gray-200 bg-gray-50 overflow-x-auto flex-shrink-0">
        {sheetTabs.map((s) => {
          const n = editedCount(s.name);
          return (
            <button
              key={s.name}
              onClick={() => { if (editing !== null) finishEdit(); setActiveSheet(s.name); setSel({ r: 0, c: 0 }); }}
              className={`px-3 py-1 text-xs rounded-md whitespace-nowrap border transition ${s.name === activeSheet ? "bg-white border-green-600 text-green-800 font-semibold shadow-sm" : "border-transparent text-gray-600 hover:bg-gray-200"} ${s.hidden ? "italic opacity-60" : ""}`}
              title={s.hidden ? "Hidden sheet" : undefined}
            >
              {s.name}{n > 0 && <span className="ml-1 text-amber-700">●{n}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
