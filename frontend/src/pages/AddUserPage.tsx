import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Role, CreateUserRequest } from "../types/user";
import { userService } from "../services/userService";
import PasswordInput from "../components/PasswordInput";

export default function AddUserPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState<CreateUserRequest>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    roleId: 0,
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userService.getAllRoles().then(setRoles).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Live validation when confirm password changes
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (val && form.password && val !== form.password) {
      setPasswordError("Passwords do not match.");
    } else {
      setPasswordError("");
    }
  };

  // Also re-validate when password field changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm({ ...form, password: val });
    if (confirmPassword && val !== confirmPassword) {
      setPasswordError("Passwords do not match.");
    } else {
      setPasswordError("");
    }
  };

  const selectRole = (roleId: number) => {
    setForm((prev) => ({ ...prev, roleId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (!form.roleId) {
      setError("Please select a role.");
      return;
    }

    setSaving(true);
    try {
      await userService.create(form);
      navigate("/users");
    } catch (err: unknown) {
      // Extract message from Axios error response (backend returns { message: "..." })
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      const status = axiosErr?.response?.status;
      const serverMsg = axiosErr?.response?.data?.message;

      if (status === 409 || (serverMsg && serverMsg.toLowerCase().includes("already in use"))) {
        setError("This email is already registered. Please use a different email address.");
      } else if (serverMsg) {
        setError(serverMsg);
      } else {
        setError(err instanceof Error ? err.message : "Failed to create user");
      }
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
            <PasswordInput
              value={form.password}
              onChange={handlePasswordChange}
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
            <PasswordInput
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
              minLength={8}
              placeholder="Re-enter password"
            />
            {passwordError && (
              <p className="mt-1.5 text-sm text-red-600">{passwordError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500 outline-none text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
            <select
              value={form.roleId}
              onChange={(e) => selectRole(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500 outline-none text-sm bg-white"
            >
              <option value={0}>-- Select a role --</option>
              {roles.filter((r) => r.name !== "ADMIN").map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || !!passwordError}
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
