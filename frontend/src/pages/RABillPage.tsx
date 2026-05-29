import { useState, useEffect } from "react";
import { raBillService } from "../services/raBillService";
import type {
  RABillDto,
  CreateRABillRequest,
} from "../services/raBillService";
import { workOrderService } from "../services/jobService";
import type { WorkOrderDto } from "../services/jobService";
import { contractorService } from "../services/contractorService";
import type { ContractorDto } from "../services/contractorService";
import { activityMasterService } from "../services/activityService";
import type { ActivityMasterDto } from "../services/activityService";
import { projectService } from "../services/projectService";
import type { ProjectDto } from "../services/projectService";
import { measurementBookService } from "../services/measurementBookService";
import type { MeasurementBookDto } from "../services/measurementBookService";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
  POSTED: "bg-purple-100 text-purple-700",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  POSTED: "Posted",
};

const BILL_TYPES = ["ADVANCE", "WORK_DONE", "RECOVERY_RELEASE", "FINAL"] as const;
const BILL_TYPE_LABELS: Record<string, string> = {
  ADVANCE: "Advance",
  WORK_DONE: "Work Done",
  RECOVERY_RELEASE: "Recovery Release",
  FINAL: "Final",
};

const fmt = (n?: number) => n != null ? "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "₹0.00";

interface BillItemRow {
  activityId: number;
  measurementBookId: number;
  currentQty: number;
  woRate: number;
}

interface AdjRow {
  adjustmentType: "ADDITION" | "DEDUCTION";
  nature: "REFUNDABLE" | "NON_REFUNDABLE";
  description: string;
  amount: number;
}

interface RAForm {
  workOrderId: number;
  contractorId: number;
  projectId: number;
  billDate: string;
  billType: string;
  advanceCategory: string;
  advancePercent: number;
  retentionPercent: number;
  remarks: string;
  items: BillItemRow[];
  adjustments: AdjRow[];
}

const emptyItem: BillItemRow = { activityId: 0, measurementBookId: 0, currentQty: 0, woRate: 0 };
const emptyAdj: AdjRow = { adjustmentType: "ADDITION", nature: "REFUNDABLE", description: "", amount: 0 };
const emptyForm: RAForm = {
  workOrderId: 0, contractorId: 0, projectId: 0, billDate: "", billType: "WORK_DONE",
  advanceCategory: "", advancePercent: 0, retentionPercent: 0, remarks: "",
  items: [{ ...emptyItem }], adjustments: [],
};

export default function RABillPage() {
  const [bills, setBills] = useState<RABillDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [workOrders, setWorkOrders] = useState<WorkOrderDto[]>([]);
  const [contractors, setContractors] = useState<ContractorDto[]>([]);
  const [activities, setActivities] = useState<ActivityMasterDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [mbList, setMbList] = useState<MeasurementBookDto[]>([]);

  const [filterWO, setFilterWO] = useState(0);
  const [filterContractor, setFilterContractor] = useState(0);
  const [filterBillType, setFilterBillType] = useState("");

  const [form, setForm] = useState<RAForm>({ ...emptyForm });

  useEffect(() => {
    loadBills();
    loadDropdowns();
  }, []);

  const loadBills = async () => {
    setLoading(true);
    try { setBills(await raBillService.getAll()); } catch { setBills([]); }
    setLoading(false);
  };

  const loadDropdowns = async () => {
    try {
      const [w, c, a, p, m] = await Promise.all([
        workOrderService.getAll(),
        contractorService.getActive(),
        activityMasterService.getActive(),
        projectService.getActiveProjects(),
        measurementBookService.getAll(),
      ]);
      setWorkOrders(w); setContractors(c); setActivities(a); setProjects(p); setMbList(m);
    } catch (err) { console.error(err); }
  };

  const filtered = bills.filter((b) => {
    if (filterWO && b.workOrderId !== filterWO) return false;
    if (filterContractor && b.contractorId !== filterContractor) return false;
    if (filterBillType && b.billType !== filterBillType) return false;
    return true;
  });

  const openCreate = () => {
    setForm({ ...emptyForm, items: [{ ...emptyItem }], adjustments: [] });
    setShowModal(true);
  };

  const updateFormField = (field: keyof RAForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Items
  const updateItem = (idx: number, field: keyof BillItemRow, value: number) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, { ...emptyItem }] }));
  const removeItem = (idx: number) => {
    setForm((prev) => {
      const items = prev.items.filter((_, i) => i !== idx);
      return { ...prev, items: items.length > 0 ? items : [{ ...emptyItem }] };
    });
  };

  // Adjustments
  const updateAdj = (idx: number, field: keyof AdjRow, value: any) => {
    setForm((prev) => {
      const adjustments = [...prev.adjustments];
      adjustments[idx] = { ...adjustments[idx], [field]: value };
      return { ...prev, adjustments };
    });
  };

  const addAdj = () => setForm((prev) => ({ ...prev, adjustments: [...prev.adjustments, { ...emptyAdj }] }));
  const removeAdj = (idx: number) => {
    setForm((prev) => ({ ...prev, adjustments: prev.adjustments.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.workOrderId) { alert("Please select a Work Order."); return; }
    if (!form.contractorId) { alert("Please select a Contractor."); return; }
    if (!form.billDate) { alert("Bill Date is required."); return; }

    setSaving(true);
    try {
      const req: CreateRABillRequest = {
        workOrderId: form.workOrderId,
        contractorId: form.contractorId,
        projectId: form.projectId || undefined as any,
        billDate: form.billDate,
        billType: form.billType as any,
        advanceCategory: form.billType === "ADVANCE" ? form.advanceCategory || undefined : undefined,
        advancePercent: form.billType === "ADVANCE" ? form.advancePercent || undefined : undefined,
        retentionPercent: form.retentionPercent || undefined,
        remarks: form.remarks || undefined,
        items: form.items.filter((it) => it.activityId > 0).map((it) => ({
          activityId: it.activityId,
          measurementBookId: it.measurementBookId || undefined,
          currentQty: it.currentQty,
          woRate: it.woRate,
        })),
        adjustments: form.adjustments.filter((a) => a.amount > 0).map((a) => ({
          adjustmentType: a.adjustmentType,
          nature: a.nature,
          description: a.description || undefined,
          amount: a.amount,
        })),
      };
      await raBillService.create(req);
      setShowModal(false);
      loadBills();
    } catch (err: any) {
      alert("Failed to create RA Bill.\n" + (err.message || err));
    }
    setSaving(false);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try { await raBillService.updateStatus(id, newStatus); loadBills(); }
    catch (err: any) { alert("Failed to update status.\n" + (err.message || err)); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this RA Bill?")) return;
    try { await raBillService.delete(id); loadBills(); }
    catch (err: any) { alert("Failed to delete.\n" + (err.message || err)); }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">RA Bills</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
          + New RA Bill
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-52">
            <label className="block text-xs text-gray-500 mb-1">Work Order</label>
            <select value={filterWO} onChange={(e) => setFilterWO(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value={0}>All</option>
              {workOrders.map((wo) => <option key={wo.id} value={wo.id}>{wo.woNumber}</option>)}
            </select>
          </div>
          <div className="w-52">
            <label className="block text-xs text-gray-500 mb-1">Contractor</label>
            <select value={filterContractor} onChange={(e) => setFilterContractor(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value={0}>All</option>
              {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="w-44">
            <label className="block text-xs text-gray-500 mb-1">Bill Type</label>
            <select value={filterBillType} onChange={(e) => setFilterBillType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">All</option>
              {BILL_TYPES.map((t) => <option key={t} value={t}>{BILL_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <p className="text-sm text-gray-500 ml-auto">{filtered.length} bill(s)</p>
        </div>
      </div>

      {/* Bill cards */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No RA bills found.</div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1">
          {filtered.map((bill) => (
            <div key={bill.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpandedId(expandedId === bill.id ? null : bill.id)}>
                <div className="flex-1 min-w-[120px]">
                  <p className="text-sm font-bold text-gray-800">{bill.billNo}</p>
                  <p className="text-xs text-gray-400">{bill.projectName}</p>
                </div>
                <div className="w-32">
                  <p className="text-xs text-gray-400">WO</p>
                  <p className="text-sm text-gray-700">{bill.woNumber || "—"}</p>
                </div>
                <div className="w-36">
                  <p className="text-xs text-gray-400">Contractor</p>
                  <p className="text-sm text-gray-700 truncate">{bill.contractorName || "—"}</p>
                </div>
                <div className="w-24">
                  <p className="text-xs text-gray-400">Date</p>
                  <p className="text-sm text-gray-700">{bill.billDate}</p>
                </div>
                <div className="w-28">
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${BILL_TYPE_LABELS[bill.billType] ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-600"}`}>
                    {BILL_TYPE_LABELS[bill.billType] || bill.billType}
                  </span>
                </div>
                <div className="w-32 text-right">
                  <p className="text-sm font-bold text-green-600">{fmt(bill.netPayable)}</p>
                </div>
                <div className="w-24">
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[bill.status] || "bg-gray-100 text-gray-700"}`}>
                    {STATUS_LABELS[bill.status] || bill.status}
                  </span>
                </div>
                <span className={`text-xs font-bold transition-transform ${expandedId === bill.id ? "rotate-90" : ""}`}>&#9654;</span>
              </div>

              {expandedId === bill.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  {/* Financial summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                    <div><span className="text-gray-400 text-xs">Advance</span><p className="font-semibold">{fmt(bill.advanceAmount)}</p></div>
                    <div><span className="text-gray-400 text-xs">Current Bill</span><p className="font-semibold">{fmt(bill.currentBillAmount)}</p></div>
                    <div><span className="text-gray-400 text-xs">Previous Bill</span><p className="font-semibold">{fmt(bill.previousBillAmount)}</p></div>
                    <div><span className="text-gray-400 text-xs">Cumulative</span><p className="font-semibold">{fmt(bill.cumulativeBillAmount)}</p></div>
                    <div><span className="text-gray-400 text-xs">Retention ({bill.retentionPercent || 0}%)</span><p className="font-semibold">{fmt(bill.retentionAmount)}</p></div>
                    <div><span className="text-gray-400 text-xs">Adv Recovery</span><p className="font-semibold">{fmt(bill.advanceRecoveryAmount)}</p></div>
                    <div><span className="text-gray-400 text-xs">Deductions</span><p className="font-semibold">{fmt(bill.deductionAmount)}</p></div>
                    <div><span className="text-gray-400 text-xs">Tax</span><p className="font-semibold">{fmt(bill.taxAmount)}</p></div>
                    <div><span className="text-gray-400 text-xs">Retention Release</span><p className="font-semibold">{fmt(bill.retentionReleaseAmount)}</p></div>
                    <div><span className="text-gray-400 text-xs">Deduction Release</span><p className="font-semibold">{fmt(bill.deductionReleaseAmount)}</p></div>
                    <div className="col-span-2"><span className="text-gray-400 text-xs">Net Payable</span><p className="font-bold text-lg text-green-600">{fmt(bill.netPayable)}</p></div>
                  </div>

                  {bill.remarks && <p className="text-xs text-gray-500 mb-3">Remarks: {bill.remarks}</p>}

                  {/* Items sub-table */}
                  {bill.items && bill.items.length > 0 && (
                    <div className="mb-4 overflow-x-auto">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Items</p>
                      <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-2 py-1.5 text-left font-semibold text-gray-600">Activity</th>
                            <th className="px-2 py-1.5 text-right font-semibold text-gray-600">WO Qty</th>
                            <th className="px-2 py-1.5 text-right font-semibold text-gray-600">WO Rate</th>
                            <th className="px-2 py-1.5 text-right font-semibold text-gray-600">Prev Qty</th>
                            <th className="px-2 py-1.5 text-right font-semibold text-gray-600">Curr Qty</th>
                            <th className="px-2 py-1.5 text-right font-semibold text-gray-600">Cumul Qty</th>
                            <th className="px-2 py-1.5 text-right font-semibold text-gray-600">Curr Amt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bill.items.map((item, idx) => (
                            <tr key={item.id ?? idx} className="border-t border-gray-100">
                              <td className="px-2 py-1.5 font-medium">{item.activityName || "—"}</td>
                              <td className="px-2 py-1.5 text-right">{item.woQty ?? "—"}</td>
                              <td className="px-2 py-1.5 text-right">{fmt(item.woRate)}</td>
                              <td className="px-2 py-1.5 text-right">{item.previousQty ?? 0}</td>
                              <td className="px-2 py-1.5 text-right font-semibold">{item.currentQty}</td>
                              <td className="px-2 py-1.5 text-right">{item.cumulativeQty ?? 0}</td>
                              <td className="px-2 py-1.5 text-right font-semibold">{fmt(item.currentAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Adjustments sub-table */}
                  {bill.adjustments && bill.adjustments.length > 0 && (
                    <div className="mb-4 overflow-x-auto">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Adjustments</p>
                      <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-2 py-1.5 text-left font-semibold text-gray-600">Type</th>
                            <th className="px-2 py-1.5 text-left font-semibold text-gray-600">Nature</th>
                            <th className="px-2 py-1.5 text-left font-semibold text-gray-600">Description</th>
                            <th className="px-2 py-1.5 text-right font-semibold text-gray-600">Amount</th>
                            <th className="px-2 py-1.5 text-center font-semibold text-gray-600">Released</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bill.adjustments.map((adj, idx) => (
                            <tr key={adj.id ?? idx} className="border-t border-gray-100">
                              <td className="px-2 py-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${adj.adjustmentType === "DEDUCTION" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                                  {adj.adjustmentType}
                                </span>
                              </td>
                              <td className="px-2 py-1.5">{adj.nature}</td>
                              <td className="px-2 py-1.5">{adj.description || "—"}</td>
                              <td className="px-2 py-1.5 text-right font-semibold">{fmt(adj.amount)}</td>
                              <td className="px-2 py-1.5 text-center">{adj.released ? "Yes" : "No"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-gray-500 font-semibold">Status:</label>
                    <select value={bill.status} onChange={(e) => handleStatusChange(bill.id, e.target.value)}
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white font-semibold">
                      {["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"].map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                    <button onClick={() => handleDelete(bill.id)}
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

      {/* Create RA Bill Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Create RA Bill</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Work Order <span className="text-red-500">*</span></label>
                  <select value={form.workOrderId} onChange={(e) => updateFormField("workOrderId", Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value={0}>-- Select WO --</option>
                    {workOrders.map((wo) => <option key={wo.id} value={wo.id}>{wo.woNumber} - {wo.contractorName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Contractor <span className="text-red-500">*</span></label>
                  <select value={form.contractorId} onChange={(e) => updateFormField("contractorId", Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value={0}>-- Select Contractor --</option>
                    {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Project</label>
                  <select value={form.projectId} onChange={(e) => updateFormField("projectId", Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value={0}>-- Select Project --</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bill Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.billDate} onChange={(e) => updateFormField("billDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bill Type</label>
                  <select value={form.billType} onChange={(e) => updateFormField("billType", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    {BILL_TYPES.map((t) => <option key={t} value={t}>{BILL_TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Retention %</label>
                  <input type="number" min={0} max={100} step={0.1} value={form.retentionPercent || ""}
                    onChange={(e) => updateFormField("retentionPercent", Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>

              {/* Advance fields */}
              {form.billType === "ADVANCE" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Advance Category</label>
                    <input type="text" value={form.advanceCategory} onChange={(e) => updateFormField("advanceCategory", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. Mobilization" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Advance %</label>
                    <input type="number" min={0} max={100} step={0.1} value={form.advancePercent || ""}
                      onChange={(e) => updateFormField("advancePercent", Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-500 mb-1">Remarks</label>
                <textarea value={form.remarks} onChange={(e) => updateFormField("remarks", e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 w-[200px]">Activity</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 w-[160px]">MB</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-[90px]">Current Qty</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-[100px]">WO Rate</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-[110px]">Amount</th>
                        <th className="px-2 py-2 w-[40px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, idx) => (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="px-2 py-1.5">
                            <select value={item.activityId} onChange={(e) => updateItem(idx, "activityId", Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white">
                              <option value={0}>-- Select --</option>
                              {activities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <select value={item.measurementBookId} onChange={(e) => updateItem(idx, "measurementBookId", Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white">
                              <option value={0}>-- None --</option>
                              {mbList.map((m) => <option key={m.id} value={m.id}>{m.mbNumber}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" min={0} value={item.currentQty || ""} onChange={(e) => updateItem(idx, "currentQty", Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" min={0} value={item.woRate || ""} onChange={(e) => updateItem(idx, "woRate", Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right" />
                          </td>
                          <td className="px-2 py-1.5 text-right text-xs font-semibold text-gray-700">
                            {fmt(item.currentQty * item.woRate)}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs font-bold">&#10005;</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={addItem} className="mt-2 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                  + Add Item
                </button>
              </div>

              {/* Adjustments */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Adjustments</p>
                {form.adjustments.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 w-[140px]">Type</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 w-[140px]">Nature</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Description</th>
                          <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-[100px]">Amount</th>
                          <th className="px-2 py-2 w-[40px]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.adjustments.map((adj, idx) => (
                          <tr key={idx} className="border-t border-gray-100">
                            <td className="px-2 py-1.5">
                              <select value={adj.adjustmentType} onChange={(e) => updateAdj(idx, "adjustmentType", e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white">
                                <option value="ADDITION">Addition</option>
                                <option value="DEDUCTION">Deduction</option>
                              </select>
                            </td>
                            <td className="px-2 py-1.5">
                              <select value={adj.nature} onChange={(e) => updateAdj(idx, "nature", e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white">
                                <option value="REFUNDABLE">Refundable</option>
                                <option value="NON_REFUNDABLE">Non-Refundable</option>
                              </select>
                            </td>
                            <td className="px-2 py-1.5">
                              <input type="text" value={adj.description} onChange={(e) => updateAdj(idx, "description", e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs" placeholder="Description" />
                            </td>
                            <td className="px-2 py-1.5">
                              <input type="number" min={0} value={adj.amount || ""} onChange={(e) => updateAdj(idx, "amount", Number(e.target.value))}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right" />
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <button onClick={() => removeAdj(idx)} className="text-red-400 hover:text-red-600 text-xs font-bold">&#10005;</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <button onClick={addAdj} className="mt-2 px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition">
                  + Add Adjustment
                </button>
              </div>
            </div>

            {/* Footer */}
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
