import { useState, useEffect } from "react";
import { requisitionService } from "../services/requisitionService";
import type {
  MaterialRequisitionDto,
  CreateRequisitionRequest,
} from "../services/requisitionService";
import { projectService } from "../services/projectService";
import type { ProjectDto } from "../services/projectService";
import { materialMasterService } from "../services/materialService";
import type { MaterialMasterDto } from "../services/materialService";

const STATUS_LIST = ["All", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] as const;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

interface LineItem {
  materialId: number;
  requiredQuantity: number;
  remarks: string;
}

const emptyLineItem: LineItem = { materialId: 0, requiredQuantity: 0, remarks: "" };

interface ReqForm {
  projectId: number;
  requisitionDate: string;
  requiredDate: string;
  remarks: string;
  items: LineItem[];
}

const emptyForm: ReqForm = {
  projectId: 0,
  requisitionDate: "",
  requiredDate: "",
  remarks: "",
  items: [{ ...emptyLineItem }],
};

export default function RequisitionPage() {
  const [records, setRecords] = useState<MaterialRequisitionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [materials, setMaterials] = useState<MaterialMasterDto[]>([]);
  const [form, setForm] = useState<ReqForm>({ ...emptyForm, items: [{ ...emptyLineItem }] });

  useEffect(() => {
    loadData();
    loadDropdowns();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await requisitionService.getAll();
      setRecords(data);
    } catch (err) {
      console.error("Failed to load requisitions:", err);
      setRecords([]);
    }
    setLoading(false);
  };

  const loadDropdowns = async () => {
    try {
      const [p, m] = await Promise.all([
        projectService.getActiveProjects(),
        materialMasterService.getActive(),
      ]);
      setProjects(p);
      setMaterials(m);
    } catch (err) {
      console.error("Failed to load dropdowns:", err);
    }
  };

  const filtered = records.filter((r) => {
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    if (projectFilter && r.projectId !== projectFilter) return false;
    return true;
  });

  const openCreate = () => {
    setForm({ ...emptyForm, items: [{ ...emptyLineItem }] });
    setShowModal(true);
  };

  const updateField = (field: keyof Omit<ReqForm, "items">, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, { ...emptyLineItem }] }));

  const removeItem = (idx: number) => {
    setForm((prev) => {
      const items = prev.items.filter((_, i) => i !== idx);
      return { ...prev, items: items.length > 0 ? items : [{ ...emptyLineItem }] };
    });
  };

  const handleSave = async () => {
    if (!form.projectId) { alert("Please select a Project."); return; }
    if (!form.requisitionDate) { alert("Requisition Date is required."); return; }
    const validItems = form.items.filter((it) => it.materialId > 0 && it.requiredQuantity > 0);
    if (validItems.length === 0) { alert("At least one valid item is required."); return; }

    setSaving(true);
    try {
      const req: CreateRequisitionRequest = {
        projectId: form.projectId,
        requisitionDate: form.requisitionDate,
        requiredDate: form.requiredDate || undefined,
        remarks: form.remarks || undefined,
        items: validItems.map((it) => ({
          materialId: it.materialId,
          requiredQuantity: it.requiredQuantity,
          remarks: it.remarks || undefined,
        })),
      };
      await requisitionService.create(req);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert("Failed to create requisition.\n" + (err.message || err));
    }
    setSaving(false);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await requisitionService.updateStatus(id, newStatus);
      loadData();
    } catch (err: any) {
      alert("Failed to update status.\n" + (err.message || err));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this requisition?")) return;
    try {
      await requisitionService.delete(id);
      loadData();
    } catch (err: any) {
      alert("Failed to delete.\n" + (err.message || err));
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Material Requisitions</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
          + New Requisition
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-1 flex-wrap">
            {STATUS_LIST.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {s === "All" ? "All" : s}
              </button>
            ))}
          </div>
          <select value={projectFilter} onChange={(e) => setProjectFilter(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value={0}>All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-3">{filtered.length} requisition{filtered.length !== 1 ? "s" : ""} found</p>

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No requisitions found.</div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-bold text-gray-800">{r.requisitionNo}</p>
                  <p className="text-xs text-gray-400">{r.projectName}</p>
                </div>
                <div className="w-28">
                  <p className="text-xs text-gray-400">Date</p>
                  <p className="text-sm text-gray-700">{r.requisitionDate}</p>
                </div>
                <div className="w-28">
                  <p className="text-xs text-gray-400">Required</p>
                  <p className="text-sm text-gray-700">{r.requiredDate || "—"}</p>
                </div>
                <div className="w-20">
                  <p className="text-xs text-gray-400">Items</p>
                  <p className="text-sm font-semibold text-gray-700">{r.items?.length || 0}</p>
                </div>
                <div className="w-24">
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-700"}`}>{r.status}</span>
                </div>
                <span className={`text-xs font-bold transition-transform ${expandedId === r.id ? "rotate-90" : ""}`}>&#9654;</span>
              </div>

              {expandedId === r.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  {r.remarks && <p className="text-xs text-gray-500 mb-3">Remarks: {r.remarks}</p>}

                  {r.items && r.items.length > 0 && (
                    <div className="mb-4 overflow-x-auto">
                      <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">#</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Material</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">UOM</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Required Qty</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Approved Qty</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.items.map((item, idx) => (
                            <tr key={item.id ?? idx} className="border-t border-gray-100">
                              <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                              <td className="px-3 py-2 font-medium">{item.materialName}</td>
                              <td className="px-3 py-2">{item.materialUom || "—"}</td>
                              <td className="px-3 py-2 text-right">{item.requiredQuantity}</td>
                              <td className="px-3 py-2 text-right">{item.approvedQuantity ?? "—"}</td>
                              <td className="px-3 py-2 text-gray-500">{item.remarks || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {r.status === "DRAFT" && (
                      <button onClick={() => handleStatusChange(r.id, "SUBMITTED")} className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">Submit</button>
                    )}
                    {r.status === "SUBMITTED" && (
                      <>
                        <button onClick={() => handleStatusChange(r.id, "APPROVED")} className="px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-600 rounded-lg hover:bg-green-100">Approve</button>
                        <button onClick={() => handleStatusChange(r.id, "REJECTED")} className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Reject</button>
                      </>
                    )}
                    {r.status === "DRAFT" && (
                      <button onClick={() => handleDelete(r.id)} className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Delete</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Create Requisition</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Project <span className="text-red-500">*</span></label>
                  <select value={form.projectId} onChange={(e) => updateField("projectId", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value={0}>-- Select Project --</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Requisition Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.requisitionDate} onChange={(e) => updateField("requisitionDate", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Required Date</label>
                  <input type="date" value={form.requiredDate} onChange={(e) => updateField("requiredDate", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Remarks</label>
                  <input type="text" value={form.remarks} onChange={(e) => updateField("remarks", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Remarks" />
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 w-[250px]">Material</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-[120px]">Required Qty</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Remarks</th>
                        <th className="px-2 py-2 w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, idx) => (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="px-2 py-1.5">
                            <select value={item.materialId} onChange={(e) => updateItem(idx, "materialId", Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white">
                              <option value={0}>-- Select --</option>
                              {materials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.uom})</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" min={0} value={item.requiredQuantity || ""} onChange={(e) => updateItem(idx, "requiredQuantity", Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="text" value={item.remarks} onChange={(e) => updateItem(idx, "remarks", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs" placeholder="Remarks" />
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs font-bold" title="Remove">&#10005;</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={addItem} className="mt-2 px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">+ Add Item</button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
