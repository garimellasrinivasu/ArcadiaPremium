import { useState, useEffect } from "react";
import { executionTemplateService, executionTaskService } from "../services/executionService";
import type { ExecutionTemplateDto, ExecutionTaskDto } from "../services/executionService";
import api from "../services/api";

type Tab = "templates" | "tasks";

interface ProjectOption {
  id: number;
  name: string;
}

interface TaskRow {
  taskName: string;
  sortOrder: number;
  estimatedDays: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
};

// ─── Confirm Modal ───
function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4">
        <p className="text-gray-800 text-sm mb-5">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Allocate Modal ───
function AllocateModal({
  templateName,
  onAllocate,
  onClose,
}: {
  templateName: string;
  onAllocate: (unitOrBlock: string, assignedTo: string) => void;
  onClose: () => void;
}) {
  const [unitOrBlock, setUnitOrBlock] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Allocate Template: {templateName}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unit / Block *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              value={unitOrBlock}
              onChange={(e) => setUnitOrBlock(e.target.value)}
              placeholder="e.g. Block A, Unit 101"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assigned To *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Person or team name"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            disabled={!unitOrBlock.trim() || !assignedTo.trim()}
            onClick={() => onAllocate(unitOrBlock.trim(), assignedTo.trim())}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Allocate
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Template Modal ───
function CreateTemplateModal({
  projects,
  onSave,
  onClose,
}: {
  projects: ProjectOption[];
  onSave: (projectId: number, tasks: TaskRow[]) => void;
  onClose: () => void;
}) {
  const [projectId, setProjectId] = useState<number>(0);
  const [tasks, setTasks] = useState<TaskRow[]>([
    { taskName: "", sortOrder: 1, estimatedDays: 1 },
  ]);

  const addRow = () =>
    setTasks([...tasks, { taskName: "", sortOrder: tasks.length + 1, estimatedDays: 1 }]);

  const removeRow = (idx: number) => setTasks(tasks.filter((_, i) => i !== idx));

  const updateRow = (idx: number, field: keyof TaskRow, value: string | number) =>
    setTasks(tasks.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));

  const valid = projectId > 0 && tasks.length > 0 && tasks.every((t) => t.taskName.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Execution Template</h3>
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Project *</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
            value={projectId}
            onChange={(e) => setProjectId(Number(e.target.value))}
          >
            <option value={0}>-- Select Project --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-2">Tasks</label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tasks.map((t, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  placeholder="Task name"
                  value={t.taskName}
                  onChange={(e) => updateRow(idx, "taskName", e.target.value)}
                />
                <input
                  type="number"
                  className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  placeholder="Order"
                  value={t.sortOrder}
                  onChange={(e) => updateRow(idx, "sortOrder", Number(e.target.value))}
                />
                <input
                  type="number"
                  className="w-24 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  placeholder="Est. days"
                  value={t.estimatedDays}
                  onChange={(e) => updateRow(idx, "estimatedDays", Number(e.target.value))}
                />
                <button
                  onClick={() => removeRow(idx)}
                  className="text-red-500 hover:text-red-700 text-sm px-1"
                  disabled={tasks.length === 1}
                >
                  X
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addRow}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Add Task Row
          </button>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={() => onSave(projectId, tasks)}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Task Modal ───
function CreateTaskModal({
  projects,
  onSave,
  onClose,
}: {
  projects: ProjectOption[];
  onSave: (req: { projectId: number; taskName: string; unitOrBlock: string; assignedTo: string; estimatedDays: number }) => void;
  onClose: () => void;
}) {
  const [projectId, setProjectId] = useState<number>(0);
  const [taskName, setTaskName] = useState("");
  const [unitOrBlock, setUnitOrBlock] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [estimatedDays, setEstimatedDays] = useState(1);

  const valid = projectId > 0 && taskName.trim() && unitOrBlock.trim() && assignedTo.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Execution Task</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Project *</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              value={projectId}
              onChange={(e) => setProjectId(Number(e.target.value))}
            >
              <option value={0}>-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Task Name *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unit / Block *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              value={unitOrBlock}
              onChange={(e) => setUnitOrBlock(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assigned To *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Estimated Days</label>
            <input
              type="number"
              min={1}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={() => onSave({ projectId, taskName: taskName.trim(), unitOrBlock: unitOrBlock.trim(), assignedTo: assignedTo.trim(), estimatedDays })}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function ProjectExecutionTemplatePage() {
  const [tab, setTab] = useState<Tab>("templates");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<ExecutionTemplateDto[]>([]);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [allocateTemplate, setAllocateTemplate] = useState<ExecutionTemplateDto | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<number | null>(null);

  // Tasks state
  const [tasks, setTasks] = useState<ExecutionTaskDto[]>([]);
  const [taskProjectFilter, setTaskProjectFilter] = useState<number>(0);
  const [taskStatusFilter, setTaskStatusFilter] = useState("ALL");
  const [taskAssignedFilter, setTaskAssignedFilter] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (tab === "templates") loadTemplates();
    else loadTasks();
  }, [tab]);

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

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await executionTemplateService.getAll();
      setTemplates(data);
    } catch (err) {
      console.error("Failed to load templates:", err);
      setTemplates([]);
    }
    setLoading(false);
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await executionTaskService.getAll();
      setTasks(data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setTasks([]);
    }
    setLoading(false);
  };

  const handleCreateTemplate = async (projectId: number, taskRows: TaskRow[]) => {
    try {
      await executionTemplateService.create({ projectId, tasks: taskRows });
      setShowCreateTemplate(false);
      loadTemplates();
    } catch (err) {
      console.error("Failed to create template:", err);
    }
  };

  const handleDeleteTemplate = async () => {
    if (deleteTemplateId == null) return;
    try {
      await executionTemplateService.delete(deleteTemplateId);
      setDeleteTemplateId(null);
      loadTemplates();
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  };

  const handleAllocate = async (unitOrBlock: string, assignedTo: string) => {
    if (!allocateTemplate) return;
    try {
      await executionTaskService.allocate({
        templateId: allocateTemplate.id,
        unitOrBlock,
        assignedTo,
      });
      setAllocateTemplate(null);
      setTab("tasks");
      loadTasks();
    } catch (err) {
      console.error("Failed to allocate:", err);
    }
  };

  const handleCreateTask = async (req: { projectId: number; taskName: string; unitOrBlock: string; assignedTo: string; estimatedDays: number }) => {
    try {
      await executionTaskService.create(req);
      setShowCreateTask(false);
      loadTasks();
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleDeleteTask = async () => {
    if (deleteTaskId == null) return;
    try {
      await executionTaskService.delete(deleteTaskId);
      setDeleteTaskId(null);
      loadTasks();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await executionTaskService.updateStatus(taskId, newStatus);
      loadTasks();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Filtered tasks
  const filteredTasks = tasks.filter((t) => {
    if (taskProjectFilter > 0 && t.projectId !== taskProjectFilter) return false;
    if (taskStatusFilter !== "ALL" && t.status !== taskStatusFilter) return false;
    if (taskAssignedFilter.trim()) {
      const q = taskAssignedFilter.toLowerCase();
      if (!t.assignedTo?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Execution Templates & Tasks</h1>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(["templates", "tasks"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t === "templates" ? "Templates" : "Tasks"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-400 border-t-transparent rounded-full" />
        </div>
      )}

      {/* ─── TEMPLATES TAB ─── */}
      {!loading && tab === "templates" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{templates.length} template(s)</p>
            <button
              onClick={() => setShowCreateTemplate(true)}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              + Create Template
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No templates yet.</div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3">Project</th>
                    <th className="text-left px-4 py-3">Tasks</th>
                    <th className="text-left px-4 py-3">Created By</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {templates.map((tpl) => (
                    <tr key={tpl.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{tpl.projectName}</td>
                      <td className="px-4 py-3 text-gray-600">{tpl.tasks?.length ?? 0} task(s)</td>
                      <td className="px-4 py-3 text-gray-600">{tpl.createdBy}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {tpl.createdAt ? new Date(tpl.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setAllocateTemplate(tpl)}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium mr-3"
                        >
                          Allocate
                        </button>
                        <button
                          onClick={() => setDeleteTemplateId(tpl.id)}
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
        </div>
      )}

      {/* ─── TASKS TAB ─── */}
      {!loading && tab === "tasks" && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Project</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                value={taskProjectFilter}
                onChange={(e) => setTaskProjectFilter(Number(e.target.value))}
              >
                <option value={0}>All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
              >
                <option value="ALL">All</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assigned To</label>
              <input
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                placeholder="Filter by person"
                value={taskAssignedFilter}
                onChange={(e) => setTaskAssignedFilter(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowCreateTask(true)}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 ml-auto"
            >
              + Create Task
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-3">{filteredTasks.length} task(s)</p>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No tasks found.</div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3">Task Code</th>
                    <th className="text-left px-4 py-3">Task Name</th>
                    <th className="text-left px-4 py-3">Unit/Block</th>
                    <th className="text-left px-4 py-3">Assigned To</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Completion %</th>
                    <th className="text-left px-4 py-3">Project</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="group">
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
                          }
                          className="text-indigo-600 hover:underline font-medium"
                        >
                          {task.taskCode}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-800">{task.taskName}</td>
                      <td className="px-4 py-3 text-gray-600">{task.unitOrBlock}</td>
                      <td className="px-4 py-3 text-gray-600">{task.assignedTo}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            STATUS_COLORS[task.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {task.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                task.completionPercentage >= 100
                                  ? "bg-green-500"
                                  : task.completionPercentage >= 50
                                  ? "bg-amber-500"
                                  : "bg-indigo-500"
                              }`}
                              style={{ width: `${Math.min(task.completionPercentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{task.completionPercentage}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{task.projectName}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {task.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}
                              className="text-amber-600 hover:text-amber-800 text-xs font-medium mr-2"
                            >
                              Start
                            </button>
                            <button
                              onClick={() => setDeleteTaskId(task.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {task.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => handleStatusChange(task.id, "COMPLETED")}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                          >
                            Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Expanded row details */}
                  {filteredTasks.map(
                    (task) =>
                      expandedTaskId === task.id && (
                        <tr key={`exp-${task.id}`} className="bg-indigo-50/40">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div>
                                <span className="text-gray-500">Estimated Days:</span>{" "}
                                <span className="font-medium text-gray-800">
                                  {task.estimatedDays}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Start Date:</span>{" "}
                                <span className="font-medium text-gray-800">
                                  {task.startDate
                                    ? new Date(task.startDate).toLocaleDateString()
                                    : "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Completion Date:</span>{" "}
                                <span className="font-medium text-gray-800">
                                  {task.completedDate
                                    ? new Date(task.completedDate).toLocaleDateString()
                                    : "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Created By:</span>{" "}
                                <span className="font-medium text-gray-800">
                                  {task.createdBy}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Modals ─── */}
      {showCreateTemplate && (
        <CreateTemplateModal
          projects={projects}
          onSave={handleCreateTemplate}
          onClose={() => setShowCreateTemplate(false)}
        />
      )}

      {allocateTemplate && (
        <AllocateModal
          templateName={allocateTemplate.projectName}
          onAllocate={handleAllocate}
          onClose={() => setAllocateTemplate(null)}
        />
      )}

      {deleteTemplateId != null && (
        <ConfirmModal
          message="Are you sure you want to delete this template? This action cannot be undone."
          onConfirm={handleDeleteTemplate}
          onCancel={() => setDeleteTemplateId(null)}
        />
      )}

      {showCreateTask && (
        <CreateTaskModal
          projects={projects}
          onSave={handleCreateTask}
          onClose={() => setShowCreateTask(false)}
        />
      )}

      {deleteTaskId != null && (
        <ConfirmModal
          message="Are you sure you want to delete this task? This action cannot be undone."
          onConfirm={handleDeleteTask}
          onCancel={() => setDeleteTaskId(null)}
        />
      )}
    </div>
  );
}
