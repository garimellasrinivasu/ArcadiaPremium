import { useRef, useState } from "react";
import type { ChecklistItemDto, ChecklistStatus } from "../services/checklistService";

/* html2canvas from cdnjs, loaded only when an image is saved */
async function loadHtml2Canvas(): Promise<any> {
  const w = window as any;
  if (w.html2canvas) return w.html2canvas;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load the image tool"));
    document.head.appendChild(s);
  });
  return w.html2canvas;
}

const STATUS: Record<ChecklistStatus, { label: string; color: string; bg: string }> = {
  NOT_STARTED: { label: "Not started", color: "#374151", bg: "#f3f4f6" },
  IN_PROGRESS: { label: "In progress", color: "#92400e", bg: "#fef3c7" },
  COMPLETED: { label: "Completed", color: "#166534", bg: "#dcfce7" },
  NOT_APPLICABLE: { label: "Not applicable", color: "#64748b", bg: "#f1f5f9" },
};
const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" });
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
export const UNASSIGNED = "Unassigned";

/** One owner's activities with target dates, laid out to be screenshotted / saved as an image and sent to them. */
export default function OwnerActivitySheet({ owner, items, pageTitle, project, today, includeCompleted }: {
  owner: string; items: ChecklistItemDto[]; pageTitle: string; project: string; today: string; includeCompleted: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"" | "download" | "copy">("");
  const [msg, setMsg] = useState("");

  const mine = items.filter((i) => (i.owner?.trim() || UNASSIGNED) === owner && i.status !== "NOT_APPLICABLE");
  const open = mine.filter((i) => i.status !== "COMPLETED");
  const done = mine.filter((i) => i.status === "COMPLETED");
  const overdue = open.filter((i) => i.targetDate && i.targetDate < today);
  const rank = (i: ChecklistItemDto) => (i.status === "COMPLETED" ? 3 : !i.targetDate ? 2 : i.targetDate < today ? 0 : 1);
  const rows = (includeCompleted ? mine : open).slice().sort((a, b) => rank(a) - rank(b) || (a.targetDate || "").localeCompare(b.targetDate || ""));

  const capture = async () => {
    const h2c = await loadHtml2Canvas();
    return (await h2c(ref.current, { backgroundColor: "#ffffff", scale: 2, useCORS: true })) as HTMLCanvasElement;
  };
  const fileName = `${pageTitle} - ${owner} - ${today}.png`.replace(/[\\/:*?"<>|]/g, "-");

  const download = async () => {
    setBusy("download"); setMsg("");
    try {
      const canvas = await capture();
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e: any) { setMsg(e?.message || "Could not create the image"); }
    setBusy("");
  };
  const copy = async () => {
    setBusy("copy"); setMsg("");
    try {
      // Safari needs the ClipboardItem to be created straight from the click, with a promise for the image
      const blob = capture().then((c) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("No image"))), "image/png")));
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setMsg("Image copied — paste it into WhatsApp or email");
    } catch {
      setMsg("Copy isn't allowed in this browser — use Download image");
    }
    setBusy("");
  };

  const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", background: "#1F4E5F", color: "#fff", fontSize: 12, fontWeight: 600 };
  const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #e5e7eb", fontSize: 12, verticalAlign: "top" };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-semibold text-gray-800 mr-auto">{owner}</span>
        {msg && <span className="text-xs text-gray-600">{msg}</span>}
        <button onClick={() => void copy()} disabled={!!busy} className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50">
          {busy === "copy" ? "Copying…" : "📋 Copy image"}
        </button>
        <button onClick={() => void download()} disabled={!!busy} className="text-xs px-2.5 py-1 rounded-lg bg-arcadia-600 text-white hover:bg-arcadia-700 disabled:opacity-50">
          {busy === "download" ? "Preparing…" : "⬇ Download image"}
        </button>
      </div>
      <div className="overflow-x-auto">
        {/* The part below is what goes into the image — plain inline styles so it renders the same in the picture */}
        <div ref={ref} style={{ background: "#fff", padding: 20, minWidth: 640, fontFamily: "Arial, Helvetica, sans-serif", color: "#111827" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{pageTitle} · {project}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1F4E5F", marginTop: 2 }}>{owner}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Activities and target dates · as on {fmt(today)}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[["Open", open.length, "#1F4E5F"], ["Overdue", overdue.length, overdue.length ? "#C00000" : "#9ca3af"], ["Completed", done.length, "#166534"]].map(([l, v, c]) => (
                <div key={l as string} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", textAlign: "center", minWidth: 64 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: c as string }}>{v as number}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{l as string}</div>
                </div>
              ))}
            </div>
          </div>
          {rows.length === 0 ? (
            <div style={{ marginTop: 16, fontSize: 13, color: "#166534" }}>No open activities. 🎉</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14 }}>
              <thead><tr>
                <th style={{ ...th, width: 28 }}>#</th><th style={th}>Activity</th><th style={th}>Section</th>
                <th style={th}>Status</th><th style={th}>Target date</th><th style={th}>Remarks</th>
              </tr></thead>
              <tbody>
                {rows.map((i, n) => {
                  const late = i.status !== "COMPLETED" && !!i.targetDate && i.targetDate < today;
                  const d = i.targetDate ? daysBetween(today, i.targetDate) : null;
                  const s = STATUS[i.status];
                  return (
                    <tr key={i.id} style={{ background: late ? "#FDECEA" : i.status === "COMPLETED" ? "#f9fafb" : "#fff" }}>
                      <td style={{ ...td, color: "#9ca3af" }}>{n + 1}</td>
                      <td style={td}>
                        <div style={{ fontWeight: 600 }}>{i.title}</div>
                        {i.details && <div style={{ color: "#6b7280", marginTop: 2 }}>{i.details}</div>}
                        {i.technicalOwner && <div style={{ color: "#6b7280", marginTop: 2 }}>Technical: {i.technicalOwner}</div>}
                      </td>
                      <td style={{ ...td, color: "#4b5563", whiteSpace: "nowrap" }}>{i.section}</td>
                      <td style={td}><span style={{ background: s.bg, color: s.color, borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap", fontWeight: 600 }}>{s.label}</span></td>
                      <td style={{ ...td, whiteSpace: "nowrap", color: late ? "#C00000" : "#111827", fontWeight: late ? 700 : 400 }}>
                        {i.status === "COMPLETED" ? (i.completedDate ? `Done ${fmt(i.completedDate)}` : "Done")
                          : i.targetDate ? <>{fmt(i.targetDate)}<div style={{ fontSize: 11, fontWeight: 400, color: late ? "#C00000" : d === 0 ? "#b45309" : "#6b7280" }}>
                              {late ? `${-d!} day${d === -1 ? "" : "s"} overdue` : d === 0 ? "Due today" : `${d} day${d === 1 ? "" : "s"} left`}</div></>
                          : <span style={{ color: "#b45309" }}>Not set</span>}
                      </td>
                      <td style={{ ...td, color: "#4b5563" }}>{i.remarks || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 10 }}>Arcadia Premium · {pageTitle}</div>
        </div>
      </div>
    </div>
  );
}
