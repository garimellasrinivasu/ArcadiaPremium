import { useState, useEffect } from "react";
import { costingCustomHeadService, costingStandardHeadService } from "../services/costingService";
import type { CostingCustomHeadDto, CostingStandardHeadDto } from "../services/costingService";
import api from "../services/api";

interface ProjectOption {
  id: number;
  name: string;
}

interface FormState {
  name: string;
  description: string;
  projectId: number | "";
  standardHeadId: number | "";
  active: boolean;
}

const emptyForm: FormState = {
  name: "",
  description: "",
  projectId: "",
  standardHeadId: "",
  active: true,
};

export default function CostingCustomHeadPage() {
  const [items, setItems] = useState<CostingCustomHeadDto[]>([]);
  const [standardHeads, setStandardHeads] = useState<CostingStandardHeadDto[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<number | "">("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CostingCustomHeadDto | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/projects").then((res) => setProjects(res.data)).catch(() => setProjects([]));
    costingStandardHeadService.getActive().then(setStandardHeads).catch(() => setStandardHeads([]));
    loadItems();
  }, []);

  useEffect(() => {
    loadItems();
  }, [projectFilter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = projectFilter
        ? await costingCustomHeadService.getByProject(Number(projectFilter))
        : await costingCustomHeadService.getAll();
      setItems(data);
    } catch (err) {
      console.error("Failed to load custom heads:", err);
      setItems([]);
    }
    setLoading(false);
  };

  const filtered = items.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const openCreate = () => {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (item: CostingCustomHeadDto) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description || "",
      projectId: item.projectId,
      standardHeadId: item.standardHeadId,
      active: item.active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Name is required.");
      return;
    }
    if (!form.projectId) {
      alert("Project is required.");
      return;
    }
    if (!form.standardHeadId) {
      alert("Standard Head is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        projectId: Number(form.projectId),
        standardHeadId: Number(form.standardHeadId),
        active: form.active,
      };
      if (editingItem) {
        await costingCustomHeadService.update(editingItem.id, payload);
      } else {
        await costingCustomHeadService.create(payload);
      }
      setShowModal(false);
      loadItems();
    } catch (err: any) {
      alert("Failed to save.\n" + (err.message || err));
    }
    setSaving(false);
  };

  const handleToggleActive = async (item: CostingCustomHeadDto) => {
    try {
      await costingCustomHeadService.toggleActive(item.id);
      loadItems();
    } catch (err: any) {
      alert("Failed to toggle status.\n" + (err.message || err));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this custom head?")) return;
    try {
      await costingCustomHeadService.delete(id);
      loadItems();
    } catch (err: any) {
      alert("Failed to delete.\n" + (err.message || err));
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Costing Custom Heads</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          + Add Custom Head
        </button>
      </div>

      {/* Search / Filter bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="min-w-[200px]">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Projects</option>
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
          {filtered.length} head{filtered.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Items list */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No custom heads found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Summary row */}
              <div
                className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-bold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.code}</p>
                </div>
                <div className="w-36">
                  <p className="text-xs text-gray-400">Standard Head</p>
                  <p className="text-sm text-gray-700">{item.standardHeadName || "—"}</p>
                </div>
                <div className="w-36">
                  <p className="text-xs text-gray-400">Project</p>
                  <p className="text-sm text-gray-700">{item.projectName || "—"}</p>
                </div>
                <div className="w-16">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                      item.active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {item.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold transition-transform ${
                    expandedId === item.id ? "rotate-90" : ""
                  }`}
                >
                  &#9654;
                </span>
              </div>

              {/* Expanded details */}
              {expandedId === item.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-400 text-xs">Code</span>
                      <p className="font-semibold">{item.code}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Standard Head</span>
                      <p className="font-semibold">{item.standardHeadName || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Project</span>
                      <p className="font-semibold">{item.projectName || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Created By</span>
                      <p className="font-semibold">{item.createdBy || "—"}</p>
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500 mb-3">Description: {item.description}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleActive(item); }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                        item.active
                          ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {item.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingItem ? "Edit Custom Head" : "Add Custom Head"}
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Custom head name"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.projectId}
                    onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value ? Number(e.target.value) : "" }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Standard Head <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.standardHeadId}
                    onChange={(e) => setForm((prev) => ({ ...prev, standardHeadId: e.target.value ? Number(e.target.value) : "" }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">Select Standard Head</option>
                    {standardHeads.map((sh) => (
                      <option key={sh.id} value={sh.id}>{sh.name} ({sh.category})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="custhead-active"
                  checked={form.active}
                  onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="custhead-active" className="text-sm text-gray-700">Active</label>
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
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
