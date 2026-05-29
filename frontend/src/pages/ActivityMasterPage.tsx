import { useState, useEffect } from "react";
import {
  activityGroupService,
  activitySubGroupService,
  activityMasterService,
} from "../services/activityService";
import type {
  ActivityGroupDto,
  ActivitySubGroupDto,
  ActivityMasterDto,
} from "../services/activityService";

type Tab = "groups" | "subgroups" | "activities";

const UOM_OPTIONS = [
  "Sqm", "Rmt", "Cum", "Nos", "Kg", "MT", "LS", "Sqft", "Cft", "Brass",
  "Each", "Set", "Trip", "Day", "Hr",
];

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

// ─── Group Modal ───
function GroupModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: ActivityGroupDto | null;
  onSave: (name: string, description?: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave(name.trim(), description.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {initial ? "Edit Activity Group" : "Add Activity Group"}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Group name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Optional description"
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
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {initial ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SubGroup Modal ───
function SubGroupModal({
  initial,
  groups,
  onSave,
  onClose,
}: {
  initial?: ActivitySubGroupDto | null;
  groups: ActivityGroupDto[];
  onSave: (name: string, description: string | undefined, activityGroupId: number) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [groupId, setGroupId] = useState<number>(initial?.activityGroupId ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {initial ? "Edit Sub-Group" : "Add Sub-Group"}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Sub-group name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Activity Group *</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value={0}>-- Select Group --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
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
            onClick={() => {
              if (!name.trim() || !groupId) return;
              onSave(name.trim(), description.trim() || undefined, groupId);
            }}
            disabled={!name.trim() || !groupId}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {initial ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Modal ───
function ActivityModal({
  initial,
  groups,
  onSave,
  onClose,
}: {
  initial?: ActivityMasterDto | null;
  groups: ActivityGroupDto[];
  onSave: (data: {
    name: string;
    description?: string;
    activityGroupId: number;
    activitySubGroupId?: number;
    uom: string;
    sacCode?: string;
  }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [groupId, setGroupId] = useState<number>(initial?.activityGroupId ?? 0);
  const [subGroupId, setSubGroupId] = useState<number>(initial?.activitySubGroupId ?? 0);
  const [uom, setUom] = useState(initial?.uom ?? "");
  const [sacCode, setSacCode] = useState(initial?.sacCode ?? "");
  const [subGroups, setSubGroups] = useState<ActivitySubGroupDto[]>([]);

  useEffect(() => {
    if (groupId) {
      activitySubGroupService.getByGroupId(groupId).then(setSubGroups).catch(() => setSubGroups([]));
    } else {
      setSubGroups([]);
    }
  }, [groupId]);

  // Reset sub-group when group changes (unless editing and it's the initial load)
  const handleGroupChange = (newGroupId: number) => {
    setGroupId(newGroupId);
    if (newGroupId !== initial?.activityGroupId) {
      setSubGroupId(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {initial ? "Edit Activity" : "Add Activity"}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Activity name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Optional description"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Activity Group *</label>
              <select
                value={groupId}
                onChange={(e) => handleGroupChange(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value={0}>-- Select Group --</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sub-Group</label>
              <select
                value={subGroupId}
                onChange={(e) => setSubGroupId(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={!groupId}
              >
                <option value={0}>-- None --</option>
                {subGroups.map((sg) => (
                  <option key={sg.id} value={sg.id}>{sg.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">UOM *</label>
              <select
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">-- Select UOM --</option>
                {UOM_OPTIONS.map((u) => (
                  <option key={u} value={u}>{u === "LS" ? "LS (Lump Sum)" : u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">SAC Code</label>
              <input
                value={sacCode}
                onChange={(e) => setSacCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g. 995411"
              />
            </div>
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
            onClick={() => {
              if (!name.trim() || !groupId || !uom) return;
              onSave({
                name: name.trim(),
                description: description.trim() || undefined,
                activityGroupId: groupId,
                activitySubGroupId: subGroupId || undefined,
                uom,
                sacCode: sacCode.trim() || undefined,
              });
            }}
            disabled={!name.trim() || !groupId || !uom}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {initial ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function ActivityMasterPage() {
  const [tab, setTab] = useState<Tab>("groups");

  // Data
  const [groups, setGroups] = useState<ActivityGroupDto[]>([]);
  const [subGroups, setSubGroups] = useState<ActivitySubGroupDto[]>([]);
  const [activities, setActivities] = useState<ActivityMasterDto[]>([]);

  // Loading
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingSubGroups, setLoadingSubGroups] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Modals
  const [groupModal, setGroupModal] = useState<{ open: boolean; editing?: ActivityGroupDto | null }>({ open: false });
  const [subGroupModal, setSubGroupModal] = useState<{ open: boolean; editing?: ActivitySubGroupDto | null }>({ open: false });
  const [activityModal, setActivityModal] = useState<{ open: boolean; editing?: ActivityMasterDto | null }>({ open: false });
  const [confirmDelete, setConfirmDelete] = useState<{ type: "group" | "subgroup" | "activity"; id: number } | null>(null);

  // Filters
  const [sgFilterGroupId, setSgFilterGroupId] = useState<number>(0);
  const [actFilterGroupId, setActFilterGroupId] = useState<number>(0);
  const [actFilterSubGroupId, setActFilterSubGroupId] = useState<number>(0);
  const [actSubGroupOptions, setActSubGroupOptions] = useState<ActivitySubGroupDto[]>([]);

  // ─── Load data ───
  const loadGroups = async () => {
    setLoadingGroups(true);
    try {
      const data = await activityGroupService.getAll();
      setGroups(data);
    } catch (err) {
      console.error("Failed to load groups:", err);
    }
    setLoadingGroups(false);
  };

  const loadSubGroups = async () => {
    setLoadingSubGroups(true);
    try {
      const data = sgFilterGroupId
        ? await activitySubGroupService.getByGroupId(sgFilterGroupId)
        : await activitySubGroupService.getAll();
      setSubGroups(data);
    } catch (err) {
      console.error("Failed to load sub-groups:", err);
    }
    setLoadingSubGroups(false);
  };

  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      let data: ActivityMasterDto[];
      if (actFilterSubGroupId) {
        data = await activityMasterService.getBySubGroupId(actFilterSubGroupId);
      } else if (actFilterGroupId) {
        data = await activityMasterService.getByGroupId(actFilterGroupId);
      } else {
        data = await activityMasterService.getAll();
      }
      setActivities(data);
    } catch (err) {
      console.error("Failed to load activities:", err);
    }
    setLoadingActivities(false);
  };

  // Load groups on mount
  useEffect(() => {
    loadGroups();
  }, []);

  // Load sub-groups when tab or filter changes
  useEffect(() => {
    if (tab === "subgroups") loadSubGroups();
  }, [tab, sgFilterGroupId]);

  // Load activities when tab or filters change
  useEffect(() => {
    if (tab === "activities") loadActivities();
  }, [tab, actFilterGroupId, actFilterSubGroupId]);

  // Cascading: load sub-group options for activity filter
  useEffect(() => {
    if (actFilterGroupId) {
      activitySubGroupService
        .getByGroupId(actFilterGroupId)
        .then(setActSubGroupOptions)
        .catch(() => setActSubGroupOptions([]));
    } else {
      setActSubGroupOptions([]);
      setActFilterSubGroupId(0);
    }
  }, [actFilterGroupId]);

  // ─── Group handlers ───
  const handleSaveGroup = async (name: string, description?: string) => {
    try {
      if (groupModal.editing) {
        await activityGroupService.update(groupModal.editing.id, name, description);
      } else {
        await activityGroupService.create(name, description);
      }
      setGroupModal({ open: false });
      loadGroups();
    } catch (err) {
      console.error("Failed to save group:", err);
    }
  };

  // ─── SubGroup handlers ───
  const handleSaveSubGroup = async (name: string, description: string | undefined, activityGroupId: number) => {
    try {
      if (subGroupModal.editing) {
        await activitySubGroupService.update(subGroupModal.editing.id, name, description, activityGroupId);
      } else {
        await activitySubGroupService.create(name, description, activityGroupId);
      }
      setSubGroupModal({ open: false });
      loadSubGroups();
    } catch (err) {
      console.error("Failed to save sub-group:", err);
    }
  };

  // ─── Activity handlers ───
  const handleSaveActivity = async (data: {
    name: string;
    description?: string;
    activityGroupId: number;
    activitySubGroupId?: number;
    uom: string;
    sacCode?: string;
  }) => {
    try {
      if (activityModal.editing) {
        await activityMasterService.update(activityModal.editing.id, data);
      } else {
        await activityMasterService.create(data);
      }
      setActivityModal({ open: false });
      loadActivities();
    } catch (err) {
      console.error("Failed to save activity:", err);
    }
  };

  // ─── Delete handler ───
  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === "group") {
        await activityGroupService.delete(confirmDelete.id);
        loadGroups();
        loadSubGroups();
        loadActivities();
      } else if (confirmDelete.type === "subgroup") {
        await activitySubGroupService.delete(confirmDelete.id);
        loadSubGroups();
        loadActivities();
      } else {
        await activityMasterService.delete(confirmDelete.id);
        loadActivities();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
    setConfirmDelete(null);
  };

  // ─── Active badge ───
  const ActiveBadge = ({ active }: { active: boolean }) => (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
        active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {([
          { key: "groups" as Tab, label: "Activity Groups" },
          { key: "subgroups" as Tab, label: "Sub-Groups" },
          { key: "activities" as Tab, label: "Activities" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-3 text-sm font-semibold transition ${
              tab === t.key
                ? "border-b-2 border-blue-600 text-blue-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════ Tab 1: Activity Groups ════════ */}
      {tab === "groups" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Activity Groups</h2>
            <button
              onClick={() => setGroupModal({ open: true, editing: null })}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              + Add Group
            </button>
          </div>

          {loadingGroups ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : groups.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400 text-sm">
              No activity groups found. Click "Add Group" to create one.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Description</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {groups.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{g.name}</td>
                      <td className="px-4 py-3 text-gray-500">{g.description || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <ActiveBadge active={g.active} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setGroupModal({ open: true, editing: g })}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ type: "group", id: g.id })}
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

      {/* ════════ Tab 2: Sub-Groups ════════ */}
      {tab === "subgroups" && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Activity Sub-Groups</h2>
            <div className="flex items-center gap-3">
              <select
                value={sgFilterGroupId}
                onChange={(e) => setSgFilterGroupId(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value={0}>All Groups</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <button
                onClick={() => setSubGroupModal({ open: true, editing: null })}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                + Add Sub-Group
              </button>
            </div>
          </div>

          {loadingSubGroups ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : subGroups.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400 text-sm">
              No sub-groups found. Click "Add Sub-Group" to create one.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Description</th>
                    <th className="text-left px-4 py-3 font-medium">Group</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subGroups.map((sg) => (
                    <tr key={sg.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{sg.name}</td>
                      <td className="px-4 py-3 text-gray-500">{sg.description || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                          {sg.activityGroupName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ActiveBadge active={sg.active} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSubGroupModal({ open: true, editing: sg })}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ type: "subgroup", id: sg.id })}
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

      {/* ════════ Tab 3: Activities ════════ */}
      {tab === "activities" && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Activities</h2>
            <div className="flex items-center gap-3">
              <select
                value={actFilterGroupId}
                onChange={(e) => {
                  setActFilterGroupId(Number(e.target.value));
                  setActFilterSubGroupId(0);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value={0}>All Groups</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <select
                value={actFilterSubGroupId}
                onChange={(e) => setActFilterSubGroupId(Number(e.target.value))}
                disabled={!actFilterGroupId}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50"
              >
                <option value={0}>All Sub-Groups</option>
                {actSubGroupOptions.map((sg) => (
                  <option key={sg.id} value={sg.id}>{sg.name}</option>
                ))}
              </select>
              <button
                onClick={() => setActivityModal({ open: true, editing: null })}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                + Add Activity
              </button>
            </div>
          </div>

          {loadingActivities ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : activities.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400 text-sm">
              No activities found. Click "Add Activity" to create one.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Name</th>
                      <th className="text-left px-4 py-3 font-medium">Group</th>
                      <th className="text-left px-4 py-3 font-medium">Sub-Group</th>
                      <th className="text-center px-4 py-3 font-medium">UOM</th>
                      <th className="text-left px-4 py-3 font-medium">SAC Code</th>
                      <th className="text-center px-4 py-3 font-medium">Status</th>
                      <th className="text-right px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activities.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{a.name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                            {a.activityGroupName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{a.activitySubGroupName || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            {a.uom}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{a.sacCode || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <ActiveBadge active={a.active} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setActivityModal({ open: true, editing: a })}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: "activity", id: a.id })}
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
            </div>
          )}
        </div>
      )}

      {/* ─── Modals ─── */}
      {groupModal.open && (
        <GroupModal
          initial={groupModal.editing}
          onSave={handleSaveGroup}
          onClose={() => setGroupModal({ open: false })}
        />
      )}

      {subGroupModal.open && (
        <SubGroupModal
          initial={subGroupModal.editing}
          groups={groups}
          onSave={handleSaveSubGroup}
          onClose={() => setSubGroupModal({ open: false })}
        />
      )}

      {activityModal.open && (
        <ActivityModal
          initial={activityModal.editing}
          groups={groups}
          onSave={handleSaveActivity}
          onClose={() => setActivityModal({ open: false })}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          message={`Are you sure you want to delete this ${
            confirmDelete.type === "group"
              ? "activity group"
              : confirmDelete.type === "subgroup"
              ? "sub-group"
              : "activity"
          }? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
