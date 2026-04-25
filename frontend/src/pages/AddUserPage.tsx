import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Role, CreateUserRequest } from "../types/user";
import { userService } from "../services/userService";

export default function AddUserPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState<CreateUserRequest>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    roleIds: [],
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userService.getAllRoles().then(setRoles).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleRole = (roleId: number) => {
    setForm((prev) => {
      const ids = new Set(prev.roleIds);
      if (ids.has(roleId)) ids.delete(roleId);
      else ids.add(roleId);
      return { ...prev, roleIds: Array.from(ids) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.roleIds.length === 0) {
      setError("Please select at least one role.");
      return;
    }
    setSaving(true);
    try {
      await userService.create(form);
      navigate("/users");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add User</h2>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500 outline-none text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required
              placeholder="user@arcadiapremium.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500 outline-none text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password * (min 8 characters)</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500 outline-none text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500 outline-none text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Roles *</label>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => {
                const selected = form.roleIds.includes(role.id);
                return (
                  <button key={role.id} type="button" onClick={() => toggleRole(role.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                      selected
                        ? "bg-arcadia-600 text-white border-arcadia-600"
                        : "bg-white text-gray-600 border-gray-300 hover:border-arcadia-400"
                    }`}>
                    {role.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-arcadia-600 rounded-lg hover:bg-arcadia-700 transition disabled:opacity-50">
              {saving ? "Creating..." : "Create User"}
            </button>
            <button type="button" onClick={() => navigate("/users")}
              className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
