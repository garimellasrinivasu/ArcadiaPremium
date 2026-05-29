import { useState, useEffect } from "react";
import { executionTaskService, dailyExecutionUpdateService } from "../services/executionService";
import type { ExecutionTaskDto, DailyExecutionUpdateDto } from "../services/executionService";
import api from "../services/api";

interface ProjectOption {
  id: number;
  name: string;
}

export default function DailyExecutionUpdatePage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectFilter, setProjectFilter] = useState<number>(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tasks, setTasks] = useState<ExecutionTaskDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Per-task update inputs: taskId -> { newPct, remarks }
  const [updates, setUpdates] = useState<Record<number, { newPct: number; remarks: string }>>({});
  // Per-task history: taskId -> updates[]
  const [history, setHistory] = useState<Record<number, DailyExecutionUpdateDto[]>>({});
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    loadProjects();
    loadTasks();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [projectFilter]);

  const loadProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(
        (res.data || []).map((p: any) => ({ id: p.id, name: p.name || p.projectName }))
      );
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      let data: ExecutionTaskDto[];
      if (projectFilter > 0) {
        data = await executionTaskService.getByProject(projectFilter);
      } else {
        data = await executionTaskService.getAll();
      }
      // Only show IN_PROGRESS tasks (not yet 100%)
      const inProgress = data.filter(
        (t) => t.status === "IN_PROGRESS" && t.completionPercentage < 100
      );
      setTasks(inProgress);

      // Initialize update inputs
      const init: Record<number, { newPct: number; remarks: string }> = {};
      inProgress.forEach((t) => {
        init[t.id] = { newPct: t.completionPercentage, remarks: "" };
      });
      setUpdates(init);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setTasks([]);
    }
    setLoading(false);
  };

  const loadHistory = async (taskId: number) => {
    if (expandedHistoryId === taskId) {
      setExpandedHistoryId(null);
      return;
    }
    try {
      const data = await dailyExecutionUpdateService.getByTask(taskId);
      setHistory((prev) => ({ ...prev, [taskId]: data }));
      setExpandedHistoryId(taskId);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleUpdate = async (task: ExecutionTaskDto) => {
    const upd = updates[task.id];
    if (!upd || upd.newPct < task.completionPercentage || upd.newPct > 100) return;
    setSaving(task.id);
    try {
      await dailyExecutionUpdateService.record({
        executionTaskId: task.id,
        newPercentage: upd.newPct,
        remarks: upd.remarks,
      });
      // If 100%, mark as completed
      if (upd.newPct >= 100) {
        await executionTaskService.updateStatus(task.id, "COMPLETED");
      }
      loadTasks();
    } catch (err) {
      console.error("Failed to record update:", err);
    }
    setSaving(null);
  };

  const setUpdateField = (
    taskId: number,
    field: "newPct" | "remarks",
    value: string | number
  ) => {
    setUpdates((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], [field]: value },
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Daily Execution Updates</h1>

      {/* ─── Filters ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Project</label>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              value={projectFilter}
              onChange={(e) => setProjectFilter(Number(e.target.value))}
            >
              <option value={0}>All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-400 border-t-transparent rounded-full" />
        </div>
      )}

      {/* ─── Task Cards ─── */}
      {!loading && tasks.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          No in-progress tasks to update.
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <div className="space-y-4">
          {tasks.map((task) => {
            const upd = updates[task.id] || {
              newPct: task.completionPercentage,
              remarks: "",
            };
            const isExpanded = expandedHistoryId === task.id;
            const taskHistory = history[task.id] || [];

            return (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Task header */}
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {task.taskCode}
                    </span>
                    <span className="font-medium text-gray-800 text-sm">{task.taskName}</span>
                    <span className="text-xs text-gray-500">
                      {task.unitOrBlock} | {task.assignedTo}
                    </span>
                    {task.completionPercentage >= 100 && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                        Completed
                      </span>
                    )}
                  </div>

                  {/* Current progress bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Current Progress</span>
                      <span>{task.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          task.completionPercentage >= 100
                            ? "bg-green-500"
                            : task.completionPercentage >= 50
                            ? "bg-amber-500"
                            : "bg-indigo-500"
                        }`}
                        style={{
                          width: `${Math.min(task.completionPercentage, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Update form row */}
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="w-28">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        New %
                      </label>
                      <input
                        type="number"
                        min={task.completionPercentage}
                        max={100}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                        value={upd.newPct}
                        onChange={(e) =>
                          setUpdateField(task.id, "newPct", Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Remarks
                      </label>
                      <textarea
                        rows={1}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
                        placeholder="Enter progress remarks..."
                        value={upd.remarks}
                        onChange={(e) =>
                          setUpdateField(task.id, "remarks", e.target.value)
                        }
                      />
                    </div>
                    <button
                      disabled={
                        saving === task.id ||
                        upd.newPct <= task.completionPercentage ||
                        upd.newPct > 100
                      }
                      onClick={() => handleUpdate(task)}
                      className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {saving === task.id ? "Saving..." : "Update"}
                    </button>
                    <button
                      onClick={() => loadHistory(task.id)}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      {isExpanded ? "Hide History" : "History"}
                    </button>
                  </div>
                </div>

                {/* ─── Update History ─── */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Update History
                    </h4>
                    {taskHistory.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">No updates recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="text-gray-500 uppercase tracking-wide">
                            <tr>
                              <th className="text-left px-3 py-2">Date</th>
                              <th className="text-left px-3 py-2">Previous %</th>
                              <th className="text-left px-3 py-2">New %</th>
                              <th className="text-left px-3 py-2">Remarks</th>
                              <th className="text-left px-3 py-2">Updated By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {taskHistory.map((h) => (
                              <tr key={h.id}>
                                <td className="px-3 py-2 text-gray-700">
                                  {h.updateDate
                                    ? new Date(h.updateDate).toLocaleDateString()
                                    : "—"}
                                </td>
                                <td className="px-3 py-2 text-gray-600">
                                  {h.previousPercentage}%
                                </td>
                                <td className="px-3 py-2 font-medium text-gray-800">
                                  {h.newPercentage}%
                                </td>
                                <td className="px-3 py-2 text-gray-600">
                                  {h.remarks || "—"}
                                </td>
                                <td className="px-3 py-2 text-gray-600">
                                  {h.updatedBy || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
