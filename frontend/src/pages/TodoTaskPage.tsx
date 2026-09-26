import { useState, useEffect, useCallback } from "react";
import { todoTaskService } from "../services/todoTaskService";
import type { TodoTaskDto, CreateTodoTaskRequest } from "../services/todoTaskService";
import { projectService } from "../services/projectService";
import type { ProjectDto } from "../services/projectService";
import { userService } from "../services/userService";
import { authService } from "../services/authService";
import type { User } from "../types/user";

const CATEGORIES = ["CONSTRUCTION", "LEGAL", "FINANCE", "ADMIN"];
const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];
const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-orange-100 text-orange-700",
  LOW: "bg-gray-100 text-gray-600",
};

export default function TodoTaskPage() {
  const [tasks, setTasks] = useState<TodoTaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"my" | "assigned" | "all">("my");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TodoTaskDto | null>(null);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  // Form state
  const [form, setForm] = useState<CreateTodoTaskRequest>({
    title: "",
    description: "",
    category: "ADMIN",
    priority: "MEDIUM",
    targetDate: "",
    project: "",
    assignedTo: "",
    remarks: "",
    reminderEnabled: true,
  });

  // Daily update modal
  const [dailyUpdateTask, setDailyUpdateTask] = useState<TodoTaskDto | null>(null);
  const [dailyUpdateText, setDailyUpdateText] = useState("");

  // Current user (loaded async)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const isAdmin = currentUser?.role?.name === "ADMIN";

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      let data: TodoTaskDto[];
      if (activeTab === "my") data = await todoTaskService.getMyTasks();
      else if (activeTab === "assigned") data = await todoTaskService.getAssignedByMe();
      else data = await todoTaskService.getAll();
      setTasks(data);
    } catch {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser).catch(() => {});
    projectService.getActiveProjects().then(setProjects).catch(() => {});
    userService.getAllBasic().then(setUsers).catch(() => {});
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const resetForm = () => {
    setForm({ title: "", description: "", category: "ADMIN", priority: "MEDIUM", targetDate: "", project: "", assignedTo: currentUser?.email || "", remarks: "", reminderEnabled: true });
    setEditingTask(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await todoTaskService.update(editingTask.id, form);
      } else {
        await todoTaskService.create(form);
      }
      setShowForm(false);
      resetForm();
      loadTasks();
    } catch {
      setError("Failed to save task");
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await todoTaskService.updateStatus(id, status);
      loadTasks();
    } catch {
      setError("Failed to update status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this task?")) return;
    try {
      await todoTaskService.delete(id);
      loadTasks();
    } catch {
      setError("Failed to delete task");
    }
  };

  const handleDailyUpdateSave = async () => {
    if (!dailyUpdateTask) return;
    try {
      await todoTaskService.updateDailyUpdate(dailyUpdateTask.id, dailyUpdateText);
      setDailyUpdateTask(null);
      setDailyUpdateText("");
      loadTasks();
    } catch {
      setError("Failed to save daily update");
    }
  };

  const openEdit = (task: TodoTaskDto) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      category: task.category,
      priority: task.priority,
      targetDate: task.targetDate,
      project: task.project || "",
      assignedTo: task.assignedTo,
      remarks: task.remarks || "",
      reminderEnabled: task.reminderEnabled,
    });
    setShowForm(true);
  };

  const openNew = () => {
    resetForm();
    setForm((f) => ({ ...f, assignedTo: currentUser?.email || "" }));
    setShowForm(true);
  };

  // Test notification handlers
  const [sendingReminder, setSendingReminder] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);

  const handleTestDailyReminder = async () => {
    setSendingReminder(true);
    try {
      const res = await todoTaskService.testDailyReminder();
      alert(res.message || "Daily reminder sent!");
    } catch {
      alert("Failed to send daily reminder");
    } finally {
      setSendingReminder(false);
    }
  };

  const handleTestWeeklySummary = async () => {
    setSendingSummary(true);
    try {
      const res = await todoTaskService.testWeeklySummary();
      alert(res.message || "Weekly summary sent!");
    } catch {
      alert("Failed to send weekly summary");
    } finally {
      setSendingSummary(false);
    }
  };

  // Summary counts
  const pendingCount = tasks.filter((t) => t.status === "PENDING").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdueCount = tasks.filter((t) => t.status === "OVERDUE").length;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Todo Tasks</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button
                onClick={handleTestDailyReminder}
                disabled={sendingReminder}
                className="bg-orange-500 text-white px-3 py-2 rounded hover:bg-orange-600 text-xs disabled:opacity-50"
              >
                {sendingReminder ? "Sending..." : "📧 Test Daily Reminder"}
              </button>
              <button
                onClick={handleTestWeeklySummary}
                disabled={sendingSummary}
                className="bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600 text-xs disabled:opacity-50"
              >
                {sendingSummary ? "Sending..." : "📋 Test Weekly Summary"}
              </button>
            </>
          )}
          <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
            + New Task
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-500 font-bold">×</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-center">
          <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
          <div className="text-xs text-yellow-600">Pending</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{inProgressCount}</div>
          <div className="text-xs text-blue-600">In Progress</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{completedCount}</div>
          <div className="text-xs text-green-600">Completed</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-3 text-center">
          <div className="text-2xl font-bold text-red-700">{overdueCount}</div>
          <div className="text-xs text-red-600">Overdue</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b">
        <button onClick={() => setActiveTab("my")} className={`px-4 py-2 text-sm font-medium rounded-t ${activeTab === "my" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          My Tasks
        </button>
        <button onClick={() => setActiveTab("assigned")} className={`px-4 py-2 text-sm font-medium rounded-t ${activeTab === "assigned" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          Assigned by Me
        </button>
        {isAdmin && (
          <button onClick={() => setActiveTab("all")} className={`px-4 py-2 text-sm font-medium rounded-t ${activeTab === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            All Tasks
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filterStatus || filterCategory || filterPriority) && (
          <button onClick={() => { setFilterStatus(""); setFilterCategory(""); setFilterPriority(""); }} className="text-xs text-blue-600 underline">
            Clear Filters
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto self-center">{filteredTasks.length} task(s)</span>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No tasks found. Click "+ New Task" to create one.</div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-gray-400">{task.taskCode}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status] || "bg-gray-100"}`}>
                      {task.status.replace("_", " ")}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] || "bg-gray-100"}`}>
                      {task.priority}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{task.category}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 truncate">{task.title}</h3>
                  {task.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                    {task.project && <span>Project: <strong>{task.project}</strong></span>}
                    <span>Target: <strong className={task.daysRemaining !== undefined && task.daysRemaining < 0 ? "text-red-600" : ""}>{task.targetDate}</strong></span>
                    {task.daysRemaining !== undefined && task.status !== "COMPLETED" && (
                      <span className={task.daysRemaining < 0 ? "text-red-600 font-medium" : task.daysRemaining === 0 ? "text-orange-600 font-medium" : "text-green-600"}>
                        {task.daysRemaining < 0 ? `${Math.abs(task.daysRemaining)}d overdue` : task.daysRemaining === 0 ? "Due today" : `${task.daysRemaining}d remaining`}
                      </span>
                    )}
                    {task.actualCompletionDate && <span>Completed: <strong className="text-green-600">{task.actualCompletionDate}</strong></span>}
                    <span>Assigned to: <strong>{task.assignedToName || task.assignedTo}</strong></span>
                    <span>By: <strong>{task.assignedByName || task.assignedBy}</strong></span>
                  </div>
                  {task.dailyUpdate && (
                    <div className="mt-2 bg-blue-50 rounded p-2 text-xs text-blue-800">
                      <strong>Latest Update:</strong> {task.dailyUpdate}
                      {task.dailyUpdateAt && <span className="text-blue-500 ml-1">({new Date(task.dailyUpdateAt).toLocaleString()})</span>}
                    </div>
                  )}
                  {task.remarks && <p className="text-xs text-gray-400 mt-1 italic">Remarks: {task.remarks}</p>}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {task.status !== "COMPLETED" && (
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="text-xs border rounded px-1 py-1"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                  )}
                  <button onClick={() => { setDailyUpdateTask(task); setDailyUpdateText(task.dailyUpdate || ""); }} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">
                    Update
                  </button>
                  <button onClick={() => openEdit(task)} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100">
                    Edit
                  </button>
                  {(isAdmin || task.assignedBy === currentUser?.email) && (
                    <button onClick={() => handleDelete(task.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingTask ? "Edit Task" : "New Task"}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="Task title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" rows={2} placeholder="Task description" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Date *</label>
                  <input type="date" required value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="">-- No Project --</option>
                    {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To *</label>
                <select required value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="">-- Select User --</option>
                  {users.map((u) => <option key={u.id} value={u.email}>{u.firstName} {u.lastName} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" rows={2} placeholder="Any remarks..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="reminderEnabled" checked={form.reminderEnabled} onChange={(e) => setForm({ ...form, reminderEnabled: e.target.checked })} className="rounded" />
                <label htmlFor="reminderEnabled" className="text-sm text-gray-700">Enable daily reminders (Email + WhatsApp)</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">{editingTask ? "Update" : "Create"} Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Update Modal */}
      {dailyUpdateTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">Daily Update — {dailyUpdateTask.taskCode}</h2>
              <button onClick={() => setDailyUpdateTask(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-2">{dailyUpdateTask.title}</p>
              <textarea
                value={dailyUpdateText}
                onChange={(e) => setDailyUpdateText(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                rows={4}
                placeholder="Enter today's progress update..."
              />
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setDailyUpdateTask(null)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancel</button>
                <button onClick={handleDailyUpdateSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Save Update</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
