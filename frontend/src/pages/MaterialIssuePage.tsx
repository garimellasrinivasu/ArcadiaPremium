import { useState, useEffect } from "react";
import { materialIssueService } from "../services/materialIssueService";
import type { MaterialIssueDto, CreateMaterialIssueRequest } from "../services/materialIssueService";
import { projectService } from "../services/projectService";
import type { ProjectDto } from "../services/projectService";
import { materialMasterService } from "../services/materialService";
import type { MaterialMasterDto } from "../services/materialService";

interface LineItem {
  materialId: number;
  issueQty: number;
  remarks: string;
}

const emptyLineItem: LineItem = { materialId: 0, issueQty: 0, remarks: "" };

interface IssueForm {
  projectId: number;
  issueDate: string;
  issuedToEmployee: string;
  issuedToContractor: string;
  issuedToType: string;
  remarks: string;
  items: LineItem[];
}

const emptyForm: IssueForm = {
  projectId: 0,
  issueDate: "",
  issuedToEmployee: "",
  issuedToContractor: "",
  issuedToType: "EMPLOYEE",
  remarks: "",
  items: [{ ...emptyLineItem }],
};

export default function MaterialIssuePage() {
  const [records, setRecords] = useState<MaterialIssueDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectFilter, setProjectFilter] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [materials, setMaterials] = useState<MaterialMasterDto[]>([]);
  const [form, setForm] = useState<IssueForm>({ ...emptyForm, items: [{ ...emptyLineItem }] });

  useEffect(() => { loadData(); loadDropdowns(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { setRecords(await materialIssueService.getAll()); } catch (err) { console.error(err); setRecords([]); }
    setLoading(false);
  };

  const loadDropdowns = async () => {
    try {
      const [p, m] = await Promise.all([projectService.getActiveProjects(), materialMasterService.getActive()]);
      setProjects(p);
      setMaterials(m);
    } catch (err) { console.error(err); }
  };

  const filtered = records.filter((r) => {
    if (projectFilter && r.projectId !== projectFilter) return false;
    return true;
  });

  const openCreate = () => { setForm({ ...emptyForm, items: [{ ...emptyLineItem }] }); setShowModal(true); };

  const updateField = (field: keyof Omit<IssueForm, "items">, value: string | number) => {
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
    if (!form.issueDate) { alert("Issue Date is required."); return; }
    if (form.issuedToType === "EMPLOYEE" && !form.issuedToEmployee) { alert("Issued To (Employee) is required."); return; }
    if (form.issuedToType === "CONTRACTOR" && !form.issuedToContractor) { alert("Issued To (Contractor) is required."); return; }
    const validItems = form.items.filter((it) => it.materialId > 0 && it.issueQty > 0);
    if (validItems.length === 0) { alert("At least one valid item is required."); return; }

    setSaving(true);
    try {
      const req: CreateMaterialIssueRequest = {
        projectId: form.projectId,
        issueDate: form.issueDate,
        issuedTo: form.issuedToType === "EMPLOYEE" ? form.issuedToEmployee : form.issuedToContractor,
        issuedToType: form.issuedToType,
        remarks: form.remarks || undefined,
        items: validItems.map((it) => ({
          materialId: it.materialId,
          issuedQuantity: it.issueQty,
          remarks: it.remarks || undefined,
        })),
      };
      await materialIssueService.create(req);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert("Failed to create material issue.\n" + (err.message || err));
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    try { await materialIssueService.delete(id); loadData(); }
    catch (err: any) { alert("Failed to delete.\n" + (err.message || err)); }
  };

  const getIssuedTo = (r: MaterialIssueDto) => {
    return r.issuedTo || "—";
  };

  const getIssueType = (r: MaterialIssueDto) => {
    return r.issuedToType || "—";
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Material Issues</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">+ New Issue</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <select value={projectFilter} onChange={(e) => setProjectFilter(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value={0}>All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-3">{filtered.length} issue{filtered.length !== 1 ? "s" : ""} found</p>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No material issues found.</div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-bold text-gray-800">{r.issueNo}</p>
                  <p className="text-xs text-gray-400">{r.projectName}</p>
                </div>
                <div className="w-28">
                  <p className="text-xs text-gray-400">Date</p>
                  <p className="text-sm text-gray-700">{r.issueDate}</p>
                </div>
                <div className="w-36">
                  <p className="text-xs text-gray-400">Issued To</p>
                  <p className="text-sm text-gray-700">{getIssuedTo(r)}</p>
                </div>
                <div className="w-24">
                  <p className="text-xs text-gray-400">Type</p>
                  <p className="text-sm text-gray-700">{getIssueType(r)}</p>
                </div>
                <div className="w-20">
                  <p className="text-xs text-gray-400">Items</p>
                  <p className="text-sm font-semibold text-gray-700">{r.items?.length || 0}</p>
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
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Issue Qty</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Stock Qty</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.items.map((item, idx) => (
                            <tr key={item.id ?? idx} className="border-t border-gray-100">
                              <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                              <td className="px-3 py-2 font-medium">{item.materialName}</td>
                              <td className="px-3 py-2">{item.materialUom || "—"}</td>
                              <td className="px-3 py-2 text-right">{Number(item.issuedQuantity)}</td>
                              <td className="px-3 py-2 text-right">—</td>
                              <td className="px-3 py-2 text-gray-500">{item.remarks || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => handleDelete(r.id)} className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Delete</button>
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
              <h2 className="text-lg font-bold text-gray-800">Create Material Issue</h2>
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
                  <label className="block text-xs text-gray-500 mb-1">Issue Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.issueDate} onChange={(e) => updateField("issueDate", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Issued To Type <span className="text-red-500">*</span></label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-1.5 text-sm">
                      <input type="radio" value="EMPLOYEE" checked={form.issuedToType === "EMPLOYEE"} onChange={(e) => updateField("issuedToType", e.target.value)} />
                      Employee
                    </label>
                    <label className="flex items-center gap-1.5 text-sm">
                      <input type="radio" value="CONTRACTOR" checked={form.issuedToType === "CONTRACTOR"} onChange={(e) => updateField("issuedToType", e.target.value)} />
                      Contractor
                    </label>
                  </div>
                </div>
                <div>
                  {form.issuedToType === "EMPLOYEE" ? (
                    <>
                      <label className="block text-xs text-gray-500 mb-1">Employee Name <span className="text-red-500">*</span></label>
                      <input type="text" value={form.issuedToEmployee} onChange={(e) => updateField("issuedToEmployee", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Employee Name" />
                    </>
                  ) : (
                    <>
                      <label className="block text-xs text-gray-500 mb-1">Contractor Name <span className="text-red-500">*</span></label>
                      <input type="text" value={form.issuedToContractor} onChange={(e) => updateField("issuedToContractor", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Contractor Name" />
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Remarks</label>
                <input type="text" value={form.remarks} onChange={(e) => updateField("remarks", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Remarks" />
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 w-[250px]">Material</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-[120px]">Issue Qty</th>
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
                            <input type="number" min={0} value={item.issueQty || ""} onChange={(e) => updateItem(idx, "issueQty", Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right" />
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
