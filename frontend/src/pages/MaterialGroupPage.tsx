import { useState, useEffect } from "react";
import {
  materialGroupService,
  materialSubGroupService,
  materialMasterService,
} from "../services/materialService";
import type {
  MaterialGroupDto,
  MaterialSubGroupDto,
  MaterialMasterDto,
  CreateMaterialGroupRequest,
  CreateMaterialSubGroupRequest,
  CreateMaterialMasterRequest,
} from "../services/materialService";

type Tab = "groups" | "subgroups" | "materials";

const UOM_OPTIONS = [
  "Sqm", "Rmt", "Cum", "Nos", "Kg", "MT", "LS", "Sqft", "Cft", "Brass",
  "Each", "Set", "Trip", "Day", "Hr", "Litre", "Bag", "Bundle",
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
  initial?: MaterialGroupDto | null;
  onSave: (req: CreateMaterialGroupRequest) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {initial ? "Edit Material Group" : "Add Material Group"}
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
            onClick={() => {
              if (!name.trim()) return;
              onSave({ name: name.trim(), description: description.trim() || undefined });
            }}
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
  initial?: MaterialSubGroupDto | null;
  groups: MaterialGroupDto[];
  onSave: (req: CreateMaterialSubGroupRequest) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [groupId, setGroupId] = useState<number>(initial?.materialGroupId ?? 0);
  const [tolerancePercent, setTolerancePercent] = useState<string>(
    initial?.tolerancePercent?.toString() ?? ""
  );

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
            <label className="block text-xs font-medium text-gray-600 mb-1">Material Group *</label>
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
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tolerance %</label>
            <input
              type="number"
              step="0.01"
              value={tolerancePercent}
              onChange={(e) => setTolerancePercent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. 5"
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
            onClick={() => {
              if (!name.trim() || !groupId) return;
              onSave({
                name: name.trim(),
                description: description.trim() || undefined,
                materialGroupId: groupId,
                tolerancePercent: tolerancePercent ? Number(tolerancePercent) : undefined,
              });
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

// ─── Material Modal ───
function MaterialModal({
  initial,
  groups,
  onSave,
  onClose,
}: {
  initial?: MaterialMasterDto | null;
  groups: MaterialGroupDto[];
  onSave: (req: CreateMaterialMasterRequest) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [groupId, setGroupId] = useState<number>(initial?.materialGroupId ?? 0);
  const [subGroupId, setSubGroupId] = useState<number>(initial?.materialSubGroupId ?? 0);
  const [uom, setUom] = useState(initial?.uom ?? "");
  const [hsnCode, setHsnCode] = useState(initial?.hsnCode ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [subGroups, setSubGroups] = useState<MaterialSubGroupDto[]>([]);

  useEffect(() => {
    if (groupId) {
      materialSubGroupService.getByGroup(groupId).then(setSubGroups).catch(() => setSubGroups([]));
    } else {
      setSubGroups([]);
    }
  }, [groupId]);

  const handleGroupChange = (newGroupId: number) => {
    setGroupId(newGroupId);
    if (newGroupId !== initial?.materialGroupId) {
      setSubGroupId(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {initial ? "Edit Material" : "Add Material"}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Material name"
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Material Group *</label>
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
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">UOM *</label>
              <select
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">-- Select UOM --</option>
                {UOM_OPTIONS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">HSN Code</label>
              <input
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g. 2523"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Brand</label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Brand name"
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
                materialGroupId: groupId,
                materialSubGroupId: subGroupId || undefined,
                uom,
                hsnCode: hsnCode.trim() || undefined,
                brand: brand.trim() || undefined,
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
export default function MaterialGroupPage() {
  const [tab, setTab] = useState<Tab>("groups");

  // Data
  const [groups, setGroups] = useState<MaterialGroupDto[]>([]);
  const [subGroups, setSubGroups] = useState<MaterialSubGroupDto[]>([]);
  const [materials, setMaterials] = useState<MaterialMasterDto[]>([]);

  // Loading
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingSubGroups, setLoadingSubGroups] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Modals
  const [groupModal, setGroupModal] = useState<{ open: boolean; editing?: MaterialGroupDto | null }>({ open: false });
  const [subGroupModal, setSubGroupModal] = useState<{ open: boolean; editing?: MaterialSubGroupDto | null }>({ open: false });
  const [materialModal, setMaterialModal] = useState<{ open: boolean; editing?: MaterialMasterDto | null }>({ open: false });
  const [confirmDelete, setConfirmDelete] = useState<{ type: "group" | "subgroup" | "material"; id: number } | null>(null);

  // Filters
  const [sgFilterGroupId, setSgFilterGroupId] = useState<number>(0);
  const [matFilterGroupId, setMatFilterGroupId] = useState<number>(0);
  const [matFilterSubGroupId, setMatFilterSubGroupId] = useState<number>(0);
  const [matSubGroupOptions, setMatSubGroupOptions] = useState<MaterialSubGroupDto[]>([]);

  // ─── Load data ───
  const loadGroups = async () => {
    setLoadingGroups(true);
    try {
      const data = await materialGroupService.getAll();
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
        ? await materialSubGroupService.getByGroup(sgFilterGroupId)
        : await materialSubGroupService.getAll();
      setSubGroups(data);
    } catch (err) {
      console.error("Failed to load sub-groups:", err);
    }
    setLoadingSubGroups(false);
  };

  const loadMaterials = async () => {
    setLoadingMaterials(true);
    try {
      let data: MaterialMasterDto[];
      if (matFilterSubGroupId) {
        data = await materialMasterService.getBySubGroup(matFilterSubGroupId);
      } else if (matFilterGroupId) {
        data = await materialMasterService.getByGroup(matFilterGroupId);
      } else {
        data = await materialMasterService.getAll();
      }
      setMaterials(data);
    } catch (err) {
      console.error("Failed to load materials:", err);
    }
    setLoadingMaterials(false);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (tab === "subgroups") loadSubGroups();
  }, [tab, sgFilterGroupId]);

  useEffect(() => {
    if (tab === "materials") loadMaterials();
  }, [tab, matFilterGroupId, matFilterSubGroupId]);

  useEffect(() => {
    if (matFilterGroupId) {
      materialSubGroupService
        .getByGroup(matFilterGroupId)
        .then(setMatSubGroupOptions)
        .catch(() => setMatSubGroupOptions([]));
    } else {
      setMatSubGroupOptions([]);
      setMatFilterSubGroupId(0);
    }
  }, [matFilterGroupId]);

  // ─── Group handlers ───
  const handleSaveGroup = async (req: CreateMaterialGroupRequest) => {
    try {
      if (groupModal.editing) {
        await materialGroupService.update(groupModal.editing.id, req);
      } else {
        await materialGroupService.create(req);
      }
      setGroupModal({ open: false });
      loadGroups();
    } catch (err) {
      console.error("Failed to save group:", err);
    }
  };

  // ─── SubGroup handlers ───
  const handleSaveSubGroup = async (req: CreateMaterialSubGroupRequest) => {
    try {
      if (subGroupModal.editing) {
        await materialSubGroupService.update(subGroupModal.editing.id, req);
      } else {
        await materialSubGroupService.create(req);
      }
      setSubGroupModal({ open: false });
      loadSubGroups();
    } catch (err) {
      console.error("Failed to save sub-group:", err);
    }
  };

  // ─── Material handlers ───
  const handleSaveMaterial = async (req: CreateMaterialMasterRequest) => {
    try {
      if (materialModal.editing) {
        await materialMasterService.update(materialModal.editing.id, req);
      } else {
        await materialMasterService.create(req);
      }
      setMaterialModal({ open: false });
      loadMaterials();
    } catch (err) {
      console.error("Failed to save material:", err);
    }
  };

  // ─── Delete handler ───
  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === "group") {
        await materialGroupService.delete(confirmDelete.id);
        loadGroups();
      } else if (confirmDelete.type === "subgroup") {
        await materialSubGroupService.delete(confirmDelete.id);
        loadSubGroups();
      } else {
        await materialMasterService.delete(confirmDelete.id);
        loadMaterials();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
    setConfirmDelete(null);
  };

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
          { key: "groups" as Tab, label: "Material Groups" },
          { key: "subgroups" as Tab, label: "Sub-Groups" },
          { key: "materials" as Tab, label: "Materials" },
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

      {/* ════════ Tab 1: Material Groups ════════ */}
      {tab === "groups" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Material Groups</h2>
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
              No material groups found. Click "Add Group" to create one.
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
            <h2 className="text-lg font-semibold text-gray-800">Material Sub-Groups</h2>
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
                    <th className="text-left px-4 py-3 font-medium">Material Group</th>
                    <th className="text-center px-4 py-3 font-medium">Tolerance %</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subGroups.map((sg) => (
                    <tr key={sg.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{sg.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                          {sg.materialGroupName || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {sg.tolerancePercent != null ? `${sg.tolerancePercent}%` : "—"}
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

      {/* ════════ Tab 3: Materials ════════ */}
      {tab === "materials" && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Materials</h2>
            <div className="flex items-center gap-3">
              <select
                value={matFilterGroupId}
                onChange={(e) => {
                  setMatFilterGroupId(Number(e.target.value));
                  setMatFilterSubGroupId(0);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value={0}>All Groups</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <select
                value={matFilterSubGroupId}
                onChange={(e) => setMatFilterSubGroupId(Number(e.target.value))}
                disabled={!matFilterGroupId}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50"
              >
                <option value={0}>All Sub-Groups</option>
                {matSubGroupOptions.map((sg) => (
                  <option key={sg.id} value={sg.id}>{sg.name}</option>
                ))}
              </select>
              <button
                onClick={() => setMaterialModal({ open: true, editing: null })}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                + Add Material
              </button>
            </div>
          </div>

          {loadingMaterials ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : materials.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400 text-sm">
              No materials found. Click "Add Material" to create one.
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
                      <th className="text-left px-4 py-3 font-medium">HSN Code</th>
                      <th className="text-left px-4 py-3 font-medium">Brand</th>
                      <th className="text-center px-4 py-3 font-medium">Status</th>
                      <th className="text-right px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {materials.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                            {m.materialGroupName || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{m.materialSubGroupName || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            {m.uom}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{m.hsnCode || "—"}</td>
                        <td className="px-4 py-3 text-gray-500">{m.brand || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <ActiveBadge active={m.active} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setMaterialModal({ open: true, editing: m })}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: "material", id: m.id })}
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

      {materialModal.open && (
        <MaterialModal
          initial={materialModal.editing}
          groups={groups}
          onSave={handleSaveMaterial}
          onClose={() => setMaterialModal({ open: false })}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          message={`Are you sure you want to delete this ${
            confirmDelete.type === "group"
              ? "material group"
              : confirmDelete.type === "subgroup"
              ? "sub-group"
              : "material"
          }? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
