import { useState, useEffect } from "react";
import { measurementBookService } from "../services/measurementBookService";
import type {
  MeasurementBookDto,
  CreateMeasurementBookRequest,
} from "../services/measurementBookService";
import { workOrderService } from "../services/jobService";
import type { WorkOrderDto } from "../services/jobService";
import { activityMasterService } from "../services/activityService";
import type { ActivityMasterDto } from "../services/activityService";
import { projectService } from "../services/projectService";
import type { ProjectDto } from "../services/projectService";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

interface DetailRow {
  description: string;
  operand: "ADDITION" | "DEDUCTION";
  nos: number;
  length: number;
  breadth: number;
  height: number;
}

interface ItemRow {
  activityId: number;
  uom: string;
  currentMeasuredQty: number;
  details: DetailRow[];
}

interface MBForm {
  workOrderId: number;
  projectId: number;
  mbDate: string;
  remarks: string;
  items: ItemRow[];
}

const emptyDetail: DetailRow = { description: "", operand: "ADDITION", nos: 1, length: 0, breadth: 0, height: 0 };

const emptyItem: ItemRow = {
  activityId: 0,
  uom: "",
  currentMeasuredQty: 0,
  details: [{ ...emptyDetail }],
};

const emptyForm: MBForm = {
  workOrderId: 0,
  projectId: 0,
  mbDate: "",
  remarks: "",
  items: [{ ...emptyItem, details: [{ ...emptyDetail }] }],
};

function calcDetailQty(d: DetailRow): number {
  return d.nos * (d.length || 1) * (d.breadth || 1) * (d.height || 1);
}

function calcItemQty(details: DetailRow[]): number {
  return details.reduce((sum, d) => {
    const q = calcDetailQty(d);
    return d.operand === "DEDUCTION" ? sum - q : sum + q;
  }, 0);
}

export default function MeasurementBookPage() {
  const [mbs, setMbs] = useState<MeasurementBookDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [workOrders, setWorkOrders] = useState<WorkOrderDto[]>([]);
  const [activities, setActivities] = useState<ActivityMasterDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [filterWO, setFilterWO] = useState(0);

  const [form, setForm] = useState<MBForm>({ ...emptyForm });

  useEffect(() => {
    loadMBs();
    loadDropdowns();
  }, []);

  const loadMBs = async () => {
    setLoading(true);
    try {
      const data = await measurementBookService.getAll();
      setMbs(data);
    } catch (err) {
      console.error("Failed to load MBs:", err);
    }
    setLoading(false);
  };

  const loadDropdowns = async () => {
    try {
      const [w, a, p] = await Promise.all([
        workOrderService.getAll(),
        activityMasterService.getActive(),
        projectService.getActiveProjects(),
      ]);
      setWorkOrders(w);
      setActivities(a);
      setProjects(p);
    } catch (err) {
      console.error("Failed to load dropdowns:", err);
    }
  };

  const filtered = filterWO ? mbs.filter((mb) => mb.workOrderId === filterWO) : mbs;

  const openCreate = () => {
    setForm({ ...emptyForm, items: [{ ...emptyItem, details: [{ ...emptyDetail }] }] });
    setShowModal(true);
  };

  // ─── Form helpers ───
  const updateFormField = (field: keyof Omit<MBForm, "items">, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const _updateItem = (idx: number, field: keyof Omit<ItemRow, "details">, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };
  void _updateItem; // suppress unused warning

  const handleItemActivityChange = (idx: number, activityId: number) => {
    const act = activities.find((a) => a.id === activityId);
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], activityId, uom: act?.uom || "" };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyItem, details: [{ ...emptyDetail }] }],
    }));
  };

  const removeItem = (idx: number) => {
    setForm((prev) => {
      const items = prev.items.filter((_, i) => i !== idx);
      return { ...prev, items: items.length > 0 ? items : [{ ...emptyItem, details: [{ ...emptyDetail }] }] };
    });
  };

  const updateDetail = (itemIdx: number, detailIdx: number, field: keyof DetailRow, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items];
      const details = [...items[itemIdx].details];
      details[detailIdx] = { ...details[detailIdx], [field]: value } as DetailRow;
      items[itemIdx] = { ...items[itemIdx], details, currentMeasuredQty: calcItemQty(details) };
      return { ...prev, items };
    });
  };

  const addDetail = (itemIdx: number) => {
    setForm((prev) => {
      const items = [...prev.items];
      const details = [...items[itemIdx].details, { ...emptyDetail }];
      items[itemIdx] = { ...items[itemIdx], details };
      return { ...prev, items };
    });
  };

  const removeDetail = (itemIdx: number, detailIdx: number) => {
    setForm((prev) => {
      const items = [...prev.items];
      const details = items[itemIdx].details.filter((_, i) => i !== detailIdx);
      const finalDetails = details.length > 0 ? details : [{ ...emptyDetail }];
      items[itemIdx] = { ...items[itemIdx], details: finalDetails, currentMeasuredQty: calcItemQty(finalDetails) };
      return { ...prev, items };
    });
  };

  // Recalculate detail qty whenever form changes
  const getDetailQtyDisplay = (d: DetailRow) => {
    const qty = calcDetailQty(d);
    return d.operand === "DEDUCTION" ? -qty : qty;
  };

  const handleSave = async () => {
    if (!form.workOrderId) { alert("Please select a Work Order."); return; }
    if (!form.mbDate) { alert("MB Date is required."); return; }
    const validItems = form.items.filter((it) => it.activityId > 0);
    if (validItems.length === 0) { alert("At least one valid item is required."); return; }

    setSaving(true);
    try {
      const req: CreateMeasurementBookRequest = {
        workOrderId: form.workOrderId,
        projectId: form.projectId || undefined as any,
        mbDate: form.mbDate,
        remarks: form.remarks || undefined,
        items: validItems.map((it) => ({
          activityId: it.activityId,
          currentMeasuredQty: it.currentMeasuredQty,
          details: it.details.map((d) => ({
            description: d.description || undefined,
            operand: d.operand,
            nos: d.nos,
            length: d.length,
            breadth: d.breadth,
            height: d.height,
          })),
        })),
      };
      await measurementBookService.create(req);
      setShowModal(false);
      loadMBs();
    } catch (err: any) {
      alert("Failed to create MB.\n" + (err.message || err));
    }
    setSaving(false);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await measurementBookService.updateStatus(id, newStatus);
      loadMBs();
    } catch (err: any) {
      alert("Failed to update status.\n" + (err.message || err));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this Measurement Book?")) return;
    try {
      await measurementBookService.delete(id);
      loadMBs();
    } catch (err: any) {
      alert("Failed to delete.\n" + (err.message || err));
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Measurement Books</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
          + New MB
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-60">
            <label className="block text-xs text-gray-500 mb-1">Filter by Work Order</label>
            <select value={filterWO} onChange={(e) => setFilterWO(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value={0}>All Work Orders</option>
              {workOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>{wo.woNumber} - {wo.contractorName}</option>
              ))}
            </select>
          </div>
          <p className="text-sm text-gray-500 ml-auto">{filtered.length} MB(s) found</p>
        </div>
      </div>

      {/* MB cards */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No measurement books found.</div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1">
          {filtered.map((mb) => (
            <div key={mb.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Summary row */}
              <div className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpandedId(expandedId === mb.id ? null : mb.id)}>
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-bold text-gray-800">{mb.mbNumber}</p>
                  <p className="text-xs text-gray-400">{mb.projectName}</p>
                </div>
                <div className="w-40">
                  <p className="text-xs text-gray-400">Work Order</p>
                  <p className="text-sm text-gray-700">{mb.woNumber || "—"}</p>
                </div>
                <div className="w-28">
                  <p className="text-xs text-gray-400">Date</p>
                  <p className="text-sm text-gray-700">{mb.mbDate}</p>
                </div>
                <div className="w-24">
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[mb.status] || "bg-gray-100 text-gray-700"}`}>
                    {STATUS_LABELS[mb.status] || mb.status}
                  </span>
                </div>
                <span className={`text-xs font-bold transition-transform ${expandedId === mb.id ? "rotate-90" : ""}`}>&#9654;</span>
              </div>

              {/* Expanded */}
              {expandedId === mb.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  {mb.remarks && <p className="text-xs text-gray-500 mb-3">Remarks: {mb.remarks}</p>}

                  {/* Items */}
                  {mb.items && mb.items.length > 0 && (
                    <div className="mb-4 overflow-x-auto">
                      <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">#</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Activity</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">UOM</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Prev Qty</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Current Qty</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Cumulative</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">WO Qty</th>
                            <th className="px-3 py-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {mb.items.map((item, idx) => (
                            <>
                              <tr key={item.id ?? idx} className="border-t border-gray-100 cursor-pointer hover:bg-blue-50"
                                onClick={() => setExpandedItemId(expandedItemId === (item.id ?? idx) ? null : (item.id ?? idx))}>
                                <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                                <td className="px-3 py-2 font-medium">{item.activityName || "—"}</td>
                                <td className="px-3 py-2">{item.activityUom || "—"}</td>
                                <td className="px-3 py-2 text-right">{item.previousMeasuredQty ?? 0}</td>
                                <td className="px-3 py-2 text-right font-semibold">{item.currentMeasuredQty ?? 0}</td>
                                <td className="px-3 py-2 text-right">{item.cumulativeMeasuredQty ?? 0}</td>
                                <td className="px-3 py-2 text-right">{item.woQty ?? "—"}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`text-xs transition-transform inline-block ${expandedItemId === (item.id ?? idx) ? "rotate-90" : ""}`}>&#9654;</span>
                                </td>
                              </tr>
                              {expandedItemId === (item.id ?? idx) && item.details && item.details.length > 0 && (
                                <tr key={`detail-${item.id ?? idx}`}>
                                  <td colSpan={8} className="px-3 py-2 bg-blue-50">
                                    <p className="text-xs font-semibold text-gray-600 mb-1">Details of Measurement (DOM)</p>
                                    <table className="w-full text-xs border border-gray-200 rounded">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="px-2 py-1 text-left">#</th>
                                          <th className="px-2 py-1 text-left">Description</th>
                                          <th className="px-2 py-1 text-center">Operand</th>
                                          <th className="px-2 py-1 text-right">Nos</th>
                                          <th className="px-2 py-1 text-right">Length</th>
                                          <th className="px-2 py-1 text-right">Breadth</th>
                                          <th className="px-2 py-1 text-right">Height</th>
                                          <th className="px-2 py-1 text-right">Qty</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {item.details.map((d, di) => (
                                          <tr key={d.id ?? di} className="border-t border-gray-100">
                                            <td className="px-2 py-1">{di + 1}</td>
                                            <td className="px-2 py-1">{d.description || "—"}</td>
                                            <td className="px-2 py-1 text-center">
                                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${d.operand === "DEDUCTION" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                                                {d.operand || "ADD"}
                                              </span>
                                            </td>
                                            <td className="px-2 py-1 text-right">{d.nos ?? 0}</td>
                                            <td className="px-2 py-1 text-right">{d.length ?? 0}</td>
                                            <td className="px-2 py-1 text-right">{d.breadth ?? 0}</td>
                                            <td className="px-2 py-1 text-right">{d.height ?? 0}</td>
                                            <td className="px-2 py-1 text-right font-semibold">{d.quantity ?? 0}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              )}
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-gray-500 font-semibold">Status:</label>
                    <select value={mb.status} onChange={(e) => handleStatusChange(mb.id, e.target.value)}
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white font-semibold">
                      {["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"].map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                    <button onClick={() => handleDelete(mb.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create MB Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Create Measurement Book</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* WO, Project, Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Work Order <span className="text-red-500">*</span></label>
                  <select value={form.workOrderId} onChange={(e) => updateFormField("workOrderId", Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value={0}>-- Select WO --</option>
                    {workOrders.map((wo) => (
                      <option key={wo.id} value={wo.id}>{wo.woNumber} - {wo.contractorName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Project</label>
                  <select value={form.projectId} onChange={(e) => updateFormField("projectId", Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value={0}>-- Select Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">MB Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.mbDate} onChange={(e) => updateFormField("mbDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Remarks</label>
                <textarea value={form.remarks} onChange={(e) => updateFormField("remarks", e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
                {form.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
                    {/* Item header */}
                    <div className="bg-gray-50 px-4 py-3 flex flex-wrap items-end gap-3">
                      <div className="flex-1 min-w-[180px]">
                        <label className="block text-xs text-gray-500 mb-1">Activity</label>
                        <select value={item.activityId} onChange={(e) => handleItemActivityChange(itemIdx, Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white">
                          <option value={0}>-- Select --</option>
                          {activities.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-20">
                        <label className="block text-xs text-gray-500 mb-1">UOM</label>
                        <input type="text" value={item.uom} readOnly className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 text-gray-500" />
                      </div>
                      <div className="w-32">
                        <label className="block text-xs text-gray-500 mb-1">Current Qty (auto)</label>
                        <input type="text" value={item.currentMeasuredQty.toFixed(2)} readOnly
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-green-50 text-green-700 font-semibold text-right" />
                      </div>
                      <button onClick={() => removeItem(itemIdx)} className="text-red-400 hover:text-red-600 text-xs font-bold mb-1" title="Remove Item">&#10005;</button>
                    </div>

                    {/* DOM details */}
                    <div className="px-4 py-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Details of Measurement (DOM)</p>
                      <table className="w-full text-xs border border-gray-200 rounded">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-2 py-1 text-left w-[140px]">Description</th>
                            <th className="px-2 py-1 text-center w-[100px]">Operand</th>
                            <th className="px-2 py-1 text-right w-[60px]">Nos</th>
                            <th className="px-2 py-1 text-right w-[70px]">Length</th>
                            <th className="px-2 py-1 text-right w-[70px]">Breadth</th>
                            <th className="px-2 py-1 text-right w-[70px]">Height</th>
                            <th className="px-2 py-1 text-right w-[80px]">Qty</th>
                            <th className="px-2 py-1 w-[30px]"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.details.map((d, di) => (
                            <tr key={di} className="border-t border-gray-100">
                              <td className="px-2 py-1">
                                <input type="text" value={d.description} onChange={(e) => updateDetail(itemIdx, di, "description", e.target.value)}
                                  className="w-full px-1 py-1 border border-gray-300 rounded text-xs" placeholder="Desc" />
                              </td>
                              <td className="px-2 py-1 text-center">
                                <div className="flex gap-2 justify-center">
                                  <label className="flex items-center gap-0.5 text-[10px]">
                                    <input type="radio" name={`op-${itemIdx}-${di}`} checked={d.operand === "ADDITION"}
                                      onChange={() => updateDetail(itemIdx, di, "operand", "ADDITION")} className="w-3 h-3" />
                                    Add
                                  </label>
                                  <label className="flex items-center gap-0.5 text-[10px]">
                                    <input type="radio" name={`op-${itemIdx}-${di}`} checked={d.operand === "DEDUCTION"}
                                      onChange={() => updateDetail(itemIdx, di, "operand", "DEDUCTION")} className="w-3 h-3" />
                                    Ded
                                  </label>
                                </div>
                              </td>
                              <td className="px-2 py-1">
                                <input type="number" min={0} value={d.nos || ""} onChange={(e) => updateDetail(itemIdx, di, "nos", Number(e.target.value))}
                                  className="w-full px-1 py-1 border border-gray-300 rounded text-xs text-right" />
                              </td>
                              <td className="px-2 py-1">
                                <input type="number" min={0} step="0.01" value={d.length || ""} onChange={(e) => updateDetail(itemIdx, di, "length", Number(e.target.value))}
                                  className="w-full px-1 py-1 border border-gray-300 rounded text-xs text-right" />
                              </td>
                              <td className="px-2 py-1">
                                <input type="number" min={0} step="0.01" value={d.breadth || ""} onChange={(e) => updateDetail(itemIdx, di, "breadth", Number(e.target.value))}
                                  className="w-full px-1 py-1 border border-gray-300 rounded text-xs text-right" />
                              </td>
                              <td className="px-2 py-1">
                                <input type="number" min={0} step="0.01" value={d.height || ""} onChange={(e) => updateDetail(itemIdx, di, "height", Number(e.target.value))}
                                  className="w-full px-1 py-1 border border-gray-300 rounded text-xs text-right" />
                              </td>
                              <td className="px-2 py-1 text-right font-semibold">
                                <span className={getDetailQtyDisplay(d) < 0 ? "text-red-600" : "text-green-700"}>
                                  {getDetailQtyDisplay(d).toFixed(2)}
                                </span>
                              </td>
                              <td className="px-2 py-1 text-center">
                                <button onClick={() => removeDetail(itemIdx, di)} className="text-red-400 hover:text-red-600 text-xs font-bold">&#10005;</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={() => addDetail(itemIdx)}
                        className="mt-1 px-2 py-1 text-[10px] font-semibold bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition">
                        + Add Detail Row
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={addItem}
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                  + Add Item
                </button>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
