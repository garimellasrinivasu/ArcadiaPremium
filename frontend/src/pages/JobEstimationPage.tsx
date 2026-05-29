import { useState, useEffect } from "react";
import { jobService, jobEstimationService } from "../services/jobService";
import type {
  JobDto,
  JobEstimationDto,
  CreateJobEstimationRequest,
  CreateEstimationDOMRequest,
} from "../services/jobService";
import api from "../services/api";

/* ─── Types ─── */
interface Project {
  id: number;
  name: string;
}

interface Activity {
  id: number;
  name: string;
  uom: string;
}

interface DOMRow {
  description: string;
  nos: string;
  length: string;
  breadth: string;
  height: string;
}

const EMPTY_DOM_ROW: DOMRow = {
  description: "",
  nos: "1",
  length: "0",
  breadth: "0",
  height: "0",
};

/* ─── Helpers ─── */
function fmt(n: number): string {
  if (isNaN(n)) return "0";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function safeParse(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

/** Compute DOM row quantity: nos * L * B * H.
 *  If any dimension is 0 or empty, treat as 1 (allows linear/area measurements). */
function computeDOMQty(row: DOMRow): number {
  const nos = safeParse(row.nos) || 1;
  const l = safeParse(row.length) || 1;
  const b = safeParse(row.breadth) || 1;
  const h = safeParse(row.height) || 1;
  // If user entered all zeros for L/B/H, result should be 0, not 1
  if (
    safeParse(row.length) === 0 &&
    safeParse(row.breadth) === 0 &&
    safeParse(row.height) === 0
  ) {
    return 0;
  }
  return nos * l * b * h;
}

/* ═══════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════ */
export default function JobEstimationPage() {
  /* ─── State ─── */
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | "">("");
  const [estimations, setEstimations] = useState<JobEstimationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingEstimation, setEditingEstimation] =
    useState<JobEstimationDto | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityId, setActivityId] = useState<number | "">("");
  const [rate, setRate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [domRows, setDomRows] = useState<DOMRow[]>([{ ...EMPTY_DOM_ROW }]);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  /* ─── Load projects ─── */
  useEffect(() => {
    api
      .get("/projects/active")
      .then((res) => setProjects(res.data))
      .catch(console.error);
  }, []);

  /* ─── Load jobs when project changes ─── */
  useEffect(() => {
    if (!selectedProjectId) {
      setJobs([]);
      setSelectedJobId("");
      setEstimations([]);
      return;
    }
    jobService
      .getByProject(Number(selectedProjectId))
      .then(setJobs)
      .catch(console.error);
    setSelectedJobId("");
    setEstimations([]);
  }, [selectedProjectId]);

  /* ─── Load estimations ─── */
  async function loadEstimations() {
    if (!selectedJobId) return;
    setLoading(true);
    try {
      const data = await jobEstimationService.getByJob(Number(selectedJobId));
      setEstimations(data);
    } catch (e) {
      console.error(e);
      alert("Failed to load estimations");
    } finally {
      setLoading(false);
    }
  }

  /* ─── Get selected job ─── */
  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  /* ─── Total estimated amount ─── */
  const totalAmount = estimations.reduce((sum, e) => sum + e.amount, 0);

  /* ─── Open Add modal ─── */
  async function openAddModal() {
    if (!selectedJob) return;
    setEditingEstimation(null);
    setActivityId("");
    setRate("");
    setRemarks("");
    setDomRows([{ ...EMPTY_DOM_ROW }]);
    await loadActivitiesForJob(selectedJob);
    setShowModal(true);
  }

  /* ─── Open Edit modal ─── */
  async function openEditModal(est: JobEstimationDto) {
    if (!selectedJob) return;
    setEditingEstimation(est);
    setActivityId(est.activityId);
    setRate(String(est.rate));
    setRemarks(est.remarks || "");
    setDomRows(
      est.domDetails.length > 0
        ? est.domDetails.map((d) => ({
            description: d.description || "",
            nos: String(d.nos),
            length: String(d.length),
            breadth: String(d.breadth),
            height: String(d.height),
          }))
        : [{ ...EMPTY_DOM_ROW }]
    );
    await loadActivitiesForJob(selectedJob);
    setShowModal(true);
  }

  /* ─── Load activities mapped to the selected job ─── */
  async function loadActivitiesForJob(job: JobDto) {
    try {
      // Fetch all activities, then filter to ones mapped to this job
      const res = await api.get("/activities/active");
      const allActivities: Activity[] = res.data;
      if (job.activityIds && job.activityIds.length > 0) {
        const mapped = allActivities.filter((a) =>
          job.activityIds.includes(a.id)
        );
        setActivities(mapped.length > 0 ? mapped : allActivities);
      } else {
        setActivities(allActivities);
      }
    } catch (e) {
      console.error(e);
      setActivities([]);
    }
  }

  /* ─── DOM row management ─── */
  function updateDOMRow(index: number, field: keyof DOMRow, value: string) {
    setDomRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addDOMRow() {
    setDomRows((prev) => [...prev, { ...EMPTY_DOM_ROW }]);
  }

  function removeDOMRow(index: number) {
    setDomRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  /* ─── Computed values for the modal ─── */
  const domQuantities = domRows.map(computeDOMQty);
  const totalQuantity = domQuantities.reduce((s, q) => s + q, 0);
  const computedAmount = totalQuantity * safeParse(rate);

  /* ─── Save estimation ─── */
  async function handleSave() {
    if (!selectedJobId || !activityId || !rate) {
      alert("Please fill in Activity and Rate.");
      return;
    }
    setSaving(true);
    try {
      const domDetails: CreateEstimationDOMRequest[] = domRows.map(
        (row, idx) => ({
          itemNo: idx + 1,
          description: row.description,
          nos: safeParse(row.nos) || 1,
          length: safeParse(row.length),
          breadth: safeParse(row.breadth),
          height: safeParse(row.height),
        })
      );

      const req: CreateJobEstimationRequest = {
        jobId: Number(selectedJobId),
        activityId: Number(activityId),
        rate: safeParse(rate),
        remarks: remarks || undefined,
        domDetails,
      };

      if (editingEstimation) {
        await jobEstimationService.update(editingEstimation.id, req);
      } else {
        await jobEstimationService.create(req);
      }

      setShowModal(false);
      await loadEstimations();
    } catch (e) {
      console.error(e);
      alert("Failed to save estimation");
    } finally {
      setSaving(false);
    }
  }

  /* ─── Delete estimation ─── */
  async function handleDelete(id: number) {
    setSaving(true);
    try {
      await jobEstimationService.delete(id);
      setConfirmDeleteId(null);
      await loadEstimations();
    } catch (e) {
      console.error(e);
      alert("Failed to delete estimation");
    } finally {
      setSaving(false);
    }
  }

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Job Estimation</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage job estimations with Detail of Measurement (DOM)
        </p>
      </div>

      {/* Job Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Project dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Project
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedProjectId}
              onChange={(e) =>
                setSelectedProjectId(
                  e.target.value ? Number(e.target.value) : ""
                )
              }
            >
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Job dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Job
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedJobId}
              onChange={(e) =>
                setSelectedJobId(e.target.value ? Number(e.target.value) : "")
              }
              disabled={!selectedProjectId}
            >
              <option value="">-- Select Job --</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </div>

          {/* Load button */}
          <div>
            <button
              onClick={loadEstimations}
              disabled={!selectedJobId || loading}
              className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Loading..." : "Load Estimations"}
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          Loading estimations...
        </div>
      )}

      {/* Estimations Table */}
      {!loading && selectedJob && estimations.length >= 0 && selectedJobId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-blue-900">
                {selectedJob.name}
              </h2>
              <p className="text-sm text-gray-500">
                Total Estimated Amount:{" "}
                <span className="font-semibold text-blue-800">
                  Rs. {fmt(totalAmount)}
                </span>
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              + Add Estimation
            </button>
          </div>

          {/* Table */}
          {estimations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No estimations found for this job. Click "+ Add Estimation" to get
              started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-700 text-white">
                    <th className="px-4 py-3 text-left font-semibold w-8"></th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Activity Name
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">UOM</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">Rate</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Amount (Rs.)
                    </th>
                    <th className="px-4 py-3 text-center font-semibold w-28">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {estimations.map((est) => {
                    const isExpanded = expandedId === est.id;
                    return (
                      <EstimationRow
                        key={est.id}
                        estimation={est}
                        isExpanded={isExpanded}
                        onToggle={() =>
                          setExpandedId(isExpanded ? null : est.id)
                        }
                        onEdit={() => openEditModal(est)}
                        onDelete={() => setConfirmDeleteId(est.id)}
                      />
                    );
                  })}
                  {/* Total row */}
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td className="px-4 py-3" colSpan={5}>
                      <span className="font-bold text-blue-900">
                        Grand Total
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-blue-900">
                      {fmt(totalAmount)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-blue-900">
                {editingEstimation ? "Edit Estimation" : "Add Estimation"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Activity & Rate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={activityId}
                    onChange={(e) =>
                      setActivityId(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  >
                    <option value="">-- Select Activity --</option>
                    {activities.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.uom})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate per Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="Enter rate"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional remarks"
                />
              </div>

              {/* DOM Details */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-blue-800">
                    Detail of Measurement (DOM)
                  </h4>
                  <button
                    type="button"
                    onClick={addDOMRow}
                    className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium transition"
                  >
                    + Add Row
                  </button>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 text-center font-medium text-gray-600 w-14">
                          #
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 min-w-[160px]">
                          Description
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600 w-20">
                          Nos
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600 w-24">
                          Length
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600 w-24">
                          Breadth
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600 w-24">
                          Height
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600 w-28">
                          Quantity
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600 w-16">
                          &nbsp;
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {domRows.map((row, idx) => {
                        const qty = domQuantities[idx];
                        return (
                          <tr
                            key={idx}
                            className="border-t border-gray-100 hover:bg-gray-50"
                          >
                            <td className="px-3 py-2 text-center text-gray-500 font-mono">
                              {idx + 1}
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                value={row.description}
                                onChange={(e) =>
                                  updateDOMRow(
                                    idx,
                                    "description",
                                    e.target.value
                                  )
                                }
                                placeholder="Description"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="number"
                                step="1"
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                value={row.nos}
                                onChange={(e) =>
                                  updateDOMRow(idx, "nos", e.target.value)
                                }
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                value={row.length}
                                onChange={(e) =>
                                  updateDOMRow(idx, "length", e.target.value)
                                }
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                value={row.breadth}
                                onChange={(e) =>
                                  updateDOMRow(idx, "breadth", e.target.value)
                                }
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                value={row.height}
                                onChange={(e) =>
                                  updateDOMRow(idx, "height", e.target.value)
                                }
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-gray-700">
                              {fmt(qty)}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeDOMRow(idx)}
                                disabled={domRows.length <= 1}
                                className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none"
                                title="Remove row"
                              >
                                &times;
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300 bg-gray-50">
                        <td
                          colSpan={6}
                          className="px-3 py-2 text-right font-semibold text-gray-700"
                        >
                          Total Quantity:
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-blue-800">
                          {fmt(totalQuantity)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Computed amount */}
                <div className="mt-4 flex items-center justify-end gap-4 text-sm">
                  <span className="text-gray-600">
                    Amount = {fmt(totalQuantity)} x {rate || "0"} ={" "}
                  </span>
                  <span className="text-lg font-bold text-blue-900">
                    Rs. {fmt(computedAmount)}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !activityId || !rate}
                  className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition"
                >
                  {saving
                    ? "Saving..."
                    : editingEstimation
                    ? "Update Estimation"
                    : "Save Estimation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">
                Delete Estimation
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-5">
                Are you sure you want to delete this estimation? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ESTIMATION ROW (with expandable DOM)
   ═══════════════════════════════════════════ */
function EstimationRow({
  estimation,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  estimation: JobEstimationDto;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasDom = estimation.domDetails && estimation.domDetails.length > 0;

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-blue-50/30 transition">
        {/* Expand toggle */}
        <td className="px-4 py-3 text-center">
          {hasDom && (
            <button
              onClick={onToggle}
              className="text-blue-500 hover:text-blue-700 text-sm font-mono"
              title={isExpanded ? "Collapse" : "Expand DOM details"}
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          )}
        </td>
        <td className="px-4 py-3 text-gray-800 font-medium">
          {estimation.activityName}
        </td>
        <td className="px-4 py-3 text-center text-gray-600">
          {estimation.activityUom}
        </td>
        <td className="px-4 py-3 text-right font-mono text-gray-700">
          {fmt(estimation.quantity)}
        </td>
        <td className="px-4 py-3 text-right font-mono text-gray-700">
          {fmt(estimation.rate)}
        </td>
        <td className="px-4 py-3 text-right font-mono font-semibold text-gray-800">
          {fmt(estimation.amount)}
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex justify-center gap-1">
            <button
              onClick={onEdit}
              className="px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded font-medium"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="px-2.5 py-1 text-xs text-red-500 hover:bg-red-100 rounded font-medium"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded DOM Details */}
      {isExpanded && hasDom && (
        <tr>
          <td colSpan={7} className="bg-gray-50 px-6 py-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Detail of Measurement (DOM)
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-center font-medium text-gray-600 w-14">
                      Item
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">
                      Description
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600 w-16">
                      Nos
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600 w-20">
                      Length
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600 w-20">
                      Breadth
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600 w-20">
                      Height
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 w-24">
                      Quantity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {estimation.domDetails.map((dom, idx) => (
                    <tr
                      key={dom.id || idx}
                      className="border-t border-gray-100"
                    >
                      <td className="px-3 py-1.5 text-center text-gray-500 font-mono">
                        {dom.itemNo || idx + 1}
                      </td>
                      <td className="px-3 py-1.5 text-gray-700">
                        {dom.description || "-"}
                      </td>
                      <td className="px-3 py-1.5 text-center font-mono text-gray-600">
                        {dom.nos}
                      </td>
                      <td className="px-3 py-1.5 text-center font-mono text-gray-600">
                        {dom.length}
                      </td>
                      <td className="px-3 py-1.5 text-center font-mono text-gray-600">
                        {dom.breadth}
                      </td>
                      <td className="px-3 py-1.5 text-center font-mono text-gray-600">
                        {dom.height}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono font-medium text-gray-700">
                        {fmt(dom.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td
                      colSpan={6}
                      className="px-3 py-2 text-right font-semibold text-gray-600"
                    >
                      Total Quantity:
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-blue-800">
                      {fmt(estimation.quantity)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {estimation.remarks && (
              <p className="mt-2 text-xs text-gray-500">
                <span className="font-medium">Remarks:</span>{" "}
                {estimation.remarks}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
