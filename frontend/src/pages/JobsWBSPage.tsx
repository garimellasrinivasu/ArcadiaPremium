import { useState, useEffect } from "react";
import { jobService } from "../services/jobService";
import type { JobDto, CreateJobRequest } from "../services/jobService";
import { activityMasterService } from "../services/activityService";
import type { ActivityMasterDto } from "../services/activityService";
import api from "../services/api";

const STATUS_OPTIONS = ["DRAFT", "ACTIVE", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-purple-100 text-purple-700",
  CANCELLED: "bg-red-100 text-red-700",
};

interface ProjectOption {
  id: number;
  name: string;
}

// ─── Activity Multi-Select (grouped with collapsible sections) ───
function ActivityMultiSelect({
  allActivities,
  selectedIds,
  onChange,
}: {
  allActivities: ActivityMasterDto[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Group activities by activityGroupName
  const grouped = allActivities.reduce<Record<string, ActivityMasterDto[]>>((acc, a) => {
    const group = a.activityGroupName || "Ungrouped";
    if (!acc[group]) acc[group] = [];
    acc[group].push(a);
    return acc;
  }, {});

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const selectAllInGroup = (activities: ActivityMasterDto[]) => {
    const ids = activities.map((a) => a.id);
    const merged = Array.from(new Set([...selectedIds, ...ids]));
    onChange(merged);
  };

  const deselectAllInGroup = (activities: ActivityMasterDto[]) => {
    const ids = new Set(activities.map((a) => a.id));
    onChange(selectedIds.filter((id) => !ids.has(id)));
  };

  const toggleActivity = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
      {Object.entries(grouped).map(([group, activities]) => {
        const collapsed = collapsedGroups.has(group);
        const _allSelected = activities.every((a) => selectedIds.includes(a.id)); void _allSelected;
        return (
          <div key={group} className="border-b border-gray-100 last:border-b-0">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 sticky top-0">
              <button
                type="button"
                onClick={() => toggleGroup(group)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-blue-600"
              >
                <span className={`transition-transform ${collapsed ? "" : "rotate-90"}`}>&#9654;</span>
                {group} ({activities.length})
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => selectAllInGroup(activities)}
                  className="text-[10px] text-blue-600 hover:underline"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => deselectAllInGroup(activities)}
                  className="text-[10px] text-gray-500 hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>
            {!collapsed && (
              <div className="px-3 py-1 space-y-1">
                {activities.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(a.id)}
                      onChange={() => toggleActivity(a.id)}
                      className="accent-blue-600"
                    />
                    <span>{a.name}</span>
                    <span className="text-gray-400 ml-auto">{a.uom}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {allActivities.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">No active activities found</p>
      )}
    </div>
  );
}

// ─── Create / Edit Modal ───
function JobModal({
  initial,
  projects,
  allActivities,
  onSave,
  onClose,
}: {
  initial?: JobDto | null;
  projects: ProjectOption[];
  allActivities: ActivityMasterDto[];
  onSave: (req: CreateJobRequest) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [projectId, setProjectId] = useState<number | "">(initial?.projectId ?? "");
  const [unitName, setUnitName] = useState(initial?.unitName ?? "");
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>(
    initial?.activityIds ?? []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectId) return;
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      projectId: projectId as number,
      unitName: unitName.trim() || undefined,
      activityIds: selectedActivityIds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {initial ? "Edit Job" : "Create Job"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Job Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Job Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="Enter job name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none"
              placeholder="Job description (optional)"
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Project *</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : "")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
            >
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Unit/Block Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unit / Block Name</label>
            <input
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="e.g. Block A, Unit 101"
            />
          </div>

          {/* Activity Multi-select */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Mapped Activities ({selectedActivityIds.length} selected)
            </label>
            <ActivityMultiSelect
              allActivities={allActivities}
              selectedIds={selectedActivityIds}
              onChange={setSelectedActivityIds}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              {initial ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function JobsWBSPage() {
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [allActivities, setAllActivities] = useState<ActivityMasterDto[]>([]);
  const [projectFilter, setProjectFilter] = useState<number | "">("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ─── Load data ───
  useEffect(() => {
    Promise.all([
      api.get("/projects/active").then((r) => r.data),
      activityMasterService.getActive(),
    ])
      .then(([proj, acts]) => {
        setProjects(proj);
        setAllActivities(acts);
      })
      .catch(() => setError("Failed to load projects or activities"));
  }, []);

  // Load jobs whenever projectFilter changes
  useEffect(() => {
    loadJobs();
  }, [projectFilter]);

  const loadJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const data =
        projectFilter !== ""
          ? await jobService.getByProject(projectFilter)
          : await jobService.getAll();
      setJobs(data);
    } catch {
      setError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  // ─── Handlers ───
  const handleSave = async (req: CreateJobRequest) => {
    try {
      if (editingJob) {
        await jobService.update(editingJob.id, req);
      } else {
        await jobService.create(req);
      }
      setShowModal(false);
      setEditingJob(null);
      loadJobs();
    } catch {
      setError("Failed to save job");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      await jobService.delete(id);
      loadJobs();
    } catch {
      setError("Failed to delete job");
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await jobService.updateStatus(id, status);
      loadJobs();
    } catch {
      setError("Failed to update job status");
    }
  };

  const openEdit = (job: JobDto) => {
    setEditingJob(job);
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingJob(null);
    setShowModal(true);
  };

  // Build activity lookup for display
  const activityMap = new Map(allActivities.map((a) => [a.id, a]));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Jobs / Work Breakdown Structure</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
        >
          + Create Job
        </button>
      </div>

      {/* ─── Filter Bar ─── */}
      <div className="mb-5 flex items-center gap-3">
        <label className="text-xs font-medium text-gray-600">Filter by Project:</label>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value ? Number(e.target.value) : "")}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none min-w-[220px]"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
          <button onClick={() => setError("")} className="ml-3 underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Loading ─── */}
      {loading && (
        <div className="text-center py-12 text-gray-400 text-sm">Loading jobs...</div>
      )}

      {/* ─── Empty State ─── */}
      {!loading && jobs.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          No jobs found.{" "}
          <button onClick={openCreate} className="text-blue-600 hover:underline">
            Create one
          </button>
        </div>
      )}

      {/* ─── Job Cards ─── */}
      <div className="space-y-3">
        {jobs.map((job) => {
          const isExpanded = expandedId === job.id;
          const mappedActivities = job.activityIds
            .map((id) => activityMap.get(id))
            .filter(Boolean) as ActivityMasterDto[];

          return (
            <div
              key={job.id}
              className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
            >
              {/* Summary row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : job.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`transition-transform text-gray-400 text-xs ${isExpanded ? "rotate-90" : ""}`}>
                    &#9654;
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">{job.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                    {job.projectName}
                  </span>
                  {job.unitName && (
                    <span className="text-xs text-gray-500">| {job.unitName}</span>
                  )}
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    STATUS_COLORS[job.status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {job.status.replace("_", " ")}
                </span>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50/50">
                  {/* Description */}
                  {job.description && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Description</span>
                      <p className="text-sm text-gray-700 mt-0.5">{job.description}</p>
                    </div>
                  )}

                  {/* Mapped Activities */}
                  <div>
                    <span className="text-xs font-medium text-gray-500">
                      Mapped Activities ({mappedActivities.length})
                    </span>
                    {mappedActivities.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {mappedActivities.map((a) => (
                          <span
                            key={a.id}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                          >
                            {a.name} ({a.uom})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">No activities mapped</p>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Created by: {job.createdBy}</span>
                    <span>Created: {new Date(job.createdAt).toLocaleDateString()}</span>
                    {job.updatedAt && (
                      <span>Updated: {new Date(job.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => openEdit(job)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      Edit
                    </button>

                    {/* Status dropdown */}
                    <select
                      value={job.status}
                      onChange={(e) => handleStatusChange(job.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleDelete(job.id)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50 ml-auto"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Modal ─── */}
      {showModal && (
        <JobModal
          initial={editingJob}
          projects={projects}
          allActivities={allActivities}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingJob(null);
          }}
        />
      )}
    </div>
  );
}
