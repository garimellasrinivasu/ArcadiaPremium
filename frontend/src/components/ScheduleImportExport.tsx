import { useState } from "react";
import { villaConstructionService, type ScheduleImportResult } from "../services/villaConstructionService";
import { CONSTRUCTION_PHASES, ARCADIA_CLUSTERS } from "../pages/MasterPlanPage";
import type { PlotDef } from "../data/kalpavrukshaPlots";
import { downloadXlsx, loadSheetJS } from "../utils/sheetjs";

/** Column headings that map to each stage (as in the cluster schedule sheets and the app's own export). */
const PHASE_ALIASES: Record<string, string[]> = {
  EXCAVATION: ["excavation", "earthwork", "earth work"],
  PCC: ["pcc"],
  FOOTINGS: ["footings", "footing"],
  NECK_COLUMNS: ["neck columns", "neck column"],
  BACK_FILLING_COMPACTION: ["back filling", "backfilling", "back filling & compaction", "back filling and compaction"],
  PLINTH_BEAM: ["plinth beam", "plinth beams"],
  COLUMNS: ["ground floor columns", "ground floor column", "columns"],
  GROUND_FLOOR_SLAB: ["ground floor slab"],
  FIRST_FLOOR_COLUMNS: ["first floor columns", "first floor column"],
  FIRST_FLOOR_SLAB: ["first floor slab"],
  SECOND_FLOOR_COLUMNS: ["second floor columns", "second floor column"],
  SECOND_FLOOR_SLAB: ["second floor slab"],
};
const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/[^a-z&]+/g, " ").trim();
const phaseForHeader = (h: unknown) => {
  const n = norm(h);
  return Object.keys(PHASE_ALIASES).find((k) => PHASE_ALIASES[k].includes(n));
};
const NOT_UPDATED = "(not updated)";
const clusterOf = (villa: number) => {
  const i = ARCADIA_CLUSTERS.findIndex((c) => c.villas.includes(villa));
  return i >= 0 ? `C${i + 1}` : "";
};
const pad = (n: number) => String(n).padStart(2, "0");
const toDmy = (iso: string) => `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}`;

/** Turns one cell into "COMPLETED", "yyyy-MM-dd", or "" (with the original text when it wasn't understood). */
function parseCell(v: unknown, XLSX: any): { value: string; note?: string } {
  if (v === null || v === undefined || v === "") return { value: "" };
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d && d.y > 2000) return { value: `${d.y}-${pad(d.m)}-${pad(d.d)}` };
    return { value: "", note: String(v) };
  }
  const s = String(v).trim();
  if (/^(completed|complete|done)$/i.test(s)) return { value: "COMPLETED" };
  if (s.toLowerCase().includes(NOT_UPDATED)) return { value: "" };
  let m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) return { value: `${m[3]}-${pad(+m[2])}-${pad(+m[1])}` };
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return { value: `${m[1]}-${pad(+m[2])}-${pad(+m[3])}` };
  return { value: "", note: s };
}

/** Export / Import of the villa-wise stage schedule (planned dates and completed stages) as Excel. */
export default function ScheduleImportExport({ projectName, plots, isAdmin, onImported }: {
  projectName: string; plots: PlotDef[]; isAdmin: boolean; onImported: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [imp, setImp] = useState<{
    fileName: string; cells: { villa: number; phase: string; value: string }[]; fileVillas: number; filled: number;
    notes: string[]; unknownVillas: number[]; preview: ScheduleImportResult | null; done: boolean; working: boolean;
  } | null>(null);
  const [fillMissing, setFillMissing] = useState(true);

  const handleExport = async () => {
    setBusy(true); setError("");
    try {
      const all = await villaConstructionService.getAllByProject(projectName);
      const by = new Map(all.map((s) => [`${s.villaNumber}|${s.phase}`, s]));
      const rows = [...plots].sort((a, b) => a.villa - b.villa).map((p) => {
        const r: Record<string, unknown> = { "Villa No": p.villa, Cluster: clusterOf(p.villa) };
        CONSTRUCTION_PHASES.forEach((ph) => {
          const s = by.get(`${p.villa}|${ph.key}`);
          r[ph.label] = s?.activity1Done ? "Completed"
            : s?.plannedTargetDate ? `${toDmy(s.plannedTargetDate)}${s.plannedDateDefaulted ? ` ${NOT_UPDATED}` : ""}` : "";
        });
        return r;
      });
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      await downloadXlsx(`Work Execution Schedule - ${projectName} - ${today}.xlsx`, "Schedule", rows);
    } catch (e: any) {
      setError(e?.message || "Export failed");
    }
    setBusy(false);
  };

  const buildCells = async (file: File, fill: boolean) => {
    const XLSX = await loadSheetJS();
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const cells = new Map<string, string>();
    const notes: string[] = [];
    const fileVillaSet = new Set<number>();
    const known = new Set(plots.map((p) => p.villa));
    const unknown = new Set<number>();
    for (const name of wb.SheetNames) {
      const grid: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: "" });
      let cols: { idx: number; phase: string }[] = [];
      let villaCol = -1;
      for (const row of grid) {
        const vIdx = row.findIndex((c) => /^villa/.test(norm(c)));
        const mapped = row.map((c, idx) => ({ idx, phase: phaseForHeader(c) || "" })).filter((x) => x.phase);
        if (vIdx >= 0 && mapped.length >= 3) { villaCol = vIdx; cols = mapped; continue; } // header row (repeats are fine)
        if (villaCol < 0) continue;
        const villa = Number(String(row[villaCol]).trim());
        if (!Number.isInteger(villa) || villa <= 0) continue;
        if (!known.has(villa)) { unknown.add(villa); continue; }
        fileVillaSet.add(villa);
        for (const c of cols) {
          const { value, note } = parseCell(row[c.idx], XLSX);
          if (note) notes.push(`Villa ${villa} · ${CONSTRUCTION_PHASES.find((p) => p.key === c.phase)?.label}: "${note}" — treated as no date`);
          cells.set(`${villa}|${c.phase}`, value);
        }
      }
    }
    let filled = 0;
    if (fill) {
      for (const p of plots) for (const ph of CONSTRUCTION_PHASES) {
        const k = `${p.villa}|${ph.key}`;
        if (!cells.has(k)) { cells.set(k, ""); filled++; }
      }
    }
    return {
      cells: Array.from(cells, ([k, value]) => { const [v, phase] = k.split("|"); return { villa: Number(v), phase, value }; }),
      fileVillas: fileVillaSet.size, filled, notes, unknownVillas: Array.from(unknown).sort((a, b) => a - b),
    };
  };

  const startImport = async (file: File, fill = fillMissing) => {
    setError("");
    try {
      const b = await buildCells(file, fill);
      if (!b.fileVillas) { setError("No villa rows found. The sheet needs a 'Villa' column and stage columns such as Earthwork, PCC, Footings…"); return; }
      setImp({ fileName: file.name, ...b, preview: null, done: false, working: true });
      const preview = await villaConstructionService.importSchedule(projectName, b.cells, true);
      setImp({ fileName: file.name, ...b, preview, done: false, working: false });
      (window as any).__scheduleFile = file;
    } catch (e: any) {
      setImp(null);
      setError(e?.response?.data?.error || e?.message || "Could not read the file");
    }
  };

  const confirm = async () => {
    if (!imp) return;
    setImp({ ...imp, working: true });
    try {
      const res = await villaConstructionService.importSchedule(projectName, imp.cells, false);
      setImp({ ...imp, preview: res, done: true, working: false });
      onImported();
    } catch (e: any) {
      setImp({ ...imp, working: false });
      setError(e?.response?.data?.error || "Import failed");
    }
  };

  const p = imp?.preview;
  return (
    <>
      <div className="flex items-center gap-2">
        <button onClick={() => void handleExport()} disabled={busy} title="Download every villa's stages as Excel"
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white hover:bg-gray-50 whitespace-nowrap disabled:opacity-50">
          {busy ? "Exporting…" : "⬇ Export schedule"}
        </button>
        {isAdmin && (
          <label title="Import planned dates / completed stages from Excel" className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white hover:bg-gray-50 whitespace-nowrap cursor-pointer">
            ⬆ Import schedule
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void startImport(f); }} />
          </label>
        )}
      </div>
      {error && <div className="w-full text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 flex justify-between gap-2"><span>{error}</span><button onClick={() => setError("")}>&times;</button></div>}

      {imp && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">{imp.done ? "Schedule imported" : "Import schedule — preview"}</h2>
              <button onClick={() => setImp(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3 text-sm">
              <p className="text-gray-600">File <b>{imp.fileName}</b> · {imp.fileVillas} villas found · project <b>{projectName}</b></p>
              {!imp.done && (
                <label className="flex items-start gap-2 text-gray-700">
                  <input type="checkbox" className="mt-0.5" checked={fillMissing} disabled={imp.working}
                    onChange={(e) => { setFillMissing(e.target.checked); const f = (window as any).__scheduleFile; if (f) void startImport(f, e.target.checked); }} />
                  <span>Villas and stages missing from the file get today's date, shown in <span className="px-1 rounded bg-amber-300">amber</span> as "not updated" ({imp.filled} stage{imp.filled === 1 ? "" : "s"})</span>
                </label>
              )}
              {!p ? <p className="text-gray-400">Checking…</p> : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  {[["Marked completed", p.markedDone, "bg-green-50 text-green-800"], ["Planned dates set", p.datesSet, "bg-blue-50 text-blue-800"],
                    ["Not updated (today)", p.defaulted, "bg-amber-50 text-amber-800"], ["Unchanged", p.unchanged, "bg-gray-50 text-gray-600"]].map(([l, v, c]) => (
                    <div key={l as string} className={`rounded-lg p-2 ${c}`}><div className="text-xl font-bold">{v as number}</div><div className="text-[11px]">{l as string}{imp.done ? "" : " (will be)"}</div></div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">"Completed" ticks the stage as done (no completion date). A date becomes the planned target date. Stages already ticked as done here are never un-ticked.</p>
              {imp.unknownVillas.length > 0 && <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded p-2">Skipped villa numbers not in this project: {imp.unknownVillas.join(", ")}</div>}
              {imp.notes.length > 0 && (
                <details className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded p-2" open={imp.notes.length <= 8}>
                  <summary className="cursor-pointer font-medium">{imp.notes.length} cell{imp.notes.length === 1 ? "" : "s"} with text instead of a date</summary>
                  <ul className="mt-1 list-disc pl-4 space-y-0.5">{imp.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
                </details>
              )}
              {p && p.warnings.length > 0 && (
                <details className="text-xs bg-gray-50 border border-gray-200 text-gray-700 rounded p-2">
                  <summary className="cursor-pointer font-medium">{p.warnings.length} stage{p.warnings.length === 1 ? "" : "s"} already done here but dated in the file</summary>
                  <ul className="mt-1 list-disc pl-4 space-y-0.5">{p.warnings.map((n, i) => <li key={i}>{n}</li>)}</ul>
                </details>
              )}
            </div>
            <div className="px-5 py-4 border-t flex justify-end gap-2">
              <button onClick={() => setImp(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">{imp.done ? "Close" : "Cancel"}</button>
              {!imp.done && (
                <button onClick={() => void confirm()} disabled={imp.working || !p || p.markedDone + p.datesSet + p.defaulted === 0}
                  className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">
                  {imp.working ? "Working…" : "Import"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
