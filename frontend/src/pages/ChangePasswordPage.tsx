import { useEffect, useState } from "react";
import api from "../services/api";
import { authService } from "../services/authService";
import { userService } from "../services/userService";
import type { User } from "../types/user";
import PasswordInput from "../components/PasswordInput";

export default function ChangePasswordPage() {
  const [, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [mode, setMode] = useState<"self" | "admin">("self");

  // Form fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      setCurrentUser(user);
      const admin = user.role?.name === "ADMIN";
      setIsAdmin(admin);
      if (admin) {
        setMode("admin");
        userService.getAll().then((users) => {
          setAllUsers(users);
        }).catch((err) => {
          console.error("Failed to load users:", err);
          setError("Failed to load user list. Please refresh the page.");
        });
      }
    }).catch(() => { });
  }, []);

  // When user selection changes
  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedUserId(id || null);
    const user = allUsers.find((u) => u.id === id);
    setSelectedUserEmail(user?.email || "");
    setError("");
    setSuccess("");
    setPasswordError("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewPassword(val);
    if (confirmPassword && val !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
    } else {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (newPassword && val !== newPassword) {
      setPasswordError("New password and confirm password do not match.");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    if (mode === "self") {
      if (currentPassword === newPassword) {
        setError("New password must be different from the current password.");
        return;
      }
    }

    if (mode === "admin" && !selectedUserId) {
      setError("Please select a user.");
      return;
    }

    setSaving(true);
    try {
      if (mode === "admin") {
        const res = await api.put(`/auth/admin-reset-password`, {
          userId: selectedUserId,
          newPassword: newPassword,
        });
        setSuccess(res.data.message || `Password has been reset successfully for ${selectedUserEmail}`);
      } else {
        await api.put("/auth/change-password", {
          currentPassword: currentPassword,
          newPassword: newPassword,
        });
        setSuccess("Password changed successfully.");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
    } catch {
      setError(
        mode === "admin"
          ? "Failed to reset password."
          : "Failed to change password. Please check your current password."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Change Password</h2>

      {/* Admin toggle */}
      {isAdmin && (
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => { setMode("admin"); setError(""); setSuccess(""); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${mode === "admin"
                ? "bg-arcadia-600 text-white border-arcadia-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-arcadia-400"
              }`}
          >
            Reset User Password
          </button>
          <button
            type="button"
            onClick={() => { setMode("self"); setError(""); setSuccess(""); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${mode === "self"
                ? "bg-arcadia-600 text-white border-arcadia-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-arcadia-400"
              }`}
          >
            Change My Password
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Admin mode: user selector + disabled email */}
          {mode === "admin" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select User *</label>
                <select
                  value={selectedUserId ?? ""}
                  onChange={handleUserSelect}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500 outline-none text-sm bg-white"
                >
                  <option value="">-- Select a user --</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} — {u.email} ({u.role?.name ?? "No role"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-400 font-normal">(new password will be shared to this email)</span>
                </label>
                <input
                  type="email"
                  value={selectedUserEmail}
                  disabled
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-blue-50 text-gray-800 text-sm font-medium cursor-not-allowed"
                />
                {selectedUserId && !selectedUserEmail && (
                  <p className="mt-1 text-sm text-red-500">No email found for this user. Please update the user's email in Edit User.</p>
                )}
              </div>
            </>
          )}

          {/* Self mode: current password */}
          {mode === "self" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password *</label>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Enter current password"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password * (min 8 characters)</label>
            <PasswordInput
              value={newPassword}
              onChange={handleNewPasswordChange}
              required
              minLength={8}
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password *</label>
            <PasswordInput
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
              minLength={8}
              placeholder="Re-enter new password"
            />
            {passwordError && (
              <p className="mt-1.5 text-sm text-red-600">{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !!passwordError}
            className="px-5 py-2 text-sm font-medium text-white bg-arcadia-600 rounded-lg hover:bg-arcadia-700 transition disabled:opacity-50"
          >
            {saving ? "Processing..." : mode === "admin" ? "Reset Password" : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
