import { useState, useEffect } from "react";
import { materialBOQService } from "../services/materialBOQService";
import type { MaterialBOQDto, CreateMaterialBOQRequest } from "../services/materialBOQService";
import { materialMasterService } from "../services/materialService";
import type { MaterialMasterDto } from "../services/materialService";
import { projectService } from "../services/projectService";
import type { ProjectDto } from "../services/projectService";

const emptyForm: CreateMaterialBOQRequest = {
  projectId: 0,
  unitName: "",
  materialId: 0,
  boqQuantity: 0,
  wastagePercent: undefined,
  remarks: "",
};

export default function MaterialBOQPage() {
  const [boqs, setBoqs] = useState<MaterialBOQDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [materials, setMaterials] = useState<MaterialMasterDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterProjectId, setFilterProjectId] = useState<number>(0);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingBoq, setEditingBoq] = useState<MaterialBOQDto | null>(null);
  const [form, setForm] = useState<CreateMaterialBOQRequest>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProjects();
    loadMaterials();
    loadBoqs();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectService.getActiveProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  const loadMaterials = async () => {
    try {
      const data = await materialMasterService.getAll();
      setMaterials(data);
    } catch (err) {
      console.error("Failed to load materials:", err);
    }
  };

  const loadBoqs = async () => {
    setLoading(true);
    try {
      const data = filterProjectId
        ? await materialBOQService.getByProject(filterProjectId)
        : await materialBOQService.getAll();
      setBoqs(data);
    } catch (err) {
      console.error("Failed to load BOQs:", err);
      setBoqs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBoqs();
  }, [filterProjectId]);

  const openCreate = () => {
    setEditingBoq(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (b: MaterialBOQDto) => {
    setEditingBoq(b);
    setForm({
      projectId: b.projectId,
      unitName: b.unitName || "",
      materialId: b.materialId,
      boqQuantity: b.boqQuantity,
      wastagePercent: b.wastagePercent,
      remarks: b.remarks || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.projectId || !form.materialId || !form.boqQuantity) {
      alert("Project, Material, and BOQ Quantity are required.");
      return;
    }
    setSaving(true);
    try {
      if (editingBoq) {
        await materialBOQService.update(editingBoq.id, form);
      } else {
        await materialBOQService.create(form);
      }
      setShowModal(false);
      loadBoqs();
    } catch (err: any) {
      alert("Failed to save BOQ.\n" + (err.message || err));
    }
    setSaving(false);
  };

  const handleApprove = async (id: number) => {
    try {
      await materialBOQService.approve(id);
      loadBoqs();
    } catch (err: any) {
      alert("Failed to approve BOQ.\n" + (err.message || err));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this BOQ entry?")) return;
    try {
      await materialBOQService.delete(id);
      loadBoqs();
    } catch (err: any) {
      alert("Failed to delete BOQ.\n" + (err.message || err));
    }
  };

  const getStatusBadge = (status?: string) => {
    if (status === "APPROVED") {
      return (
        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
          Approved
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
        {status || "Draft"}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Material BOQ</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          + Add BOQ Entry
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Filter by Project</label>
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value={0}>All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-gray-500">
          {boqs.length} BOQ entr{boqs.length !== 1 ? "ies" : "y"} found
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : boqs.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          No BOQ entries found. Click "Add BOQ Entry" to create one.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Project</th>
                  <th className="text-left px-4 py-3 font-medium">Unit</th>
                  <th className="text-left px-4 py-3 font-medium">Material</th>
                  <th className="text-right px-4 py-3 font-medium">BOQ Qty</th>
                  <th className="text-right px-4 py-3 font-medium">Wastage %</th>
                  <th className="text-right px-4 py-3 font-medium">Effective Qty</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {boqs.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                        {b.projectName || `Project #${b.projectId}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{b.unitName || "—"}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {b.materialName || `Material #${b.materialId}`}
                      {b.materialUom && (
                        <span className="ml-1 text-xs text-gray-400">({b.materialUom})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      {b.boqQuantity.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {b.wastagePercent != null ? `${b.wastagePercent}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      {b.effectiveQuantity != null
                        ? b.effectiveQuantity.toLocaleString("en-IN", { maximumFractionDigits: 2 })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(b.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(b)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3"
                      >
                        Edit
                      </button>
                      {b.status !== "APPROVED" && (
                        <button
                          onClick={() => handleApprove(b.id)}
                          className="text-green-600 hover:text-green-800 text-xs font-medium mr-3"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingBoq ? "Edit BOQ Entry" : "Add BOQ Entry"}
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.projectId}
                    onChange={(e) => setForm((prev) => ({ ...prev, projectId: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value={0}>-- Select Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Unit Name</label>
                  <input
                    type="text"
                    value={form.unitName || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, unitName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="e.g. Block-A, Villa-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Material <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.materialId}
                  onChange={(e) => setForm((prev) => ({ ...prev, materialId: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value={0}>-- Select Material --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.uom})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    BOQ Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.boqQuantity || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, boqQuantity: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Wastage %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.wastagePercent ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        wastagePercent: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="e.g. 5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Remarks</label>
                <textarea
                  value={form.remarks || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
              </div>
            </div>

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
                {saving ? "Saving..." : editingBoq ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
