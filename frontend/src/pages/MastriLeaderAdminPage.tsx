import { useState, useEffect } from "react";
import {
  mastriLeaderService,
  type MastriLeaderDto,
} from "../services/mastriLeaderService";

export default function MastriLeaderAdminPage() {
  const [leaders, setLeaders] = useState<MastriLeaderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formActive, setFormActive] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await mastriLeaderService.getAll();
      setLeaders(data);
    } catch (e: any) {
      setError(
        e.response?.data?.message || e.message || "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormName("");
    setFormPhone("");
    setFormActive(true);
    setEditingId(null);
    setShowModal(false);
  }

  function openAdd() {
    resetForm();
    setShowModal(true);
  }

  function openEdit(leader: MastriLeaderDto) {
    setFormName(leader.name);
    setFormPhone(leader.phone || "");
    setFormActive(leader.active);
    setEditingId(leader.id);
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!formName.trim()) {
      setError("Name is required");
      return;
    }

    try {
      setError("");
      if (editingId) {
        await mastriLeaderService.update(editingId, {
          name: formName.trim(),
          phone: formPhone.trim() || undefined,
          active: formActive,
        });
      } else {
        await mastriLeaderService.create({
          name: formName.trim(),
          phone: formPhone.trim() || undefined,
        });
      }
      resetForm();
      await loadData();
    } catch (e: any) {
      setError(
        e.response?.data?.message || e.message || "Failed to save leader"
      );
    }
  }

  async function handleDelete(leader: MastriLeaderDto) {
    if (
      !confirm(
        `Are you sure you want to deactivate "${leader.name}"?`
      )
    )
      return;
    try {
      setError("");
      await mastriLeaderService.delete(leader.id);
      await loadData();
    } catch (e: any) {
      setError(
        e.response?.data?.message || e.message || "Failed to deactivate leader"
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arcadia-600" />
        <span className="ml-3 text-gray-600">Loading mastri leaders...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mastri Leaders</h1>
        <button
          onClick={openAdd}
          className="bg-arcadia-600 text-white px-4 py-2 rounded-lg hover:bg-arcadia-700 transition text-sm font-medium"
        >
          + Add Mastri Leader
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <button
            onClick={() => setError("")}
            className="float-right text-red-500 hover:text-red-700"
          >
            &times;
          </button>
        </div>
      )}

      {/* Table */}
      {leaders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl text-gray-300 mb-3">&#128100;</div>
          <p className="text-gray-500 mb-2">No mastri leaders added yet.</p>
          <p className="text-sm text-gray-400">
            Click "+ Add Mastri Leader" to create one.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaders.map((leader) => (
                <tr
                  key={leader.id}
                  className={leader.active ? "" : "opacity-50"}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {leader.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {leader.phone || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {leader.active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => openEdit(leader)}
                      className="text-sm text-arcadia-600 hover:text-arcadia-800 font-medium mr-4"
                    >
                      Edit
                    </button>
                    {leader.active && (
                      <button
                        onClick={() => handleDelete(leader)}
                        className="text-sm text-red-500 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={resetForm}
          />

          {/* Modal content */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? "Edit Mastri Leader" : "Add Mastri Leader"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500"
                  placeholder="Enter leader name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500"
                  placeholder="Enter phone number (optional)"
                />
              </div>

              {editingId && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="h-4 w-4 text-arcadia-600 rounded"
                    id="leaderActive"
                  />
                  <label
                    htmlFor="leaderActive"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Active
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                className="bg-arcadia-600 text-white px-5 py-2 rounded-lg hover:bg-arcadia-700 transition text-sm font-medium"
              >
                {editingId ? "Update" : "Create"}
              </button>
              <button
                onClick={resetForm}
                className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
