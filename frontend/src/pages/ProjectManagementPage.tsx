import { useState, useEffect, useCallback } from "react";
import {
  projectService,
  type ProjectDto,
  type CreateProjectRequest,
} from "../services/projectService";

export default function ProjectManagementPage() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await projectService.getAllProjects();
      setProjects(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setFormName("");
    setFormDescription("");
    setFormActive(true);
    setError("");
  }

  function startEdit(project: ProjectDto) {
    setEditingId(project.id);
    setFormName(project.name);
    setFormDescription(project.description || "");
    setFormActive(project.active);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formName.trim()) {
      setError("Project name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const req: CreateProjectRequest = {
        name: formName.trim(),
        description: formDescription.trim(),
        active: formActive,
      };
      if (editingId) {
        await projectService.update(editingId, req);
      } else {
        await projectService.create(req);
      }
      resetForm();
      await loadProjects();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project: ProjectDto) {
    if (!confirm(`Are you sure you want to delete "${project.name}"?\n\nThis action cannot be undone.`)) return;
    try {
      setError("");
      await projectService.delete(project.id);
      await loadProjects();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Delete failed");
    }
  }

  async function handleToggleActive(project: ProjectDto) {
    try {
      setError("");
      await projectService.update(project.id, {
        name: project.name,
        description: project.description || "",
        active: !project.active,
      });
      await loadProjects();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Update failed");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-arcadia-800">Project Management</h1>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-arcadia-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-arcadia-700 transition"
          >
            + New Project
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <button onClick={() => setError("")} className="float-right text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? "Edit Project" : "Add New Project"}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Praneeth Green Valley"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-arcadia-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-arcadia-600"></div>
              </label>
              <span className="text-sm text-gray-700">Active</span>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-arcadia-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-arcadia-700 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                onClick={resetForm}
                className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Table */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-arcadia-600" />
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl text-gray-300 mb-4">&#128193;</div>
          <p className="text-gray-500 text-lg">No projects yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "+ New Project" to add your first project.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Project Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Date Added</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Description</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.description || "-"}</td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer transition ${
                        p.active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                      title={p.active ? "Click to deactivate" : "Click to activate"}
                    >
                      {p.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => startEdit(p)}
                        className="text-xs text-arcadia-600 hover:text-arcadia-800 font-medium px-2 py-1 rounded hover:bg-arcadia-50 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
