import { useState, useEffect } from "react";
import { rateAnalysisService } from "../services/rateAnalysisService";
import type { RateAnalysisDto, CreateRateAnalysisRequest } from "../services/rateAnalysisService";
import api from "../services/api";

// ── Constants ─────────────────────────────────────────────────────────

const STATUS_LIST = ["All", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] as const;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

const CATEGORY_COLORS: Record<string, string> = {
  MATERIAL: "bg-blue-50 text-blue-700",
  LABOR: "bg-amber-50 text-amber-700",
  MACHINERY: "bg-purple-50 text-purple-700",
  OTHER: "bg-gray-50 text-gray-600",
};

const CATEGORIES = ["MATERIAL", "LABOR", "MACHINERY", "OTHER"] as const;

interface ItemRow {
  category: string;
  description: string;
  materialName: string;
  coefficient: number;
  rate: number;
}

const emptyItem: ItemRow = { category: "MATERIAL", description: "", materialName: "", coefficient: 0, rate: 0 };

interface ProjectOption { id: number; name: string }
interface ActivityOption { id: number; name: string }

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Main Page ─────────────────────────────────────────────────────────

export default function RateAnalysisPage() {
  const [records, setRecords] = useState<RateAnalysisDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showReject, setShowReject] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [saving, setSaving] = useState(false);

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [activities, setActivities] = useState<ActivityOption[]>([]);
  const [form, setForm] = useState<{ projectId: number; activityId: number; items: ItemRow[] }>({
    projectId: 0, activityId: 0, items: [{ ...emptyItem }],
  });

  // ── Fetch helpers ───────────────────────────────────────────────────

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = projectFilter
        ? await rateAnalysisService.getByProject(projectFilter)
        : await rateAnalysisService.getAll();
      setRecords(data);
    } catch { setError("Failed to load rate analyses."); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [projectFilter]);

  useEffect(() => {
    api.get("/projects").then(r => setProjects(r.data)).catch(() => {});
    api.get("/activity-masters").then(r => setActivities(r.data)).catch(() => {});
  }, []);

  // ── Filtered list ───────────────────────────────────────────────────

  const filtered = statusFilter === "All" ? records : records.filter(r => r.status === statusFilter);

  // ── Actions ─────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.projectId || !form.activityId || form.items.length === 0) return;
    setSaving(true);
    try {
      const req: CreateRateAnalysisRequest = {
        projectId: form.projectId,
        activityId: form.activityId,
        items: form.items.map(i => ({
          category: i.category,
          description: i.description || undefined,
          materialName: i.materialName || undefined,
          coefficient: i.coefficient,
          rate: i.rate,
        })),
      };
      await rateAnalysisService.create(req);
      setShowCreate(false);
      setForm({ projectId: 0, activityId: 0, items: [{ ...emptyItem }] });
      load();
    } catch { setError("Failed to create rate analysis."); }
    setSaving(false);
  };

  const handleStatus = async (id: number, status: string) => {
    try {
      await rateAnalysisService.updateStatus(id, status);
      load();
    } catch { setError("Failed to update status."); }
  };

  const handleReject = async () => {
    if (!showReject) return;
    try {
      await rateAnalysisService.updateStatus(showReject, `REJECTED:${rejectReason}`);
      setShowReject(null);
      setRejectReason("");
      load();
    } catch { setError("Failed to reject."); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this draft rate analysis?")) return;
    try {
      await rateAnalysisService.delete(id);
      load();
    } catch { setError("Failed to delete."); }
  };

  // ── Item helpers ────────────────────────────────────────────────────

  const updateItem = (idx: number, patch: Partial<ItemRow>) => {
    setForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, ...patch } : it) }));
  };
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...emptyItem }] }));
  const removeItem = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const formTotal = form.items.reduce((s, i) => s + i.coefficient * i.rate, 0);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">Rate Analysis</h1>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
          + New Rate Analysis
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 flex-wrap">
          {STATUS_LIST.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${statusFilter === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
              {s === "All" ? "All" : s}
            </button>
          ))}
        </div>
        <select value={projectFilter} onChange={e => setProjectFilter(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white">
          <option value={0}>All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>}

      {/* Table */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No rate analyses found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3 text-right">Unit Rate</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created By</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => (
                  <TableRow key={r.id} r={r} expanded={expandedId === r.id}
                    onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    onSubmit={() => handleStatus(r.id, "SUBMITTED")}
                    onApprove={() => handleStatus(r.id, "APPROVED")}
                    onReject={() => { setShowReject(r.id); setRejectReason(""); }}
                    onDelete={() => handleDelete(r.id)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-6">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">New Rate Analysis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Project *</label>
                <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value={0}>Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Activity *</label>
                <select value={form.activityId} onChange={e => setForm(f => ({ ...f, activityId: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value={0}>Select activity</option>
                  {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            {/* Items table */}
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                    <th className="px-2 py-2">Category</th>
                    <th className="px-2 py-2">Description</th>
                    <th className="px-2 py-2">Material</th>
                    <th className="px-2 py-2 text-right">Coefficient</th>
                    <th className="px-2 py-2 text-right">Rate</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {form.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-1.5">
                        <select value={it.category} onChange={e => updateItem(idx, { category: e.target.value })}
                          className="border border-gray-200 rounded px-2 py-1 text-xs w-28">
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={it.description} onChange={e => updateItem(idx, { description: e.target.value })}
                          className="border border-gray-200 rounded px-2 py-1 text-xs w-full" placeholder="Description" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={it.materialName} onChange={e => updateItem(idx, { materialName: e.target.value })}
                          className="border border-gray-200 rounded px-2 py-1 text-xs w-full" placeholder="Material" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" step={0.0001} value={it.coefficient || ""}
                          onChange={e => updateItem(idx, { coefficient: parseFloat(e.target.value) || 0 })}
                          className="border border-gray-200 rounded px-2 py-1 text-xs w-24 text-right" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" step={0.01} value={it.rate || ""}
                          onChange={e => updateItem(idx, { rate: parseFloat(e.target.value) || 0 })}
                          className="border border-gray-200 rounded px-2 py-1 text-xs w-24 text-right" />
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">
                        {fmt(it.coefficient * it.rate)}
                      </td>
                      <td className="px-2 py-1.5">
                        {form.items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mb-5">
              <button onClick={addItem} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">+ Add Item</button>
              <div className="text-sm font-semibold text-gray-800">Total Unit Rate: {fmt(formTotal)}</div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowCreate(false); setForm({ projectId: 0, activityId: 0, items: [{ ...emptyItem }] }); }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} disabled={saving || !form.projectId || !form.activityId}
                className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                {saving ? "Saving..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showReject !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Reject Rate Analysis</h3>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
            <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4" placeholder="Reason for rejection" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowReject(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Table Row (with expandable detail) ────────────────────────────────

function TableRow({ r, expanded, onToggle, onSubmit, onApprove, onReject, onDelete }: {
  r: RateAnalysisDto; expanded: boolean;
  onToggle: () => void; onSubmit: () => void; onApprove: () => void; onReject: () => void; onDelete: () => void;
}) {
  return (
    <>
      <tr className="hover:bg-gray-50/60 cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3 font-medium text-gray-800">{r.activityName}</td>
        <td className="px-4 py-3 text-gray-600">{r.projectName}</td>
        <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmt(r.unitRate)}</td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-700"}`}>
            {r.status}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-600">{r.createdBy}</td>
        <td className="px-4 py-3 text-gray-500">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
          <div className="flex justify-center gap-1.5 flex-wrap">
            {r.status === "DRAFT" && (
              <>
                <button onClick={onSubmit} className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 hover:bg-blue-100">Submit</button>
                <button onClick={onDelete} className="px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100">Delete</button>
              </>
            )}
            {r.status === "SUBMITTED" && (
              <>
                <button onClick={onApprove} className="px-2 py-1 text-xs rounded bg-green-50 text-green-700 hover:bg-green-100">Approve</button>
                <button onClick={onReject} className="px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100">Reject</button>
              </>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="px-4 pb-4 pt-1 bg-gray-50/40">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    <th className="px-2 py-1.5">Category</th>
                    <th className="px-2 py-1.5">Description</th>
                    <th className="px-2 py-1.5">Material</th>
                    <th className="px-2 py-1.5 text-right">Coefficient</th>
                    <th className="px-2 py-1.5 text-right">Rate</th>
                    <th className="px-2 py-1.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {r.items.map(it => (
                    <tr key={it.id}>
                      <td className="px-2 py-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLORS[it.category] ?? ""}`}>
                          {it.category}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-gray-700">{it.description}</td>
                      <td className="px-2 py-1.5 text-gray-600">{it.materialName}</td>
                      <td className="px-2 py-1.5 text-right text-gray-700">{it.coefficient}</td>
                      <td className="px-2 py-1.5 text-right text-gray-700">{fmt(it.rate)}</td>
                      <td className="px-2 py-1.5 text-right font-medium text-gray-800">{fmt(it.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100/60 font-semibold">
                    <td colSpan={5} className="px-2 py-2 text-right text-gray-700">Total Unit Rate</td>
                    <td className="px-2 py-2 text-right text-gray-900">{fmt(r.unitRate)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
