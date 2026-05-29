import { useState, useEffect } from "react";
import { jobService, workOrderService } from "../services/jobService";
import type {
  JobDto,
  WorkOrderDto,
  CreateWorkOrderRequest,
} from "../services/jobService";
import { contractorService } from "../services/contractorService";
import type { ContractorDto } from "../services/contractorService";
import { activityMasterService } from "../services/activityService";
import type { ActivityMasterDto } from "../services/activityService";
import _api from "../services/api"; void _api;

const STATUS_LIST = ["All", "DRAFT", "ISSUED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

const CONTRACT_TYPES = [
  "Built-Up Area Including All Resources",
  "Labour Only",
  "Labour + Material",
  "Lump Sum",
  "Item Rate",
  "Other",
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ISSUED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

interface LineItem {
  activityId: number;
  description: string;
  uom: string;
  quantity: number;
  rate: number;
}

const emptyLineItem: LineItem = {
  activityId: 0,
  description: "",
  uom: "",
  quantity: 0,
  rate: 0,
};

interface WOForm {
  jobId: number;
  contractorId: number;
  woDate: string;
  startDate: string;
  endDate: string;
  termsAndConditions: string;
  remarks: string;
  items: LineItem[];
  contractType: string;
  woAdvanceType: string;
  woAdvanceValue: number;
  woRetentionType: string;
  woRetentionValue: number;
  workDuration: number;
  defectLiabilityPeriod: string;
  dateOfCompletion: string;
  contactPerson: string;
  workOrderTitle: string;
}

const emptyForm: WOForm = {
  jobId: 0,
  contractorId: 0,
  woDate: "",
  startDate: "",
  endDate: "",
  termsAndConditions: "",
  remarks: "",
  items: [{ ...emptyLineItem }],
  contractType: "",
  woAdvanceType: "PERCENTAGE",
  woAdvanceValue: 0,
  woRetentionType: "PERCENTAGE",
  woRetentionValue: 0,
  workDuration: 0,
  defectLiabilityPeriod: "",
  dateOfCompletion: "",
  contactPerson: "",
  workOrderTitle: "",
};

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function WorkOrderPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [contractors, setContractors] = useState<ContractorDto[]>([]);
  const [activities, setActivities] = useState<ActivityMasterDto[]>([]);

  const [form, setForm] = useState<WOForm>({ ...emptyForm, items: [{ ...emptyLineItem }] });
  const [activeTab, setActiveTab] = useState<"find" | "create">("find");

  // ─── Load data on mount ───
  useEffect(() => {
    loadWorkOrders();
    loadDropdowns();
  }, []);

  const loadWorkOrders = async () => {
    setLoading(true);
    try {
      const data = await workOrderService.getAll();
      setWorkOrders(data);
    } catch (err) {
      console.error("Failed to load work orders:", err);
      setWorkOrders([]);
    }
    setLoading(false);
  };

  const loadDropdowns = async () => {
    try {
      const [j, c, a] = await Promise.all([
        jobService.getAll(),
        contractorService.getActive(),
        activityMasterService.getActive(),
      ]);
      setJobs(j);
      setContractors(c);
      setActivities(a);
    } catch (err) {
      console.error("Failed to load dropdown data:", err);
    }
  };

  // ─── Filtering ───
  const filtered = workOrders.filter((wo) => {
    if (statusFilter !== "All" && wo.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        wo.woNumber.toLowerCase().includes(q) ||
        wo.contractorName.toLowerCase().includes(q) ||
        wo.jobName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // ─── Modal helpers ───
  const openCreate = () => {
    setForm({ ...emptyForm, items: [{ ...emptyLineItem }] });
    setShowModal(true);
  };

  const updateFormField = (field: keyof Omit<WOForm, "items">, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const handleActivityChange = (index: number, activityId: number) => {
    const act = activities.find((a) => a.id === activityId);
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = {
        ...items[index],
        activityId,
        uom: act?.uom || "",
      };
      return { ...prev, items };
    });
  };

  const addLineItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, { ...emptyLineItem }] }));
  };

  const removeLineItem = (index: number) => {
    setForm((prev) => {
      const items = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: items.length > 0 ? items : [{ ...emptyLineItem }] };
    });
  };

  const rowAmount = (item: LineItem) => item.quantity * item.rate;
  const formTotal = form.items.reduce((sum, item) => sum + rowAmount(item), 0);

  const handleSave = async () => {
    if (!form.jobId) {
      alert("Please select a Job.");
      return;
    }
    if (!form.contractorId) {
      alert("Please select a Contractor.");
      return;
    }
    if (!form.woDate) {
      alert("WO Date is required.");
      return;
    }
    const validItems = form.items.filter((it) => it.activityId > 0 && it.quantity > 0 && it.rate > 0);
    if (validItems.length === 0) {
      alert("At least one valid line item is required.");
      return;
    }

    setSaving(true);
    try {
      const req: CreateWorkOrderRequest = {
        jobId: form.jobId,
        contractorId: form.contractorId,
        woDate: form.woDate,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        termsAndConditions: form.termsAndConditions || undefined,
        remarks: form.remarks || undefined,
        contractType: form.contractType || undefined,
        woAdvanceType: form.woAdvanceType || undefined,
        woAdvanceValue: form.woAdvanceValue || undefined,
        woRetentionType: form.woRetentionType || undefined,
        woRetentionValue: form.woRetentionValue || undefined,
        workDuration: form.workDuration || undefined,
        defectLiabilityPeriod: form.defectLiabilityPeriod || undefined,
        dateOfCompletion: form.dateOfCompletion || undefined,
        contactPerson: form.contactPerson || undefined,
        workOrderTitle: form.workOrderTitle || undefined,
        items: validItems.map((it) => ({
          activityId: it.activityId,
          description: it.description || undefined,
          uom: it.uom,
          quantity: it.quantity,
          rate: it.rate,
        })),
      };
      await workOrderService.create(req);
      setShowModal(false);
      setActiveTab("find");
      setForm({ ...emptyForm, items: [{ ...emptyLineItem }] });
      loadWorkOrders();
    } catch (err: any) {
      alert("Failed to create work order.\n" + (err.message || err));
    }
    setSaving(false);
  };

  // ─── Status change ───
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await workOrderService.updateStatus(id, newStatus);
      loadWorkOrders();
    } catch (err: any) {
      alert("Failed to update status.\n" + (err.message || err));
    }
  };

  // ─── Delete ───
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this work order?")) return;
    try {
      await workOrderService.delete(id);
      loadWorkOrders();
    } catch (err: any) {
      alert("Failed to delete work order.\n" + (err.message || err));
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("find")}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition ${
            activeTab === "find"
              ? "bg-white text-blue-700 border border-gray-200 border-b-white -mb-px"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          Find Work Order
        </button>
        <button
          onClick={() => {
            setActiveTab("create");
            setForm({ ...emptyForm, items: [{ ...emptyLineItem }] });
          }}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition ${
            activeTab === "create"
              ? "bg-white text-blue-700 border border-gray-200 border-b-white -mb-px"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          Create WO From BOQ
        </button>
      </div>

      {/* ─── Find Work Order Tab ─── */}
      {activeTab === "find" && (
        <>
          {/* Filter bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex gap-1 flex-wrap">
                {STATUS_LIST.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      statusFilter === s
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {s === "All" ? "All" : STATUS_LABELS[s] || s}
                  </button>
                ))}
              </div>
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by WO number, contractor, job..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <button
                onClick={openCreate}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                + Create Work Order
              </button>
            </div>
          </div>

          {/* Count */}
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-500">
              {filtered.length} work order{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {/* Work Order cards */}
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No work orders found.</div>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1">
              {filtered.map((wo) => (
                <div
                  key={wo.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Summary row */}
                  <div
                    className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => setExpandedId(expandedId === wo.id ? null : wo.id)}
                  >
                    <div className="flex-1 min-w-[140px]">
                      <p className="text-sm font-bold text-gray-800">{wo.woNumber}</p>
                      <p className="text-xs text-gray-400">{wo.jobName}</p>
                    </div>
                    <div className="w-40">
                      <p className="text-xs text-gray-400">Contractor</p>
                      <p className="text-sm text-gray-700">{wo.contractorName}</p>
                    </div>
                    <div className="w-28">
                      <p className="text-xs text-gray-400">WO Date</p>
                      <p className="text-sm text-gray-700">{wo.woDate}</p>
                    </div>
                    <div className="w-24">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                          STATUS_COLORS[wo.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {STATUS_LABELS[wo.status] || wo.status}
                      </span>
                    </div>
                    <div className="w-32 text-right">
                      <p className="text-sm font-bold text-green-600">{fmt(wo.totalAmount)}</p>
                    </div>
                    <span
                      className={`text-xs font-bold transition-transform ${
                        expandedId === wo.id ? "rotate-90" : ""
                      }`}
                    >
                      &#9654;
                    </span>
                  </div>

                  {/* Expanded details */}
                  {expandedId === wo.id && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-400 text-xs">Start Date</span>
                          <p className="font-semibold">{wo.startDate || "—"}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">End Date</span>
                          <p className="font-semibold">{wo.endDate || "—"}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Contract Type</span>
                          <p className="font-semibold">{wo.contractType || "—"}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Work Duration</span>
                          <p className="font-semibold">{wo.workDuration ? `${wo.workDuration} Days` : "—"}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Defect Liability Period</span>
                          <p className="font-semibold">{wo.defectLiabilityPeriod || "—"}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Date of Completion</span>
                          <p className="font-semibold">{wo.dateOfCompletion || "—"}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Contact Person</span>
                          <p className="font-semibold">{wo.contactPerson || "—"}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Created By</span>
                          <p className="font-semibold">{wo.createdBy || "—"}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">WO Advance</span>
                          <p className="font-semibold">
                            {wo.woAdvanceValue != null && wo.woAdvanceValue > 0
                              ? `${wo.woAdvanceValue}${wo.woAdvanceType === "PERCENTAGE" ? "%" : " (Fixed)"}`
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">WO Retention</span>
                          <p className="font-semibold">
                            {wo.woRetentionValue != null && wo.woRetentionValue > 0
                              ? `${wo.woRetentionValue}${wo.woRetentionType === "PERCENTAGE" ? "%" : " (Fixed)"}`
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Created At</span>
                          <p className="font-semibold">{wo.createdAt || "—"}</p>
                        </div>
                      </div>

                      {wo.workOrderTitle && (
                        <div className="mb-3">
                          <span className="text-gray-400 text-xs">Work Order Title</span>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{wo.workOrderTitle}</p>
                        </div>
                      )}

                      {wo.termsAndConditions && (
                        <div className="mb-3">
                          <span className="text-gray-400 text-xs">Terms & Conditions</span>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{wo.termsAndConditions}</p>
                        </div>
                      )}

                      {wo.remarks && (
                        <p className="text-xs text-gray-500 mb-3">Remarks: {wo.remarks}</p>
                      )}

                      {/* Items table */}
                      {wo.items && wo.items.length > 0 && (
                        <div className="mb-4 overflow-x-auto">
                          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">#</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Activity</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Description</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">UOM</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Qty</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Rate</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {wo.items.map((item, idx) => (
                                <tr key={item.id ?? idx} className="border-t border-gray-100">
                                  <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                                  <td className="px-3 py-2 font-medium">{item.activityName}</td>
                                  <td className="px-3 py-2 text-gray-600">{item.description || "—"}</td>
                                  <td className="px-3 py-2">{item.uom}</td>
                                  <td className="px-3 py-2 text-right">{item.quantity.toLocaleString("en-IN")}</td>
                                  <td className="px-3 py-2 text-right">{fmt(item.rate)}</td>
                                  <td className="px-3 py-2 text-right font-semibold">{fmt(item.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-gray-300 bg-gray-50">
                                <td colSpan={6} className="px-3 py-2 text-right font-bold text-gray-700">
                                  Total
                                </td>
                                <td className="px-3 py-2 text-right font-bold text-green-600">
                                  {fmt(wo.totalAmount)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="text-xs text-gray-500 font-semibold">Change Status:</label>
                        <select
                          value={wo.status}
                          onChange={(e) => handleStatusChange(wo.id, e.target.value)}
                          className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white font-semibold"
                        >
                          {(["DRAFT", "ISSUED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(wo.id);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Create WO From BOQ Tab (inline form) ─── */}
      {activeTab === "create" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-y-auto flex-1">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Create Work Order</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            {/* 2-column grid: Left & Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ── Left Column ── */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Job / Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.jobId}
                    onChange={(e) => updateFormField("jobId", Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value={0}>-- Select Job --</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name} ({j.projectName})
                      </option>
                    ))}
                  </select>
                  {form.jobId > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Project: {jobs.find((j) => j.id === form.jobId)?.projectName || ""}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Contract Type</label>
                  <select
                    value={form.contractType}
                    onChange={(e) => updateFormField("contractType", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">-- Select --</option>
                    {CONTRACT_TYPES.map((ct) => (
                      <option key={ct} value={ct}>{ct}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date of Completion</label>
                  <input
                    type="date"
                    value={form.dateOfCompletion}
                    onChange={(e) => updateFormField("dateOfCompletion", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">WO Advance</label>
                  <div className="flex gap-2">
                    <select
                      value={form.woAdvanceType}
                      onChange={(e) => updateFormField("woAdvanceType", e.target.value)}
                      className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="PERCENTAGE">%</option>
                      <option value="FIXED">Fixed</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={form.woAdvanceValue || ""}
                      onChange={(e) => updateFormField("woAdvanceValue", Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Value"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">WO Retention</label>
                  <div className="flex gap-2">
                    <select
                      value={form.woRetentionType}
                      onChange={(e) => updateFormField("woRetentionType", e.target.value)}
                      className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="PERCENTAGE">%</option>
                      <option value="FIXED">Fixed</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={form.woRetentionValue || ""}
                      onChange={(e) => updateFormField("woRetentionValue", Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Value"
                    />
                  </div>
                </div>
              </div>

              {/* ── Right Column ── */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Contractor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.contractorId}
                    onChange={(e) => updateFormField("contractorId", Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value={0}>-- Select Contractor --</option>
                    {contractors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    WO Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.woDate}
                    onChange={(e) => updateFormField("woDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Work Duration</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={form.workDuration || ""}
                      onChange={(e) => updateFormField("workDuration", Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-500 font-medium">Days</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Defect Liability Period</label>
                  <input
                    type="text"
                    value={form.defectLiabilityPeriod}
                    onChange={(e) => updateFormField("defectLiabilityPeriod", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="e.g. 12 Months"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={(e) => updateFormField("contactPerson", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Contact person name"
                  />
                </div>
              </div>
            </div>

            {/* Work Order Title - full width */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Work Order Title</label>
              <textarea
                value={form.workOrderTitle}
                onChange={(e) => updateFormField("workOrderTitle", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                placeholder="Work order title / scope description"
              />
            </div>

            {/* Start / End Date row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateFormField("startDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => updateFormField("endDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Terms & Remarks */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Terms & Conditions</label>
              <textarea
                value={form.termsAndConditions}
                onChange={(e) => updateFormField("termsAndConditions", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Remarks</label>
              <textarea
                value={form.remarks}
                onChange={(e) => updateFormField("remarks", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              />
            </div>

            {/* Line Items */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Line Items
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 w-[200px]">Activity</th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Description</th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 w-[80px]">UOM</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-[90px]">Qty</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-[100px]">Rate</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-[110px]">Amount</th>
                      <th className="px-2 py-2 w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="px-2 py-1.5">
                          <select
                            value={item.activityId}
                            onChange={(e) => handleActivityChange(idx, Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                          >
                            <option value={0}>-- Select --</option>
                            {activities.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                            placeholder="Description"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={item.uom}
                            readOnly
                            className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 text-gray-500"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min={0}
                            value={item.quantity || ""}
                            onChange={(e) => updateLineItem(idx, "quantity", Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min={0}
                            value={item.rate || ""}
                            onChange={(e) => updateLineItem(idx, "rate", Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right text-xs font-semibold text-gray-700">
                          {fmt(rowAmount(item))}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            onClick={() => removeLineItem(idx)}
                            className="text-red-400 hover:text-red-600 text-xs font-bold"
                            title="Remove"
                          >
                            &#10005;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-50">
                      <td colSpan={5} className="px-2 py-2 text-right font-bold text-gray-700 text-sm">
                        Total
                      </td>
                      <td className="px-2 py-2 text-right font-bold text-green-600 text-sm">
                        {fmt(formTotal)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <button
                onClick={addLineItem}
                className="mt-2 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
              >
                + Add Item
              </button>
            </div>
          </div>

          {/* Inline form footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={() => {
                setForm({ ...emptyForm, items: [{ ...emptyLineItem }] });
                setActiveTab("find");
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Work Order"}
            </button>
          </div>
        </div>
      )}

      {/* Create Work Order Modal (quick create from list view) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Create Work Order</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* 2-column grid: Left & Right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ── Left Column ── */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Job / Project <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.jobId}
                      onChange={(e) => updateFormField("jobId", Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value={0}>-- Select Job --</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.name} ({j.projectName})
                        </option>
                      ))}
                    </select>
                    {form.jobId > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Project: {jobs.find((j) => j.id === form.jobId)?.projectName || ""}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Contract Type</label>
                    <select
                      value={form.contractType}
                      onChange={(e) => updateFormField("contractType", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="">-- Select --</option>
                      {CONTRACT_TYPES.map((ct) => (
                        <option key={ct} value={ct}>{ct}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date of Completion</label>
                    <input
                      type="date"
                      value={form.dateOfCompletion}
                      onChange={(e) => updateFormField("dateOfCompletion", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">WO Advance</label>
                    <div className="flex gap-2">
                      <select
                        value={form.woAdvanceType}
                        onChange={(e) => updateFormField("woAdvanceType", e.target.value)}
                        className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                      >
                        <option value="PERCENTAGE">%</option>
                        <option value="FIXED">Fixed</option>
                      </select>
                      <input
                        type="number"
                        min={0}
                        value={form.woAdvanceValue || ""}
                        onChange={(e) => updateFormField("woAdvanceValue", Number(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Value"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">WO Retention</label>
                    <div className="flex gap-2">
                      <select
                        value={form.woRetentionType}
                        onChange={(e) => updateFormField("woRetentionType", e.target.value)}
                        className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                      >
                        <option value="PERCENTAGE">%</option>
                        <option value="FIXED">Fixed</option>
                      </select>
                      <input
                        type="number"
                        min={0}
                        value={form.woRetentionValue || ""}
                        onChange={(e) => updateFormField("woRetentionValue", Number(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Value"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Right Column ── */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Contractor <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.contractorId}
                      onChange={(e) => updateFormField("contractorId", Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value={0}>-- Select Contractor --</option>
                      {contractors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      WO Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.woDate}
                      onChange={(e) => updateFormField("woDate", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Work Duration</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={form.workDuration || ""}
                        onChange={(e) => updateFormField("workDuration", Number(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-500 font-medium">Days</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Defect Liability Period</label>
                    <input
                      type="text"
                      value={form.defectLiabilityPeriod}
                      onChange={(e) => updateFormField("defectLiabilityPeriod", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="e.g. 12 Months"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={form.contactPerson}
                      onChange={(e) => updateFormField("contactPerson", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Contact person name"
                    />
                  </div>
                </div>
              </div>

              {/* Work Order Title - full width */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Work Order Title</label>
                <textarea
                  value={form.workOrderTitle}
                  onChange={(e) => updateFormField("workOrderTitle", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                  placeholder="Work order title / scope description"
                />
              </div>

              {/* Start / End Date row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => updateFormField("startDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => updateFormField("endDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Terms & Remarks */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Terms & Conditions</label>
                <textarea
                  value={form.termsAndConditions}
                  onChange={(e) => updateFormField("termsAndConditions", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Remarks</label>
                <textarea
                  value={form.remarks}
                  onChange={(e) => updateFormField("remarks", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
              </div>

              {/* Line Items */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Line Items
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 w-[200px]">Activity</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Description</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 w-[80px]">UOM</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-[90px]">Qty</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-[100px]">Rate</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-[110px]">Amount</th>
                        <th className="px-2 py-2 w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, idx) => (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="px-2 py-1.5">
                            <select
                              value={item.activityId}
                              onChange={(e) => handleActivityChange(idx, Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                            >
                              <option value={0}>-- Select --</option>
                              {activities.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                              placeholder="Description"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={item.uom}
                              readOnly
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 text-gray-500"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min={0}
                              value={item.quantity || ""}
                              onChange={(e) => updateLineItem(idx, "quantity", Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min={0}
                              value={item.rate || ""}
                              onChange={(e) => updateLineItem(idx, "rate", Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-right text-xs font-semibold text-gray-700">
                            {fmt(rowAmount(item))}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <button
                              onClick={() => removeLineItem(idx)}
                              className="text-red-400 hover:text-red-600 text-xs font-bold"
                              title="Remove"
                            >
                              &#10005;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300 bg-gray-50">
                        <td colSpan={5} className="px-2 py-2 text-right font-bold text-gray-700 text-sm">
                          Total
                        </td>
                        <td className="px-2 py-2 text-right font-bold text-green-600 text-sm">
                          {fmt(formTotal)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <button
                  onClick={addLineItem}
                  className="mt-2 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                >
                  + Add Item
                </button>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
