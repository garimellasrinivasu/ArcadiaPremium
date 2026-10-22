import { useEffect, useMemo, useState } from "react";
import { villaConstructionService, type PlanReport, type PlanRow, type WorkPlanMailConfig } from "../services/villaConstructionService";
import { downloadXlsx } from "../utils/sheetjs";

type Period = "day" | "week" | "month";

const IST = "Asia/Kolkata";
const todayIST = () => new Date().toLocaleDateString("en-CA", { timeZone: IST });
const addDays = (ymd: string, n: number) => { const d = new Date(`${ymd}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const fmt = (ymd?: string) => ymd ? new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtShort = (ymd: string) => new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", day: "2-digit", month: "short" });

/** First and last day of the day / week (Mon–Sun) / month containing `anchor`. */
function range(period: Period, anchor: string): [string, string] {
  if (period === "day") return [anchor, anchor];
  if (period === "week") {
    const dow = (new Date(`${anchor}T00:00:00Z`).getUTCDay() + 6) % 7; // Mon = 0
    const from = addDays(anchor, -dow);
    return [from, addDays(from, 6)];
  }
  const [y, m] = anchor.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [`${y}-${String(m).padStart(2, "0")}-01`, `${y}-${String(m).padStart(2, "0")}-${last}`];
}
function step(period: Period, anchor: string, dir: 1 | -1): string {
  if (period === "day") return addDays(anchor, dir);
  if (period === "week") return addDays(anchor, 7 * dir);
  const [y, m] = anchor.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + dir, 1));
  return d.toISOString().slice(0, 10);
}
function periodTitle(period: Period, from: string, to: string) {
  if (period === "day") return new Date(`${from}T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", weekday: "long", day: "2-digit", month: "short", year: "numeric" });
  if (period === "week") return `Week ${fmtShort(from)} – ${fmt(to)}`;
  return new Date(`${from}T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", month: "long", year: "numeric" });
}

const STATUS: Record<string, { label: string; cls: string }> = {
  ON_TIME: { label: "Completed on time", cls: "bg-green-100 text-green-800 border-green-300" },
  LATE: { label: "Completed late", cls: "bg-lime-100 text-lime-800 border-lime-300" },
  COMPLETED: { label: "Completed", cls: "bg-green-100 text-green-800 border-green-300" },
  PENDING: { label: "Pending", cls: "bg-gray-100 text-gray-700 border-gray-300" },
  OVERDUE: { label: "Overdue", cls: "bg-red-100 text-red-800 border-red-300" },
};
function extraNote(r: PlanRow) {
  if (r.reason === "NO_PLAN") return "Not in the plan — no planned date";
  if (r.reason === "AHEAD") return `Ahead of plan — planned ${fmt(r.plannedDate)} (${-(r.daysFromPlan ?? 0)} days early)`;
  return `Backlog cleared — was planned ${fmt(r.plannedDate)} (${r.daysFromPlan ?? 0} days late)`;
}

/** Planned vs completed for a day, week or month, with extra (unplanned) work shown separately. */
export default function PlanVsActualView({ projectName, isAdmin }: { projectName: string; isAdmin: boolean }) {
  const [period, setPeriod] = useState<Period>("week");
  const [anchor, setAnchor] = useState(todayIST());
  const [report, setReport] = useState<PlanReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "done" | "notdone">("all");
  const [cluster, setCluster] = useState("");
  const [from, to] = useMemo(() => range(period, anchor), [period, anchor]);

  useEffect(() => {
    setLoading(true); setError("");
    villaConstructionService.planReport(projectName, from, to)
      .then(setReport)
      .catch((e) => setError(e?.response?.data?.error || "Could not load the report"))
      .finally(() => setLoading(false));
  }, [projectName, from, to]);

  const planned = (report?.planned || []).filter((r) => (!cluster || r.cluster === cluster)
    && (filter === "all" || (filter === "done" ? r.done : !r.done)));
  const extra = (report?.extra || []).filter((r) => !cluster || r.cluster === cluster);
  const s = report?.summary;

  const exportExcel = async () => {
    if (!report) return;
    const rows = [
      ...report.planned.map((r) => ({ Type: "Planned", Villa: r.villa, Cluster: r.cluster, Stage: r.stage, Incharge: r.incharge,
        "Planned Date": r.plannedDate || "", "Completed Date": r.completedDate || "", Status: STATUS[r.status || ""]?.label || "",
        Note: [r.status === "OVERDUE" ? `${r.daysOverdue} days overdue` : "", r.daysLate ? `${r.daysLate} days late` : "", r.notUpdated ? "planned date not updated" : ""].filter(Boolean).join("; ") })),
      ...report.extra.map((r) => ({ Type: "Extra (not planned)", Villa: r.villa, Cluster: r.cluster, Stage: r.stage, Incharge: r.incharge,
        "Planned Date": r.plannedDate || "", "Completed Date": r.completedDate || "", Status: "Completed", Note: extraNote(r) })),
    ];
    await downloadXlsx(`Plan vs Actual - ${projectName} - ${from}${from === to ? "" : ` to ${to}`}.xlsx`, "Plan vs Actual", rows);
  };

  return (
    <div className="space-y-3">
      {/* Period picker */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {(["day", "week", "month"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded-md capitalize ${period === p ? "bg-white shadow text-amber-700" : "text-gray-600"}`}>
              {p === "day" ? "Day" : p === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>
        <button onClick={() => setAnchor(step(period, anchor, -1))} className="px-2 py-1 text-sm rounded hover:bg-gray-100" title="Previous">‹</button>
        <span className="text-sm font-semibold text-gray-800 min-w-[180px] text-center">{periodTitle(period, from, to)}</span>
        <button onClick={() => setAnchor(step(period, anchor, 1))} className="px-2 py-1 text-sm rounded hover:bg-gray-100" title="Next">›</button>
        <input type={period === "month" ? "month" : "date"} value={period === "month" ? anchor.slice(0, 7) : anchor}
          onChange={(e) => e.target.value && setAnchor(period === "month" ? `${e.target.value}-01` : e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-1 text-xs" />
        <button onClick={() => setAnchor(todayIST())} className="text-xs text-amber-700 hover:underline">{period === "day" ? "Today" : period === "week" ? "This week" : "This month"}</button>
        <div className="ml-auto flex items-center gap-2">
          <select value={cluster} onChange={(e) => setCluster(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs">
            <option value="">All clusters</option>
            {(report?.byCluster || []).map((c) => <option key={c.cluster} value={c.cluster}>{c.cluster}</option>)}
          </select>
          <button onClick={() => void exportExcel()} disabled={!report} className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50">⬇ Excel</button>
        </div>
      </div>

      {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">{error}</div>}
      {loading && !report && <div className="text-sm text-gray-400 py-10 text-center">Loading report…</div>}

      {report && s && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              ["Planned", s.planned, "text-gray-800 bg-white"],
              ["Completed (of planned)", s.completed, "text-green-700 bg-green-50"],
              ["Pending", s.pending, "text-gray-700 bg-gray-50"],
              ["Overdue", s.overdue, s.overdue ? "text-red-700 bg-red-50" : "text-gray-400 bg-white"],
              ["Extra — not planned", s.extra, "text-purple-700 bg-purple-50"],
              ["Achieved", `${s.percent}%`, "text-amber-700 bg-amber-50"],
            ].map(([l, v, c]) => (
              <div key={l as string} className={`rounded-xl border border-gray-200 p-2.5 text-center ${c}`}>
                <div className="text-xl font-bold">{v as number}</div>
                <div className="text-[11px] text-gray-600">{l as string}</div>
              </div>
            ))}
          </div>
          {(s.late > 0 || s.notUpdated > 0) && (
            <p className="text-xs text-gray-500">
              {s.late > 0 && <>{s.late} of the completed were finished after their planned date. </>}
              {s.notUpdated > 0 && <span className="text-amber-700">{s.notUpdated} planned item{s.notUpdated === 1 ? "" : "s"} use a "not updated" placeholder date.</span>}
            </p>
          )}

          {/* By stage */}
          {report.byPhase.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-600"><tr>
                  <th className="text-left px-3 py-2">Stage</th><th className="px-2 text-center">Planned</th><th className="px-2 text-center">Completed</th>
                  <th className="px-2 text-center">Not completed</th><th className="px-2 text-center">Extra (not planned)</th><th className="text-left px-3 w-1/3">Progress</th>
                </tr></thead>
                <tbody>{report.byPhase.map((p) => {
                  const pct = p.planned ? Math.round((p.completed / p.planned) * 100) : 0;
                  return (
                    <tr key={p.phase} className="border-t border-gray-100">
                      <td className="px-3 py-1.5 font-medium text-gray-800">{p.label}</td>
                      <td className="text-center">{p.planned}</td>
                      <td className="text-center text-green-700">{p.completed}</td>
                      <td className={`text-center ${p.planned - p.completed ? "text-red-700" : "text-gray-400"}`}>{p.planned - p.completed || "–"}</td>
                      <td className={`text-center ${p.extra ? "text-purple-700 font-semibold" : "text-gray-400"}`}>{p.extra || "–"}</td>
                      <td className="px-3">{p.planned > 0 && (
                        <div className="flex items-center gap-2"><div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${pct}%` }} /></div><span className="w-9 text-right">{pct}%</span></div>
                      )}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}

          {/* Planned */}
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mr-auto">Planned for this {period} ({planned.length})</h3>
              {(["all", "done", "notdone"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-xs px-2.5 py-1 rounded-lg border ${filter === f ? "bg-amber-600 text-white border-amber-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                  {f === "all" ? "All" : f === "done" ? "Completed" : "Not completed"}
                </button>
              ))}
            </div>
            {planned.length === 0 ? <p className="px-3 py-6 text-sm text-gray-400 text-center">Nothing planned for this {period}.</p> : (
              <div className="overflow-auto max-h-[55vh]">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600 sticky top-0"><tr>
                    {["Planned date", "Villa", "Cluster", "Stage", "Incharge", "Status", "Completed on", "Note"].map((h) => <th key={h} className="text-left px-3 py-2 whitespace-nowrap">{h}</th>)}
                  </tr></thead>
                  <tbody>{planned.map((r) => (
                    <tr key={`${r.villa}-${r.phase}`} className={`border-t border-gray-100 ${r.status === "OVERDUE" ? "bg-red-50/60" : ""}`}>
                      <td className={`px-3 py-1.5 whitespace-nowrap ${r.notUpdated ? "text-amber-700" : ""}`}>{fmt(r.plannedDate)}</td>
                      <td className="px-3 font-semibold">{r.villa}</td>
                      <td className="px-3">{r.cluster}</td>
                      <td className="px-3 whitespace-nowrap">{r.stage}</td>
                      <td className="px-3 whitespace-nowrap">{r.incharge || "—"}</td>
                      <td className="px-3"><span className={`whitespace-nowrap border rounded px-1.5 py-0.5 ${STATUS[r.status || ""]?.cls}`}>{STATUS[r.status || ""]?.label}</span></td>
                      <td className="px-3 whitespace-nowrap">{r.completedDate ? fmt(r.completedDate) : r.done ? "date not recorded" : "—"}</td>
                      <td className="px-3 text-gray-600">
                        {[r.status === "OVERDUE" ? `${r.daysOverdue} days overdue` : "", r.daysLate ? `${r.daysLate} days late` : "", r.notUpdated ? "planned date not updated" : ""].filter(Boolean).join(" · ")}
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>

          {/* Extra */}
          <div className="bg-white border-2 border-purple-200 rounded-xl">
            <div className="px-3 py-2 border-b border-purple-100 bg-purple-50 rounded-t-xl">
              <h3 className="text-sm font-semibold text-purple-800">Extra work done — not planned for this {period} ({extra.length})</h3>
              <p className="text-[11px] text-purple-700">Completed in this period although its planned date was outside it (ahead of plan or clearing a backlog), or it had no planned date.</p>
            </div>
            {extra.length === 0 ? <p className="px-3 py-4 text-sm text-gray-400 text-center">No extra work in this {period}.</p> : (
              <div className="overflow-auto max-h-[40vh]">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600 sticky top-0"><tr>
                    {["Completed on", "Villa", "Cluster", "Stage", "Incharge", "Message"].map((h) => <th key={h} className="text-left px-3 py-2">{h}</th>)}
                  </tr></thead>
                  <tbody>{extra.map((r) => (
                    <tr key={`${r.villa}-${r.phase}`} className="border-t border-purple-100 bg-purple-50/40">
                      <td className="px-3 py-1.5 whitespace-nowrap">{fmt(r.completedDate)}</td>
                      <td className="px-3 font-semibold">{r.villa}</td>
                      <td className="px-3">{r.cluster}</td>
                      <td className="px-3 whitespace-nowrap">{r.stage}</td>
                      <td className="px-3 whitespace-nowrap">{r.incharge || "—"}</td>
                      <td className="px-3"><span className={`border rounded px-1.5 py-0.5 ${r.reason === "AHEAD" ? "bg-purple-100 text-purple-800 border-purple-300" : r.reason === "BACKLOG" ? "bg-orange-50 text-orange-800 border-orange-300" : "bg-slate-100 text-slate-700 border-slate-300"}`}>{extraNote(r)}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-[11px] text-gray-400">A stage counts as completed on its actual completion date, or else the day it was ticked done here. Stages ticked "Completed" by a schedule import have no completion day and are not counted as work done in any period.</p>
        </>
      )}

      {isAdmin && <PlanMailSettings projectName={projectName} />}
    </div>
  );
}

/** Admin panel for the automatic daily / weekly work-plan emails. */
function PlanMailSettings({ projectName }: { projectName: string }) {
  const [cfg, setCfg] = useState<WorkPlanMailConfig | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => { villaConstructionService.planMailConfig(projectName).then(setCfg).catch(() => {}); }, [projectName]);
  if (!cfg) return null;
  const errOf = (e: any) => e?.response?.data?.error || e?.message || "Failed";
  const save = async () => {
    setBusy("save"); setMsg("");
    try { setCfg(await villaConstructionService.savePlanMailConfig({ ...cfg, projectName })); setMsg("Saved."); } catch (e) { setMsg(errOf(e)); }
    setBusy("");
  };
  const send = async (type: "daily" | "weekly") => {
    setBusy(type); setMsg("");
    try { setMsg(await villaConstructionService.sendPlanMail(projectName, type)); } catch (e) { setMsg(errOf(e)); }
    villaConstructionService.planMailConfig(projectName).then(setCfg).catch(() => {});
    setBusy("");
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
      <h3 className="text-sm font-semibold text-gray-800">Work plan emails</h3>
      <p className="text-xs text-gray-500">Daily (7:00 AM): today's planned work by cluster and incharge, overdue items, and yesterday's planned vs completed.
        Weekly (Monday 7:30 AM): this week's plan and last week's planned vs completed. Save the recipients first.</p>
      <label className="block text-xs text-gray-600">Send to (comma-separated email IDs)
        <textarea rows={2} value={cfg.recipients || ""} onChange={(e) => setCfg({ ...cfg, recipients: e.target.value })}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="name@example.com, site.engineer@example.com" />
      </label>
      <div className="flex flex-wrap gap-4 text-sm text-gray-700">
        <label className="flex items-center gap-2"><input type="checkbox" checked={cfg.dailyEnabled} onChange={(e) => setCfg({ ...cfg, dailyEnabled: e.target.checked })} /> Daily plan at 7:00 AM</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={cfg.weeklyEnabled} onChange={(e) => setCfg({ ...cfg, weeklyEnabled: e.target.checked })} /> Weekly plan on Monday 7:30 AM</label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => void save()} disabled={!!busy} className="px-4 py-1.5 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50">{busy === "save" ? "Saving…" : "Save"}</button>
        <button onClick={() => villaConstructionService.planMailPreview(projectName, "daily").then(setPreview).catch((e) => setMsg(errOf(e)))} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Preview daily</button>
        <button onClick={() => villaConstructionService.planMailPreview(projectName, "weekly").then(setPreview).catch((e) => setMsg(errOf(e)))} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Preview weekly</button>
        <button onClick={() => void send("daily")} disabled={!!busy} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50">{busy === "daily" ? "Sending…" : "Send daily now"}</button>
        <button onClick={() => void send("weekly")} disabled={!!busy} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50">{busy === "weekly" ? "Sending…" : "Send weekly now"}</button>
        {msg && <span className="text-xs text-gray-700">{msg}</span>}
      </div>
      {cfg.lastSentAt && <p className="text-[11px] text-gray-500">Last sent {new Date(cfg.lastSentAt).toLocaleString("en-IN")} — {cfg.lastSendResult}</p>}
      {preview !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b flex justify-between"><span className="font-semibold">Email preview</span><button onClick={() => setPreview(null)} className="text-xl leading-none">&times;</button></div>
            <iframe title="Email preview" srcDoc={preview} className="flex-1 min-h-[70vh] w-full" sandbox="" />
          </div>
        </div>
      )}
    </div>
  );
}
