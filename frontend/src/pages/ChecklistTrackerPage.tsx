import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { projectService, type ProjectDto } from "../services/projectService";
import { authService } from "../services/authService";
import ChecklistFileViewer from "../components/ChecklistFileViewer";
import { downloadXlsx } from "../utils/sheetjs";
import {
  checklistService,
  type ChecklistDocumentDto,
  type ChecklistFolderDto,
  type ChecklistItemDto,
  type ChecklistMailConfigDto,
  type ChecklistPerms,
  type ChecklistStatus,
  type ChecklistSummary,
  type TrackerType,
} from "../services/checklistService";

/* ─── Helpers (same look as Project Documents) ─── */
const STATUS_META: Record<ChecklistStatus, { label: string; pill: string; dot: string }> = {
  NOT_STARTED: { label: "Not started", pill: "bg-gray-100 text-gray-700 border-gray-300", dot: "bg-gray-300" },
  IN_PROGRESS: { label: "In progress", pill: "bg-amber-100 text-amber-900 border-amber-300", dot: "bg-amber-400" },
  COMPLETED: { label: "Completed", pill: "bg-green-100 text-green-800 border-green-300", dot: "bg-green-500" },
  NOT_APPLICABLE: { label: "Not applicable", pill: "bg-slate-100 text-slate-500 border-slate-300", dot: "bg-slate-300" },
};
const todayIST = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const fmtDate = (d?: string | null) =>
  d ? new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const fmtSize = (n: number) => (n === 0 ? "0 KB" : n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const fileIcon = (type: string, name = "") => {
  const n = name.toLowerCase();
  if (type === "application/pdf" || n.endsWith(".pdf")) return "\u{1F4D5}";
  if (type.startsWith("image/")) return "\u{1F5BC}️";
  if (type.includes("spreadsheet") || type.includes("excel") || /\.(xlsx|xls|csv)$/.test(n)) return "\u{1F4CA}";
  if (type.includes("word") || /\.docx?$/.test(n)) return "\u{1F4DD}";
  if (type.includes("presentation") || type.includes("powerpoint")) return "\u{1F4FD}️";
  if (type.startsWith("video/")) return "\u{1F3AC}";
  return "\u{1F4C4}";
};
const typeLabel = (d: ChecklistDocumentDto) => (d.fileName.includes(".") ? d.fileName.split(".").pop()!.toUpperCase() : d.contentType.split("/").pop()?.toUpperCase() || "FILE");
const MAX_FILE = 2 * 1024 * 1024 * 1024;

interface QueueItem { id: number; file: File; status: "pending" | "uploading" | "done" | "error" | "cancelled"; progress: number; loaded: number; error?: string }

/**
 * Sales Preparation Data / RERA Documentation — laid out like Project Documents:
 * project root → section folders → checklist-item folders, each with status, owner, target date and files.
 */
export default function ChecklistTrackerPage({ tracker, title }: { tracker: TrackerType; title: string }) {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [project, setProject] = useState("");
  const [perms, setPerms] = useState<ChecklistPerms | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState<ChecklistItemDto[]>([]);
  const [summary, setSummary] = useState<ChecklistSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Navigation (like folders): root → section → item
  const [section, setSection] = useState<string | null>(null);
  const [itemId, setItemId] = useState<number | null>(null);
  const [folderId, setFolderId] = useState<number | null>(null); // sub-folder inside the item (null = item's own folder)
  const [renaming, setRenaming] = useState<{ id: number; name: string } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [extraSections, setExtraSections] = useState<string[]>([]); // new, still-empty sections
  const [showFolderPanel, setShowFolderPanel] = useState(false);
  const [newFolder, setNewFolder] = useState<{ open: boolean; name: string }>({ open: false, name: "" });
  const [search, setSearch] = useState("");
  const [showSummary, setShowSummary] = useState<"" | "items" | "owners">("");

  // Upload queue (same behaviour as Project Documents)
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const queueId = useRef(0);

  const [viewer, setViewer] = useState<{ docs: ChecklistDocumentDto[]; startId: number } | null>(null);
  const [showMail, setShowMail] = useState(false);
  const [mail, setMail] = useState<ChecklistMailConfigDto | null>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3500); };
  const errMsg = (e: any) => e?.response?.data?.error || e?.message || "Something went wrong";

  useEffect(() => {
    authService.getCurrentUser().then((u) => setIsAdmin(u.role?.name === "ADMIN")).catch(() => {});
    checklistService.myPermissions().then((p) => setPerms(p[tracker])).catch(() => setPerms(null));
    projectService.getMyProjects().then((list) => {
      setProjects(list);
      const arcadia = list.find((p) => p.name.toLowerCase().includes("arcadia"));
      setProject((cur) => cur || (arcadia ?? list[0])?.name || "");
    });
  }, [tracker]);

  const load = useCallback(async () => {
    if (!project || !perms?.view) return;
    setLoading(true);
    setError("");
    try {
      const [its, sum] = await Promise.all([checklistService.items(tracker, project), checklistService.summary(tracker, project)]);
      setItems(its);
      setSummary(sum);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [tracker, project, perms?.view]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    setSection(null); setItemId(null); setFolderId(null); setExtraSections([]); setMail(null); setShowMail(false); setQueue([]);
  }, [project]);

  const today = todayIST();
  const edit = !!perms?.editStatus;
  const sections = useMemo(() => {
    const s = Array.from(new Set(items.map((i) => i.section)));
    extraSections.forEach((x) => !s.includes(x) && s.push(x));
    return s;
  }, [items, extraSections]);
  const owners = useMemo(() => Array.from(new Set(items.flatMap((i) => [i.owner, i.technicalOwner]).filter(Boolean) as string[])).sort(), [items]);
  const isOverdue = (i: ChecklistItemDto) => !!i.targetDate && i.targetDate < today && i.status !== "COMPLETED" && i.status !== "NOT_APPLICABLE";
  const sectionStats = (sec: string) => {
    const list = items.filter((i) => i.section === sec && i.status !== "NOT_APPLICABLE");
    return { done: list.filter((i) => i.status === "COMPLETED").length, total: list.length, overdue: list.filter(isOverdue).length, files: list.reduce((n, i) => n + i.documents.length, 0) };
  };
  const item = itemId != null ? items.find((i) => i.id === itemId) ?? null : null;
  const sectionItems = (sec: string) => items.filter((i) => i.section === sec);
  const pid = (f: ChecklistFolderDto) => (f.parentId === "" || f.parentId == null ? null : Number(f.parentId));
  const childFolders = (it: ChecklistItemDto, parent: number | null) => (it.folders || []).filter((f) => pid(f) === parent);
  const folderPath = (it: ChecklistItemDto, id: number | null): ChecklistFolderDto[] => {
    const out: ChecklistFolderDto[] = [];
    for (let cur = id; cur != null; ) {
      const f = (it.folders || []).find((x) => x.id === cur);
      if (!f) break;
      out.unshift(f);
      cur = pid(f);
    }
    return out;
  };
  const countFiles = (it: ChecklistItemDto, fid: number): number => {
    const ids = new Set<number>([fid]);
    let grew = true;
    while (grew) { grew = false; (it.folders || []).forEach((f) => { const p = pid(f); if (p != null && ids.has(p) && !ids.has(f.id)) { ids.add(f.id); grew = true; } }); }
    return it.documents.filter((d) => d.folderId != null && ids.has(d.folderId)).length;
  };

  const openSection = (sec: string | null) => { setSection(sec); setItemId(null); setFolderId(null); setQueue([]); setNewFolder({ open: false, name: "" }); if (sec) setExpanded((e) => new Set(e).add(sec)); };
  const openItem = (i: ChecklistItemDto, fid: number | null = null) => { setSection(i.section); setItemId(i.id); setFolderId(fid); setQueue([]); setRenaming(null); setNewFolder({ open: false, name: "" }); setExpanded((e) => new Set(e).add(i.section)); };

  // ── Item updates ──
  const exportSummary = async () => {
    try {
      await downloadXlsx(`${title} - ${project} - ${today}.xlsx`, "Summary", items.map((i, n) => ({
        "#": n + 1, Section: i.section, Item: i.title, Description: i.details || "", "SPG Owner": i.owner || "",
        "Technical Owner": i.technicalOwner || "", Status: STATUS_META[i.status].label, "Target Date": i.targetDate || "",
        Overdue: isOverdue(i) ? "Yes" : "", "Completed On": i.completedDate || "", Files: i.documents.length, Remarks: i.remarks || "",
      })));
    } catch (e) { setError(errMsg(e)); }
  };
  const update = async (it: ChecklistItemDto, patch: Partial<ChecklistItemDto>) => {
    try {
      const saved = await checklistService.updateItem(tracker, it.id, patch);
      setItems((list) => list.map((i) => (i.id === it.id ? { ...i, ...saved, documents: i.documents } : i)));
      checklistService.summary(tracker, project).then(setSummary).catch(() => {});
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const createFolder = async () => {
    const name = newFolder.name.trim();
    if (!name) return;
    try {
      if (item) {
        const created = await checklistService.createFolder(tracker, item.id, name, folderId);
        await load();
        setExpanded((e) => new Set(e).add(`i${item.id}`));
        if (created?.id) setFolderId(created.id);
        flash(`Folder "${name}" created`);
      } else if (section == null) {
        // New section folder (appears now; it is saved once an item is added to it)
        setExtraSections((s) => (s.includes(name) ? s : [...s, name]));
        openSection(name);
        flash(`Folder "${name}" created — add its first item with + New.`);
      } else {
        const created = await checklistService.createItem(tracker, project, { section, title: name });
        await load();
        if (created?.id) setItemId(created.id);
        flash(`Item "${name}" added`);
      }
      setNewFolder({ open: false, name: "" });
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const deleteItem = async (it: ChecklistItemDto) => {
    if (!window.confirm(`Delete "${it.title}" and its ${it.documents.length} file(s)? This can't be undone.`)) return;
    try {
      await checklistService.deleteItem(tracker, it.id);
      setItemId(null);
      await load();
      flash("Item deleted");
    } catch (e) {
      setError(errMsg(e));
    }
  };

  // ── Files ──
  const addToQueue = (files: FileList | null) => {
    if (!files) return;
    const add = Array.from(files).map((f) => ({
      id: ++queueId.current, file: f, status: f.size > MAX_FILE ? "error" : "pending", progress: 0, loaded: 0,
      error: f.size > MAX_FILE ? "Larger than the 2 GB limit" : undefined,
    }) as QueueItem);
    setQueue((q) => [...q.filter((x) => x.status === "pending" || x.status === "uploading"), ...add]);
  };

  const uploadAll = async () => {
    if (!item) return;
    setUploading(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    for (const q of queue.filter((x) => x.status === "pending")) {
      if (ctrl.signal.aborted) break;
      setQueue((list) => list.map((x) => (x.id === q.id ? { ...x, status: "uploading" } : x)));
      try {
        await checklistService.upload(tracker, item.id, q.file, (pct, loaded) =>
          setQueue((list) => list.map((x) => (x.id === q.id ? { ...x, progress: pct, loaded } : x))), ctrl.signal, folderId);
        setQueue((list) => list.map((x) => (x.id === q.id ? { ...x, status: "done", progress: 100 } : x)));
      } catch (e: any) {
        const cancelled = ctrl.signal.aborted;
        const msg = e?.response?.status === 413 ? "Too large for the server" : errMsg(e);
        setQueue((list) => list.map((x) => (x.id === q.id ? { ...x, status: cancelled ? "cancelled" : "error", error: msg } : x)));
      }
    }
    if (ctrl.signal.aborted) setQueue((list) => list.map((x) => (x.status === "pending" ? { ...x, status: "cancelled" } : x)));
    setUploading(false);
    abortRef.current = null;
    await load();
  };

  const downloadDoc = async (d: ChecklistDocumentDto) => {
    try {
      const b = await checklistService.fetchDocument(tracker, d.id, true);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = d.fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const deleteDoc = async (d: ChecklistDocumentDto) => {
    if (!window.confirm(`Delete "${d.fileName}"? This can't be undone.`)) return;
    try {
      await checklistService.deleteDocument(tracker, d.id);
      setItems((list) => list.map((i) => ({ ...i, documents: i.documents.filter((x) => x.id !== d.id) })));
      flash("File deleted");
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const renameFolder = async () => {
    if (!renaming) return;
    const name = renaming.name.trim();
    setRenaming(null);
    if (!name) return;
    try { await checklistService.renameFolder(tracker, renaming.id, name); await load(); }
    catch (e) { setError(errMsg(e)); }
  };
  const deleteFolder = async (it: ChecklistItemDto, f: ChecklistFolderDto) => {
    const n = countFiles(it, f.id);
    if (!window.confirm(`Delete folder "${f.name}"${n ? ` and the ${n} file(s) inside it` : ""}? This can't be undone.`)) return;
    try {
      await checklistService.deleteFolder(tracker, f.id);
      if (folderId != null && folderPath(it, folderId).some((x) => x.id === f.id)) setFolderId(pid(f));
      await load();
      flash("Folder deleted");
    } catch (e) { setError(errMsg(e)); }
  };

  // ── Email ──
  const openMail = async () => {
    setShowMail((v) => !v);
    if (!mail) checklistService.mailConfig(tracker, project).then(setMail).catch((e) => setError(errMsg(e)));
  };
  const saveMail = async () => {
    if (!mail) return;
    try { setMail(await checklistService.saveMailConfig(tracker, project, mail.recipients, mail.dailyEnabled)); flash("Email settings saved"); }
    catch (e) { setError(errMsg(e)); }
  };
  const previewEmail = async () => {
    try {
      const html = await checklistService.previewEmail(tracker, project);
      const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) { setError(errMsg(e)); }
  };
  const sendNow = async () => {
    try {
      const r = await checklistService.sendSummary(tracker, project);
      flash(r.message);
      if (isAdmin && mail) setMail(await checklistService.mailConfig(tracker, project));
    } catch (e) { setError(errMsg(e)); }
  };

  // ── Search across items and file names ──
  const q = search.trim().toLowerCase();
  const searchResults = q
    ? items.filter((i) => `${i.title} ${i.details || ""} ${i.owner || ""} ${i.technicalOwner || ""} ${i.remarks || ""} ${i.documents.map((d) => d.fileName).join(" ")}`.toLowerCase().includes(q))
    : [];

  if (perms && !perms.view) {
    return <div className="p-8 text-center text-gray-500">You don't have access to {title}. Ask an administrator to grant it under User Access → Checklist Pages.</div>;
  }

  const breadcrumb: { label: string; onClick: () => void }[] = [{ label: project, onClick: () => openSection(null) }];
  if (section) breadcrumb.push({ label: section, onClick: () => openSection(section) });
  if (item) {
    breadcrumb.push({ label: item.title, onClick: () => { setFolderId(null); setQueue([]); } });
    folderPath(item, folderId).forEach((f) => breadcrumb.push({ label: f.name, onClick: () => { setFolderId(f.id); setQueue([]); } }));
  }
  const currentDepth = item ? folderPath(item, folderId).length : 0;
  const canNewFolder = item ? !!perms?.upload && currentDepth < 3 : edit;
  const docsHere = item ? item.documents.filter((d) => (d.folderId ?? null) === folderId) : [];
  const foldersHere = item ? childFolders(item, folderId) : [];

  const statusDot = (s: ChecklistStatus) => <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${STATUS_META[s].dot}`} />;

  return (
    <div className="space-y-4 sm:space-y-5">
      {viewer && perms && (
        <ChecklistFileViewer tracker={tracker} docs={viewer.docs} startId={viewer.startId} canDownload={perms.download} onClose={() => setViewer(null)} />
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-arcadia-800">{title}</h1>
        <div className="flex items-center gap-2">
          {(isAdmin || edit) && project && (
            <button onClick={() => void sendNow()} className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-white border border-gray-300 hover:bg-gray-50">Send summary now</button>
          )}
          {isAdmin && project && (
            <button onClick={() => void openMail()} className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border ${showMail ? "bg-arcadia-600 text-white border-arcadia-600" : "bg-white border-gray-300 hover:bg-gray-50"}`}>Email settings</button>
          )}
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2">{"\u{1F50D}"}</span>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items and file names in this project..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-arcadia-500" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">&times;</button>}
        {q && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-auto">
            <div className="px-4 py-2 text-[11px] text-gray-500 border-b">{searchResults.length} match{searchResults.length === 1 ? "" : "es"}</div>
            {searchResults.map((i) => (
              <button key={i.id} onClick={() => { openItem(i); setSearch(""); }} className="w-full text-left px-4 py-2 hover:bg-arcadia-50 border-b border-gray-50">
                <div className="flex items-center gap-2 text-sm">{statusDot(i.status)}<span className="font-medium text-gray-800">{i.title}</span></div>
                <div className="text-[11px] text-gray-500">{"\u{1F4C1}"} {i.section} · {i.documents.length} file{i.documents.length === 1 ? "" : "s"}{i.owner ? ` · ${i.owner}` : ""}{i.technicalOwner ? ` · ${i.technicalOwner}` : ""}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Project selector ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Select Project</label>
        <select value={project} onChange={(e) => setProject(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500">
          {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
      </div>

      {toast && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{toast}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex justify-between"><span>{error}</span><button onClick={() => setError("")}>&times;</button></div>}

      {/* ── Email settings (admins) ── */}
      {showMail && isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Summary email — {title} · {project}</h2>
          {!mail ? <p className="text-sm text-gray-500">Loading…</p> : (
            <>
              <label className="block text-xs text-gray-600">Send to (comma-separated email IDs)
                <textarea rows={2} value={mail.recipients || ""} onChange={(e) => setMail({ ...mail, recipients: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="name@example.com, other@example.com" />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={mail.dailyEnabled} onChange={(e) => setMail({ ...mail, dailyEnabled: e.target.checked })} />
                Send automatically every day at 11:00 PM (IST)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => void saveMail()} className="px-4 py-1.5 text-sm rounded-lg bg-arcadia-600 text-white hover:bg-arcadia-700">Save</button>
                <button onClick={() => void previewEmail()} className="px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-300 hover:bg-gray-50">Preview email</button>
                <span className="text-xs text-gray-500">Last sent: {fmtDateTime(mail.lastSentAt)}{mail.lastSendResult ? ` — ${mail.lastSendResult}` : ""}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Summary strip ── */}
      {summary && project && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
            {[
              { k: "Completed", v: `${summary.completed}/${summary.total}`, cls: "text-green-700" },
              { k: "In progress", v: summary.inProgress, cls: "text-amber-700" },
              { k: "Not started", v: summary.notStarted, cls: "text-gray-700" },
              { k: "Overdue", v: summary.overdue, cls: summary.overdue ? "text-red-700" : "text-gray-400" },
              { k: "Due in 7 days", v: summary.dueThisWeek, cls: "text-blue-700" },
            ].map((c) => (
              <div key={c.k} className="flex items-baseline gap-1.5"><span className={`text-lg font-bold ${c.cls}`}>{c.v}</span><span className="text-xs text-gray-500">{c.k}</span></div>
            ))}
            <div className="flex items-center gap-2 flex-1 min-w-[160px]">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${summary.percentComplete}%` }} /></div>
              <span className="text-sm font-semibold text-arcadia-700">{summary.percentComplete}%</span>
            </div>
            <div className="flex gap-1">
              {([["items", "Item summary"], ["owners", "By SPG owner"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setShowSummary((v) => (v === k ? "" : k))}
                  className={`text-xs px-2.5 py-1 rounded-lg border ${showSummary === k ? "bg-arcadia-600 text-white border-arcadia-600" : "border-gray-300 text-arcadia-700 hover:bg-gray-50"}`}>{l}</button>
              ))}
            </div>
          </div>
          {showSummary === "items" && (
            <div className="border-t border-gray-100">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs text-gray-500">{items.length} items · click a row to open it</span>
                <button onClick={() => void exportSummary()} className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-50">⬇ Export to Excel</button>
              </div>
              <div className="overflow-auto max-h-[60vh]">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600 sticky top-0"><tr>
                    {["#", "Section", "Item", "Description", "SPG Owner", "Technical Owner", "Status", "Target date", "Completed on", "Files", "Remarks"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 whitespace-nowrap">{h}</th>))}
                  </tr></thead>
                  <tbody>{items.map((i, n) => (
                    <tr key={i.id} onClick={() => openItem(i)} className={`border-t border-gray-100 cursor-pointer hover:bg-arcadia-50 align-top ${isOverdue(i) ? "bg-red-50" : ""}`}>
                      <td className="px-3 py-1.5 text-gray-400">{n + 1}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-gray-600">{i.section}</td>
                      <td className="px-3 py-1.5 font-medium text-gray-800 min-w-[160px]">{i.title}</td>
                      <td className="px-3 py-1.5 text-gray-600 min-w-[220px]">{i.details || ""}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{i.owner || "—"}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{i.technicalOwner || "—"}</td>
                      <td className="px-3 py-1.5"><span className={`whitespace-nowrap border rounded px-1.5 py-0.5 ${STATUS_META[i.status].pill}`}>{STATUS_META[i.status].label}</span></td>
                      <td className={`px-3 py-1.5 whitespace-nowrap ${isOverdue(i) ? "text-red-700 font-semibold" : ""}`}>{fmtDate(i.targetDate)}{isOverdue(i) ? " (overdue)" : ""}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{fmtDate(i.completedDate)}</td>
                      <td className="px-3 py-1.5 text-center">{i.documents.length}</td>
                      <td className="px-3 py-1.5 text-gray-600 min-w-[160px]">{i.remarks || ""}</td>
                    </tr>))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {showSummary === "owners" && (
            <div className="border-t border-gray-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600"><tr>
                  <th className="text-left px-4 py-2">SPG Owner</th><th className="px-2 text-center">Total</th><th className="px-2 text-center">Completed</th>
                  <th className="px-2 text-center">Pending</th><th className="px-2 text-center">Overdue</th><th className="text-left px-4">Next target</th></tr></thead>
                <tbody>{summary.owners.map((o) => (
                  <tr key={o.owner} className="border-t border-gray-100">
                    <td className="px-4 py-1.5 font-medium text-gray-800">{o.owner}</td><td className="text-center">{o.total}</td>
                    <td className="text-center text-green-700">{o.completed}</td><td className="text-center">{o.pending}</td>
                    <td className={`text-center ${o.overdue ? "text-red-700 font-semibold" : "text-gray-400"}`}>{o.overdue || "–"}</td>
                    <td className="px-4">{fmtDate(o.nextTarget)}</td>
                  </tr>))}
                </tbody>
              </table>
              {summary.noTargetDate > 0 && <p className="px-4 py-2 text-xs text-amber-700">{summary.noTargetDate} open item{summary.noTargetDate === 1 ? "" : "s"} without a target date.</p>}
            </div>
          )}
        </div>
      )}

      {project && (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
          {/* ══════ LEFT: Folder tree ══════ */}
          <div className="w-full lg:w-72 lg:flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden self-start">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <button className="text-sm font-semibold text-gray-700 flex items-center gap-2 lg:cursor-default" onClick={() => setShowFolderPanel(!showFolderPanel)}>
                <span className="lg:hidden text-gray-400">{showFolderPanel ? "▾" : "▸"}</span>Folders
              </button>
              {canNewFolder && (
                <button onClick={() => setNewFolder({ open: !newFolder.open, name: "" })} className="text-xs text-arcadia-600 hover:text-arcadia-800 font-medium"
                  title={item ? "New folder here" : section ? "New item folder in this section" : "New section folder"}>+ New</button>
              )}
            </div>
            {newFolder.open && (
              <div className="px-3 py-2 border-b border-gray-100 bg-yellow-50">
                <p className="text-[10px] text-gray-500 mb-1">{item ? `New folder in: ${breadcrumb.map((b) => b.label).join(" / ")}` : section ? `New item in: ${section}` : `New section in: ${project}`}</p>
                <div className="flex gap-1">
                  <input value={newFolder.name} autoFocus onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && void createFolder()} placeholder={item ? "Folder name" : section ? "Item / document name" : "Section name"}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-arcadia-500" />
                  <button onClick={() => void createFolder()} disabled={!newFolder.name.trim()} className="px-2 py-1 text-xs bg-arcadia-600 text-white rounded hover:bg-arcadia-700 disabled:opacity-50">Add</button>
                  <button onClick={() => setNewFolder({ open: false, name: "" })} className="px-2 py-1 text-xs text-gray-500">&times;</button>
                </div>
              </div>
            )}
            <div className={`p-2 max-h-[70vh] overflow-y-auto ${showFolderPanel ? "block" : "hidden lg:block"}`}>
              <div onClick={() => openSection(null)}
                className={`flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer text-sm ${section == null ? "bg-arcadia-100 text-arcadia-800 font-semibold" : "hover:bg-gray-100 text-gray-700"}`}>
                <span className="w-4" /><span>{"\u{1F3E0}"}</span><span className="truncate">{project} (Root)</span>
              </div>
              {sections.map((sec) => {
                const open = expanded.has(sec);
                const st = sectionStats(sec);
                return (
                  <div key={sec}>
                    <div onClick={() => openSection(sec)} style={{ paddingLeft: 24 }}
                      className={`flex items-center gap-1 py-1.5 pr-2 rounded-lg cursor-pointer text-sm ${section === sec && !item ? "bg-arcadia-100 text-arcadia-800 font-semibold" : "hover:bg-gray-100 text-gray-700"}`}>
                      <button onClick={(e) => { e.stopPropagation(); setExpanded((x) => { const n = new Set(x); if (n.has(sec)) n.delete(sec); else n.add(sec); return n; }); }}
                        className="w-4 h-4 text-gray-400 hover:text-gray-700">{open ? "▾" : "▸"}</button>
                      <span>{open ? "\u{1F4C2}" : "\u{1F4C1}"}</span>
                      <span className="truncate flex-1">{sec}</span>
                      <span className="text-[10px] text-gray-400">{st.done}/{st.total}</span>
                    </div>
                    {open && sectionItems(sec).map((i) => {
                      const iOpen = expanded.has(`i${i.id}`);
                      const hasSub = (i.folders || []).length > 0;
                      const renderFolders = (parent: number | null, depth: number): JSX.Element[] =>
                        childFolders(i, parent).flatMap((f) => {
                          const fOpen = expanded.has(`f${f.id}`);
                          const hasKids = childFolders(i, f.id).length > 0;
                          return [
                            <div key={`f${f.id}`} onClick={() => openItem(i, f.id)} style={{ paddingLeft: 44 + depth * 16 }}
                              className={`flex items-center gap-1 py-1 pr-2 rounded-lg cursor-pointer text-[12px] ${itemId === i.id && folderId === f.id ? "bg-arcadia-100 text-arcadia-800 font-semibold" : "hover:bg-gray-100 text-gray-600"}`}>
                              {hasKids ? (
                                <button onClick={(e) => { e.stopPropagation(); setExpanded((x) => { const n = new Set(x); if (n.has(`f${f.id}`)) n.delete(`f${f.id}`); else n.add(`f${f.id}`); return n; }); }}
                                  className="w-4 h-4 text-gray-400 hover:text-gray-700">{fOpen ? "▾" : "▸"}</button>
                              ) : <span className="w-4" />}
                              <span>{fOpen && hasKids ? "\u{1F4C2}" : "\u{1F4C1}"}</span>
                              <span className="truncate flex-1">{f.name}</span>
                              {countFiles(i, f.id) > 0 && <span className="text-[10px] text-gray-400">{countFiles(i, f.id)}</span>}
                            </div>,
                            ...(fOpen ? renderFolders(f.id, depth + 1) : []),
                          ];
                        });
                      return (
                        <div key={i.id}>
                          <div onClick={() => { openItem(i); if (hasSub) setExpanded((x) => new Set(x).add(`i${i.id}`)); }} style={{ paddingLeft: 40 }}
                            className={`flex items-center gap-1 py-1.5 pr-2 rounded-lg cursor-pointer text-[13px] ${itemId === i.id && folderId == null ? "bg-arcadia-100 text-arcadia-800 font-semibold" : "hover:bg-gray-100 text-gray-700"}`}>
                            {hasSub ? (
                              <button onClick={(e) => { e.stopPropagation(); setExpanded((x) => { const n = new Set(x); if (n.has(`i${i.id}`)) n.delete(`i${i.id}`); else n.add(`i${i.id}`); return n; }); }}
                                className="w-4 h-4 text-gray-400 hover:text-gray-700">{iOpen ? "▾" : "▸"}</button>
                            ) : <span className="w-4" />}
                            {statusDot(i.status)}<span>{iOpen && hasSub ? "\u{1F4C2}" : "\u{1F4C1}"}</span>
                            <span className={`truncate flex-1 ${isOverdue(i) ? "text-red-700" : ""}`}>{i.title}</span>
                            {i.documents.length > 0 && <span className="text-[10px] text-gray-400">{i.documents.length}</span>}
                          </div>
                          {iOpen && renderFolders(null, 1)}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {sections.length === 0 && <p className="text-xs text-gray-400 px-2 py-3 text-center">{loading ? "Loading…" : "No folders yet"}</p>}
            </div>
          </div>

          {/* ══════ RIGHT: Main content ══════ */}
          <div className="flex-1 space-y-4 lg:space-y-5 min-w-0">
            <div className="flex items-center gap-1 text-xs sm:text-sm flex-wrap">
              {breadcrumb.map((b, k) => (
                <span key={k} className="flex items-center gap-1">
                  {k > 0 && <span className="text-gray-400">/</span>}
                  <button onClick={b.onClick} className={k === breadcrumb.length - 1 ? "text-arcadia-800 font-semibold" : "text-gray-500 hover:underline hover:text-arcadia-700"}>
                    {k === 0 ? "\u{1F3E0} " : "\u{1F4C1} "}{b.label}
                  </button>
                </span>
              ))}
            </div>

            {/* Root: section folders */}
            {section == null && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
                {sections.map((sec) => {
                  const st = sectionStats(sec);
                  return (
                    <div key={sec} onClick={() => openSection(sec)} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-arcadia-300 hover:shadow-sm cursor-pointer transition">
                      <div className="flex items-start gap-2"><span className="text-2xl leading-none">{"\u{1F4C1}"}</span><span className="text-sm font-medium text-gray-800 line-clamp-2">{sec}</span></div>
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${st.total ? (st.done / st.total) * 100 : 0}%` }} /></div>
                      <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 text-[11px] text-gray-500">
                        <span>{st.done}/{st.total} completed</span>
                        <span>{st.files} file{st.files === 1 ? "" : "s"}</span>
                        {st.overdue > 0 && <span className="text-red-600 font-semibold">{st.overdue} overdue</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Section: item folders */}
            {section != null && !item && (
              sectionItems(section).length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 text-center py-10">
                  <div className="text-5xl text-gray-300 mb-2">{"\u{1F4C2}"}</div>
                  <p className="text-sm text-gray-500">No items in this folder yet.</p>
                  {edit && <p className="text-xs text-gray-400 mt-1">Use + New in the Folders panel to add one.</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
                  {sectionItems(section).map((i) => (
                    <div key={i.id} onClick={() => openItem(i)}
                      className={`bg-white border rounded-lg p-3 hover:border-arcadia-300 hover:shadow-sm cursor-pointer transition ${isOverdue(i) ? "border-red-300" : "border-gray-200"}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-2xl">{"\u{1F4C1}"}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-800 line-clamp-2">{i.title}</div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className={`text-[10px] font-medium border rounded px-1.5 py-0.5 ${STATUS_META[i.status].pill}`}>{STATUS_META[i.status].label}</span>
                            <span className="text-[11px] text-gray-500">{i.documents.length} file{i.documents.length === 1 ? "" : "s"}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1">
                            SPG: {i.owner || "—"} · Tech: {i.technicalOwner || "—"} · <span className={isOverdue(i) ? "text-red-600 font-semibold" : ""}>{i.targetDate ? `Target ${fmtDate(i.targetDate)}${isOverdue(i) ? " (overdue)" : ""}` : "No target date"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Item: details + upload + documents */}
            {item && (
              <>
                {folderId != null && (() => {
                  const f = (item.folders || []).find((x) => x.id === folderId);
                  if (!f) return null;
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-2xl">{"\u{1F4C2}"}</span>
                        <div className="min-w-0 flex-1">
                          {renaming?.id === f.id ? (
                            <input value={renaming.name} autoFocus onChange={(e) => setRenaming({ id: f.id, name: e.target.value })}
                              onKeyDown={(e) => { if (e.key === "Enter") void renameFolder(); if (e.key === "Escape") setRenaming(null); }}
                              onBlur={() => void renameFolder()} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                          ) : <div className="text-sm sm:text-base font-semibold text-gray-800 truncate">{f.name}</div>}
                          <div className="text-[11px] text-gray-500">Folder in {item.title} · {countFiles(item, f.id)} file{countFiles(item, f.id) === 1 ? "" : "s"}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {perms?.upload && <button onClick={() => setRenaming({ id: f.id, name: f.name })} className="text-xs text-gray-600 hover:text-arcadia-700 px-2 py-1 rounded hover:bg-gray-100">Rename</button>}
                        {perms?.delete && <button onClick={() => void deleteFolder(item, f)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">Delete folder</button>}
                      </div>
                    </div>
                  );
                })()}
                {folderId == null && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-800">{item.title}</h2>
                      {item.details && <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{item.details}</p>}
                    </div>
                    {edit && perms?.delete && (
                      <button onClick={() => void deleteItem(item)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 flex-shrink-0">Delete item</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-4 text-sm">
                    <label className="text-xs text-gray-600">Status
                      {edit ? (
                        <select value={item.status} onChange={(e) => void update(item, { status: e.target.value as ChecklistStatus })}
                          className={`mt-1 w-full border rounded-lg px-2 py-1.5 text-sm font-medium ${STATUS_META[item.status].pill}`}>
                          {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                        </select>
                      ) : <div className={`mt-1 inline-block border rounded px-2 py-1 text-sm ${STATUS_META[item.status].pill}`}>{STATUS_META[item.status].label}</div>}
                    </label>
                    {([["owner", "SPG Owner", "Assign SPG owner"], ["technicalOwner", "Technical Owner", "Assign technical owner"]] as const).map(([field, label, ph]) => (
                      <label key={field} className="text-xs text-gray-600">{label}
                        {edit ? (
                          <input key={`${field}${item.id}`} defaultValue={item[field] || ""} list="checklist-owners" placeholder={ph}
                            onBlur={(e) => e.target.value.trim() !== (item[field] || "") && void update(item, { [field]: e.target.value.trim() })}
                            className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                        ) : <div className="mt-1 text-sm text-gray-800">{item[field] || "—"}</div>}
                      </label>
                    ))}
                    <datalist id="checklist-owners">{owners.map((o) => <option key={o} value={o} />)}</datalist>
                    <label className="text-xs text-gray-600">Target date
                      {edit ? (
                        <input type="date" key={`t${item.id}-${item.targetDate}`} defaultValue={item.targetDate || ""}
                          onChange={(e) => e.target.value !== (item.targetDate || "") && void update(item, { targetDate: e.target.value || null })}
                          className={`mt-1 w-full border rounded-lg px-2 py-1.5 text-sm ${isOverdue(item) ? "border-red-400 text-red-700" : "border-gray-300"}`} />
                      ) : <div className={`mt-1 text-sm ${isOverdue(item) ? "text-red-700 font-semibold" : "text-gray-800"}`}>{fmtDate(item.targetDate)}</div>}
                      {isOverdue(item) && <span className="text-[11px] text-red-700 font-semibold">Overdue</span>}
                    </label>
                    <div className="text-xs text-gray-600">Completed on<div className="mt-1 text-sm text-gray-800 py-1.5">{fmtDate(item.completedDate)}</div></div>
                  </div>
                  <label className="block text-xs text-gray-600 mt-3">Remarks
                    {edit ? (
                      <textarea key={`r${item.id}`} rows={2} defaultValue={item.remarks || ""} placeholder="Add remarks"
                        onBlur={(e) => e.target.value.trim() !== (item.remarks || "") && void update(item, { remarks: e.target.value.trim() })}
                        className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                    ) : <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{item.remarks || "—"}</div>}
                  </label>
                  {item.updatedBy && <p className="text-[11px] text-gray-400 mt-2">Last updated {fmtDateTime(item.updatedAt)} · {item.updatedBy}</p>}
                </div>
                )}

                {/* Sub-folders here (like Project Documents) */}
                {foldersHere.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                    {foldersHere.map((f) => (
                      <div key={f.id} onClick={() => { if (!renaming) { setFolderId(f.id); setQueue([]); setExpanded((x) => new Set(x).add(`i${item.id}`)); } }}
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:border-arcadia-300 hover:shadow-sm cursor-pointer transition group">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{"\u{1F4C1}"}</span>
                          {renaming?.id === f.id ? (
                            <input value={renaming.name} autoFocus onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setRenaming({ id: f.id, name: e.target.value })}
                              onKeyDown={(e) => { if (e.key === "Enter") void renameFolder(); if (e.key === "Escape") setRenaming(null); }}
                              onBlur={() => void renameFolder()}
                              className="flex-1 min-w-0 border border-gray-300 rounded px-1 py-0.5 text-sm focus:ring-1 focus:ring-arcadia-500" />
                          ) : <span className="text-sm font-medium text-gray-700 truncate flex-1">{f.name}</span>}
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500">{countFiles(item, f.id)} file{countFiles(item, f.id) === 1 ? "" : "s"}</div>
                        {renaming?.id !== f.id && (perms?.upload || perms?.delete) && (
                          <div className="mt-2 flex gap-3 sm:opacity-0 sm:group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
                            {perms?.upload && <button onClick={() => setRenaming({ id: f.id, name: f.name })} className="text-[11px] text-gray-500 hover:text-arcadia-600">Rename</button>}
                            {perms?.delete && <button onClick={() => void deleteFolder(item, f)} className="text-[11px] text-gray-500 hover:text-red-600">Delete</button>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Documents */}
                {perms?.upload && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-5 space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-800">Upload Documents</h2>
                      <span className="text-[10px] sm:text-xs text-gray-400 truncate">to: {breadcrumb.map((b) => b.label).join(" / ")}</span>
                    </div>
                    <div>
                      <input type="file" multiple disabled={uploading}
                        onChange={(e) => { addToQueue(e.target.files); e.target.value = ""; }}
                        className="w-full text-xs sm:text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-arcadia-50 file:text-arcadia-700 hover:file:bg-arcadia-100 cursor-pointer disabled:opacity-50" />
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Any file type — select several at once (max 2 GB each).</p>
                    </div>
                    {queue.length > 0 && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                          <p className="text-xs font-semibold text-gray-600">{queue.length} file{queue.length > 1 ? "s" : ""} ({fmtSize(queue.reduce((s, f) => s + f.file.size, 0))})</p>
                          {!uploading && <button onClick={() => setQueue([])} className="text-xs text-gray-400 hover:text-red-500">Clear All</button>}
                        </div>
                        <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                          {queue.map((f) => (
                            <div key={f.id} className="px-4 py-2.5 space-y-1">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{fileIcon(f.file.type, f.file.name)}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-700 truncate">{f.file.name}</p>
                                  <p className="text-xs text-gray-400">{fmtSize(f.file.size)}</p>
                                </div>
                                {f.status === "done" && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Done</span>}
                                {f.status === "error" && <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded" title={f.error}>Failed{f.error ? `: ${f.error}` : ""}</span>}
                                {f.status === "cancelled" && <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Cancelled</span>}
                                {f.status === "pending" && !uploading && <button onClick={() => setQueue((q2) => q2.filter((x) => x.id !== f.id))} className="text-gray-400 hover:text-red-500 text-lg leading-none">&times;</button>}
                              </div>
                              {f.status === "uploading" && (
                                <div className="space-y-1">
                                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div className="bg-arcadia-600 h-full rounded-full transition-all duration-300 flex items-center justify-center" style={{ width: `${f.progress}%` }}>
                                      {f.progress > 15 && <span className="text-[9px] font-semibold text-white leading-none">{f.progress}%</span>}
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-gray-500">{f.progress >= 100 ? "Saving to server…" : `Uploading: ${fmtSize(f.loaded)} / ${fmtSize(f.file.size)}`}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      {!uploading ? (
                        <button onClick={() => void uploadAll()} disabled={!queue.some((f) => f.status === "pending")}
                          className="bg-arcadia-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-arcadia-700 disabled:opacity-50">
                          Upload {queue.filter((f) => f.status === "pending").length > 1 ? `All (${queue.filter((f) => f.status === "pending").length} files)` : ""}
                        </button>
                      ) : (
                        <button onClick={() => abortRef.current?.abort()} className="px-5 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg">Cancel All</button>
                      )}
                    </div>
                  </div>
                )}

                {/* Documents */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-3 sm:px-5 py-3 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-sm font-semibold text-gray-700">Documents ({docsHere.length}){foldersHere.length > 0 && <span className="font-normal text-gray-400"> · open a folder above to see its files</span>}</h2>
                  </div>
                  {docsHere.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="text-5xl text-gray-300 mb-3">{"\u{1F4C2}"}</div>
                      <p className="text-gray-500 text-sm">No documents in this folder yet.</p>
                      {perms?.upload && <p className="text-sm text-gray-400 mt-1">Upload files to get started{currentDepth < 3 ? ", or use + New to create a folder" : ""}.</p>}
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-[60vh]">
                      <table className="w-full text-sm min-w-[720px]">
                        <thead className="bg-gray-50 border-b sticky top-0 z-10">
                          <tr>
                            <th className="text-left px-4 py-3 font-semibold text-gray-700">#</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-700">File Name</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-700">Type</th>
                            <th className="text-right px-4 py-3 font-semibold text-gray-700">Size</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-700">Uploaded By</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                            <th className="text-center px-4 py-3 font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {docsHere.map((d, k) => (
                            <tr key={d.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setViewer({ docs: docsHere, startId: d.id })}>
                              <td className="px-4 py-3 text-gray-400">{k + 1}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{fileIcon(d.contentType, d.fileName)}</span>
                                  <p className="font-medium text-arcadia-700 truncate max-w-[260px]" title={d.fileName}>{d.fileName}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-500">{typeLabel(d)}</td>
                              <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">{fmtSize(d.fileSize)}</td>
                              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{d.uploadedBy}</td>
                              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDateTime(d.uploadedAt)}</td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => setViewer({ docs: docsHere, startId: d.id })} className="text-xs text-arcadia-600 hover:text-arcadia-800 font-medium px-2 py-1 rounded hover:bg-arcadia-50">View</button>
                                  {perms?.download && <button onClick={() => void downloadDoc(d)} className="text-xs text-gray-600 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100">Download</button>}
                                  {perms?.delete && <button onClick={() => void deleteDoc(d)} className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50">Delete</button>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
