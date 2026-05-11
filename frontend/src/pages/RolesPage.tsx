import { useEffect, useState } from "react";
import type { Role, Permission } from "../types/user";
import { userService } from "../services/userService";

/* ─── tiny confirm modal ─── */
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
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <p className="text-gray-800 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── role form modal ─── */
function RoleFormModal({
  role,
  allPermissions,
  saving,
  onSave,
  onCancel,
}: {
  role: Role | null; // null = create mode
  allPermissions: Permission[];
  saving: boolean;
  onSave: (name: string, description: string, permissionIds: number[]) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selectedPerms, setSelectedPerms] = useState<Set<number>>(
    new Set(role?.permissions.map((p) => p.id) ?? [])
  );

  // Group permissions by module
  const grouped: Record<string, Permission[]> = {};
  for (const p of allPermissions) {
    const mod = p.module || "OTHER";
    if (!grouped[mod]) grouped[mod] = [];
    grouped[mod].push(p);
  }

  function togglePerm(id: number) {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleModule(moduleName: string) {
    const modulePermIds = grouped[moduleName].map((p) => p.id);
    const allSelected = modulePermIds.every((id) => selectedPerms.has(id));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      for (const id of modulePermIds) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim(), Array.from(selectedPerms));
  }

  const isEdit = role !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            {isEdit ? "Edit Role" : "Create New Role"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MANAGER"
              required
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Will be auto-converted to UPPERCASE with underscores
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Project Manager with limited admin access"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500"
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            {Object.keys(grouped).length === 0 ? (
              <p className="text-sm text-gray-400">No permissions available</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(grouped)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([moduleName, perms]) => {
                    const allChecked = perms.every((p) => selectedPerms.has(p.id));
                    const someChecked =
                      !allChecked && perms.some((p) => selectedPerms.has(p.id));
                    return (
                      <div
                        key={moduleName}
                        className="border rounded-lg p-3 bg-gray-50"
                      >
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            ref={(el) => {
                              if (el) el.indeterminate = someChecked;
                            }}
                            onChange={() => toggleModule(moduleName)}
                            className="w-4 h-4 text-arcadia-600 rounded"
                          />
                          <span className="text-sm font-semibold text-gray-700">
                            {moduleName.replace(/_/g, " ")}
                          </span>
                        </label>
                        <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {perms.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-center gap-2 cursor-pointer py-0.5"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPerms.has(perm.id)}
                                onChange={() => togglePerm(perm.id)}
                                className="w-3.5 h-3.5 text-arcadia-600 rounded"
                              />
                              <span className="text-xs text-gray-600">
                                {perm.name.replace(/_/g, " ")}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (name.trim()) onSave(name.trim(), description.trim(), Array.from(selectedPerms));
            }}
            disabled={saving || !name.trim()}
            className="px-5 py-2 text-sm bg-arcadia-600 text-white rounded-lg hover:bg-arcadia-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Update Role" : "Create Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  // Error / success
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function refresh() {
    setLoading(true);
    // Load roles first; permissions may fail if backend hasn't been updated yet
    userService
      .getAllRoles()
      .then((r) => {
        setRoles(r);
        // Try to load permissions separately — non-blocking
        return userService.getAllPermissions().catch(() => [] as Permission[]);
      })
      .then((p) => setAllPermissions(p))
      .catch(() => setError("Failed to load roles"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  // Auto-clear messages
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  /* ─── handlers ─── */
  function openCreate() {
    setEditingRole(null);
    setShowForm(true);
  }

  function openEdit(role: Role) {
    setEditingRole(role);
    setShowForm(true);
  }

  async function handleSave(name: string, description: string, permissionIds: number[]) {
    setSaving(true);
    setError("");
    try {
      if (editingRole) {
        await userService.updateRole(editingRole.id, name, description, permissionIds);
        setSuccess(`Role "${name}" updated successfully`);
      } else {
        await userService.createRole(name, description, permissionIds);
        setSuccess(`Role "${name}" created successfully`);
      }
      setShowForm(false);
      setEditingRole(null);
      refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      await userService.deleteRole(deleteTarget.id);
      setSuccess(`Role "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to delete role");
    } finally {
      setSaving(false);
    }
  }

  /* ─── render ─── */
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Roles & Permissions</h2>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-arcadia-600 text-white text-sm font-medium rounded-lg hover:bg-arcadia-700 transition"
        >
          + Add Role
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-400 col-span-full text-center py-12">
            Loading roles...
          </p>
        ) : roles.length === 0 ? (
          <p className="text-gray-400 col-span-full text-center py-12">
            No roles configured. Click "+ Add Role" to create one.
          </p>
        ) : (
          roles.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-xl shadow-sm border p-6 flex flex-col"
            >
              {/* Role Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {role.name}
                  </h3>
                  {role.description && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {role.description}
                    </p>
                  )}
                </div>
                <span className="text-xs bg-arcadia-50 text-arcadia-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                  {role.permissions.length} perms
                </span>
              </div>

              {/* Permissions grouped by module */}
              <div className="mt-4 flex-1">
                <p className="text-xs font-medium text-gray-400 uppercase mb-2">
                  Permissions
                </p>
                {role.permissions.length === 0 ? (
                  <p className="text-xs text-gray-300 italic">
                    No permissions assigned
                  </p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(
                      role.permissions.reduce<Record<string, Permission[]>>(
                        (acc, perm) => {
                          const mod = perm.module || "OTHER";
                          if (!acc[mod]) acc[mod] = [];
                          acc[mod].push(perm);
                          return acc;
                        },
                        {}
                      )
                    )
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([mod, perms]) => (
                        <div key={mod}>
                          <p className="text-xs font-semibold text-gray-500 mb-0.5">
                            {mod.replace(/_/g, " ")}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {perms.map((perm) => (
                              <span
                                key={perm.id}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                              >
                                {perm.name.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t flex gap-3">
                <button
                  onClick={() => openEdit(role)}
                  className="px-3 py-1.5 text-xs font-medium text-arcadia-600 bg-arcadia-50 hover:bg-arcadia-100 rounded-lg transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(role)}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <RoleFormModal
          role={editingRole}
          allPermissions={allPermissions}
          saving={saving}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingRole(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmModal
          message={`Are you sure you want to delete the role "${deleteTarget.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
