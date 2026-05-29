import { useState, useEffect } from "react";
import { warehouseService } from "../services/warehouseService";
import type { WarehouseDto, CreateWarehouseRequest } from "../services/warehouseService";
import { projectService } from "../services/projectService";
import type { ProjectDto } from "../services/projectService";

const emptyForm: CreateWarehouseRequest = {
  name: "",
  projectId: 0,
  location: "",
  description: "",
};

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterProjectId, setFilterProjectId] = useState<number>(0);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseDto | null>(null);
  const [form, setForm] = useState<CreateWarehouseRequest>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProjects();
    loadWarehouses();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectService.getActiveProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const data = filterProjectId
        ? await warehouseService.getByProject(filterProjectId)
        : await warehouseService.getAll();
      setWarehouses(data);
    } catch (err) {
      console.error("Failed to load warehouses:", err);
      setWarehouses([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadWarehouses();
  }, [filterProjectId]);

  const openCreate = () => {
    setEditingWarehouse(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (w: WarehouseDto) => {
    setEditingWarehouse(w);
    setForm({
      name: w.name,
      projectId: w.projectId,
      location: w.location || "",
      description: w.description || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Warehouse name is required.");
      return;
    }
    if (!form.projectId) {
      alert("Please select a project.");
      return;
    }
    setSaving(true);
    try {
      if (editingWarehouse) {
        await warehouseService.update(editingWarehouse.id, form);
      } else {
        await warehouseService.create(form);
      }
      setShowModal(false);
      loadWarehouses();
    } catch (err: any) {
      alert("Failed to save warehouse.\n" + (err.message || err));
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this warehouse?")) return;
    try {
      await warehouseService.delete(id);
      loadWarehouses();
    } catch (err: any) {
      alert("Failed to delete warehouse.\n" + (err.message || err));
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Warehouses</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          + Add Warehouse
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
          {warehouses.length} warehouse{warehouses.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : warehouses.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          No warehouses found. Click "Add Warehouse" to create one.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Project</th>
                <th className="text-left px-4 py-3 font-medium">Location</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {warehouses.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{w.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                      {w.projectName || `Project #${w.projectId}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{w.location || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{w.description || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                        w.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {w.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(w)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
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
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingWarehouse ? "Edit Warehouse" : "Add Warehouse"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Warehouse name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm((prev) => ({ ...prev, projectId: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value={0}>-- Select Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <input
                  value={form.location || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g. Ground floor, Site-A"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={form.description || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.projectId}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingWarehouse ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
