import { useState, useEffect } from "react";
import { mapCostHeadService, costingStandardHeadService, costingCustomHeadService } from "../services/costingService";
import type { MapCostHeadDto, CostingStandardHeadDto, CostingCustomHeadDto } from "../services/costingService";
import { jobService } from "../services/jobService";
import type { JobDto } from "../services/jobService";
import { activityMasterService } from "../services/activityService";
import type { ActivityMasterDto } from "../services/activityService";

interface FormState {
  jobId: number | "";
  activityId: number | "";
  standardHeadId: number | "";
  customHeadId: number | "" | null;
  active: boolean;
}

const emptyForm: FormState = {
  jobId: "",
  activityId: "",
  standardHeadId: "",
  customHeadId: "",
  active: true,
};

export default function MapCostHeadPage() {
  const [items, setItems] = useState<MapCostHeadDto[]>([]);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [activities, setActivities] = useState<ActivityMasterDto[]>([]);
  const [standardHeads, setStandardHeads] = useState<CostingStandardHeadDto[]>([]);
  const [customHeads, setCustomHeads] = useState<CostingCustomHeadDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobFilter, setJobFilter] = useState<number | "">("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MapCostHeadDto | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    jobService.getAll().then(setJobs).catch(() => setJobs([]));
    activityMasterService.getActive().then(setActivities).catch(() => setActivities([]));
    costingStandardHeadService.getActive().then(setStandardHeads).catch(() => setStandardHeads([]));
    costingCustomHeadService.getAll().then(setCustomHeads).catch(() => setCustomHeads([]));
    loadItems();
  }, []);

  useEffect(() => {
    loadItems();
  }, [jobFilter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = jobFilter
        ? await mapCostHeadService.getByJob(Number(jobFilter))
        : await mapCostHeadService.getAll();
      setItems(data);
    } catch (err) {
      console.error("Failed to load mappings:", err);
      setItems([]);
    }
    setLoading(false);
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (item: MapCostHeadDto) => {
    setEditingItem(item);
    setForm({
      jobId: item.jobId,
      activityId: item.activityId,
      standardHeadId: item.standardHeadId,
      customHeadId: item.customHeadId ?? "",
      active: item.active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.jobId) {
      alert("Job is required.");
      return;
    }
    if (!form.activityId) {
      alert("Activity is required.");
      return;
    }
    if (!form.standardHeadId) {
      alert("Standard Head is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        jobId: Number(form.jobId),
        activityId: Number(form.activityId),
        standardHeadId: Number(form.standardHeadId),
        customHeadId: form.customHeadId ? Number(form.customHeadId) : null,
        active: form.active,
      };
      if (editingItem) {
        await mapCostHeadService.update(editingItem.id, payload);
      } else {
        await mapCostHeadService.create(payload);
      }
      setShowModal(false);
      loadItems();
    } catch (err: any) {
      alert("Failed to save.\n" + (err.message || err));
    }
    setSaving(false);
  };

  const handleToggleActive = async (item: MapCostHeadDto) => {
    try {
      await mapCostHeadService.toggleActive(item.id);
      loadItems();
    } catch (err: any) {
      alert("Failed to toggle status.\n" + (err.message || err));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this mapping?")) return;
    try {
      await mapCostHeadService.delete(id);
      loadItems();
    } catch (err: any) {
      alert("Failed to delete.\n" + (err.message || err));
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Map Cost Heads</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          + Add Mapping
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[250px]">
            <label className="block text-xs text-gray-500 mb-1">Filter by Job</label>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Jobs</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.name} ({j.projectName})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-gray-500">
          {items.length} mapping{items.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Items list */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No cost head mappings found.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Summary row */}
              <div
                className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex-1 min-w-[120px]">
                  <p className="text-sm font-bold text-gray-800">{item.jobName}</p>
                  <p className="text-xs text-gray-400">Job</p>
                </div>
                <div className="w-36">
                  <p className="text-sm text-gray-700">{item.activityName}</p>
                  <p className="text-xs text-gray-400">Activity</p>
                </div>
                <div className="w-36">
                  <p className="text-sm text-gray-700">{item.standardHeadName}</p>
                  <p className="text-xs text-gray-400">Standard Head</p>
                </div>
                <div className="w-36">
                  <p className="text-sm text-gray-700">{item.customHeadName || "—"}</p>
                  <p className="text-xs text-gray-400">Custom Head</p>
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
                      <span className="text-gray-400 text-xs">Job</span>
                      <p className="font-semibold">{item.jobName}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Activity</span>
                      <p className="font-semibold">{item.activityName}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Standard Head</span>
                      <p className="font-semibold">{item.standardHeadName}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Custom Head</span>
                      <p className="font-semibold">{item.customHeadName || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Created By</span>
                      <p className="font-semibold">{item.createdBy || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Created At</span>
                      <p className="font-semibold">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</p>
                    </div>
                  </div>
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
                {editingItem ? "Edit Mapping" : "Add Mapping"}
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Job <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.jobId}
                  onChange={(e) => setForm((prev) => ({ ...prev, jobId: e.target.value ? Number(e.target.value) : "" }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Select Job</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.name} ({j.projectName})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Activity <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.activityId}
                  onChange={(e) => setForm((prev) => ({ ...prev, activityId: e.target.value ? Number(e.target.value) : "" }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Select Activity</option>
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.uom})</option>
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
              <div>
                <label className="block text-xs text-gray-500 mb-1">Custom Head (optional)</label>
                <select
                  value={form.customHeadId ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, customHeadId: e.target.value ? Number(e.target.value) : "" }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">None</option>
                  {customHeads.map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.name} ({ch.projectName})</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mapcost-active"
                  checked={form.active}
                  onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="mapcost-active" className="text-sm text-gray-700">Active</label>
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
