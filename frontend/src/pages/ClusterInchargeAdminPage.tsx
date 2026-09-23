import { useState, useEffect } from "react";
import {
  clusterInchargeService,
  type ClusterInchargeDto,
} from "../services/clusterInchargeService";
import { ARCADIA_CLUSTERS } from "./MasterPlanPage";

export default function ClusterInchargeAdminPage() {
  const [incharges, setIncharges] = useState<ClusterInchargeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formClusterNumber, setFormClusterNumber] = useState<number>(1);
  const [formInchargeName, setFormInchargeName] = useState("");
  const [formVillaNumbers, setFormVillaNumbers] = useState("");
  const [formActive, setFormActive] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await clusterInchargeService.getAll();
      setIncharges(data);
    } catch (e: any) {
      setError(
        e.response?.data?.message || e.message || "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormClusterNumber(1);
    setFormInchargeName("");
    setFormVillaNumbers("");
    setFormActive(true);
    setEditingId(null);
    setShowModal(false);
  }

  function openAdd() {
    resetForm();
    setShowModal(true);
  }

  function formatVillasMultiline(raw: string): string {
    const nums = raw.split(",").map((v) => v.trim()).filter(Boolean);
    const rows: string[] = [];
    for (let i = 0; i < nums.length; i += 7) {
      rows.push(nums.slice(i, i + 7).join(", "));
    }
    return rows.join(",\n");
  }

  function openEdit(ci: ClusterInchargeDto) {
    setFormClusterNumber(ci.clusterNumber);
    setFormInchargeName(ci.inchargeName);
    setFormVillaNumbers(ci.villaNumbers ? formatVillasMultiline(ci.villaNumbers) : "");
    setFormActive(ci.active);
    setEditingId(ci.id);
    setShowModal(true);
  }

  function handleClusterSelect(clusterNum: number) {
    setFormClusterNumber(clusterNum);
    // Auto-populate villa numbers from ARCADIA_CLUSTERS, formatted in rows of 7
    const cluster = ARCADIA_CLUSTERS[clusterNum - 1];
    if (cluster) {
      const villas = cluster.villas;
      const rows: string[] = [];
      for (let i = 0; i < villas.length; i += 7) {
        rows.push(villas.slice(i, i + 7).join(", "));
      }
      setFormVillaNumbers(rows.join(",\n"));
    }
  }

  async function handleSubmit() {
    if (!formInchargeName.trim()) {
      setError("Incharge Name is required");
      return;
    }

    try {
      setError("");
      if (editingId) {
        await clusterInchargeService.update(editingId, {
          clusterNumber: formClusterNumber,
          inchargeName: formInchargeName.trim(),
          villaNumbers: formVillaNumbers.trim() || undefined,
          active: formActive,
        });
      } else {
        await clusterInchargeService.create({
          clusterNumber: formClusterNumber,
          inchargeName: formInchargeName.trim(),
          villaNumbers: formVillaNumbers.trim() || undefined,
        });
      }
      resetForm();
      await loadData();
    } catch (e: any) {
      setError(
        e.response?.data?.message || e.message || "Failed to save cluster incharge"
      );
    }
  }

  async function handleDelete(ci: ClusterInchargeDto) {
    if (
      !confirm(
        `Are you sure you want to delete "${ci.inchargeName}"? This action cannot be undone.`
      )
    )
      return;
    try {
      setError("");
      await clusterInchargeService.delete(ci.id);
      await loadData();
    } catch (e: any) {
      setError(
        e.response?.data?.message || e.message || "Failed to delete incharge"
      );
    }
  }

  /** Show a short summary of villas, e.g. "1,2,3,...,221 (80)" */
  function villasSummary(villas: string | null): string {
    if (!villas) return "-";
    const arr = villas.split(",").map((v) => v.trim()).filter(Boolean);
    if (arr.length <= 6) return arr.join(", ");
    return `${arr.slice(0, 3).join(", ")},...,${arr.slice(-2).join(", ")} (${arr.length})`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arcadia-600" />
        <span className="ml-3 text-gray-600">Loading cluster incharges...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cluster Incharges</h1>
        <button
          onClick={openAdd}
          className="bg-arcadia-600 text-white px-4 py-2 rounded-lg hover:bg-arcadia-700 transition text-sm font-medium"
        >
          + Add Cluster Incharge
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
      {incharges.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl text-gray-300 mb-3">&#128101;</div>
          <p className="text-gray-500 mb-2">No cluster incharges added yet.</p>
          <p className="text-sm text-gray-400">
            Click "+ Add Cluster Incharge" to create one.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cluster #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incharge Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cluster Villas
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
              {incharges.map((ci) => (
                <tr
                  key={ci.id}
                  className={ci.active ? "" : "opacity-50"}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Cluster {ci.clusterNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ci.inchargeName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={ci.villaNumbers || ""}>
                    {villasSummary(ci.villaNumbers)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ci.active ? (
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
                      onClick={() => openEdit(ci)}
                      className="text-sm text-arcadia-600 hover:text-arcadia-800 font-medium mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ci)}
                      className="text-sm text-red-500 hover:text-red-700 font-medium"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={resetForm}
          />

          {/* Modal content */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? "Edit Cluster Incharge" : "Add Cluster Incharge"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cluster Number <span className="text-red-500">*</span>
                </label>
                <select
                  value={formClusterNumber}
                  onChange={(e) => handleClusterSelect(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500"
                >
                  {ARCADIA_CLUSTERS.map((c, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {c.name} ({c.villas.length} villas)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Incharge Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formInchargeName}
                  onChange={(e) => setFormInchargeName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500"
                  placeholder="Enter incharge name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cluster Villas
                </label>
                <textarea
                  value={formVillaNumbers}
                  onChange={(e) => setFormVillaNumbers(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500"
                  rows={6}
                  placeholder="Comma-separated villa numbers (auto-filled from cluster)"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Villa numbers are auto-populated when you select a cluster. You can edit them if needed.
                </p>
              </div>

              {editingId && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="h-4 w-4 text-arcadia-600 rounded"
                    id="inchargeActive"
                  />
                  <label
                    htmlFor="inchargeActive"
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
