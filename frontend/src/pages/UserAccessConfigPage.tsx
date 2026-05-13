import { useState, useEffect } from "react";
import { userService } from "../services/userService";
import { authService } from "../services/authService";
import type { User, Role } from "../types/user";

/* ─── All configurable pages grouped by section ─── */
interface PageDef {
  key: string;
  label: string;
  path: string;
}
interface PageSection {
  section: string;
  pages: PageDef[];
}

const PAGE_SECTIONS: PageSection[] = [
  {
    section: "User Management",
    pages: [
      { key: "USER_ADD", label: "Add User", path: "/users/add" },
      { key: "USER_DELETE", label: "Delete User", path: "/users/delete" },
      { key: "USER_EDIT", label: "Edit User", path: "/users/edit" },
      { key: "USER_SUMMARY", label: "Users Summary", path: "/users" },
      { key: "ROLES", label: "Roles & Permissions", path: "/roles" },
    ],
  },
  {
    section: "Activities",
    pages: [
      { key: "SALE_ENTRY", label: "Sale Entry", path: "/activities/sale-entry" },
      { key: "SALE_QUOTE", label: "Sale Quote", path: "/activities/sale-quote" },
      { key: "FINANCE_SPENT", label: "Finance Spent", path: "/activities/finance-spent" },
      { key: "MASTER_PLAN", label: "Master Plan", path: "/activities/master-plan" },
      { key: "SITE_ATTENDANCE", label: "Site Attendance", path: "/activities/site-attendance" },
      { key: "PROJECT_DOCUMENTS", label: "Project Documents", path: "/activities/documents" },
      { key: "PARTNER_INVESTMENT", label: "Partner Investment", path: "/activities/partner-investment" },
    ],
  },
  {
    section: "Reports",
    pages: [
      { key: "ATTENDANCE_REPORTS", label: "Attendance Reports", path: "/reports/attendance" },
    ],
  },
  {
    section: "Admin Settings",
    pages: [
      { key: "PROJECTS", label: "Projects", path: "/admin/projects" },
      { key: "APPROVAL_CHAINS", label: "Approval Chains", path: "/admin/approval-chains" },
      { key: "CAPITOL_FUND", label: "Capital Fund", path: "/admin/capitol-fund" },
      { key: "PROJECT_ESTIMATION", label: "Project Estimation", path: "/admin/project-estimation" },
      { key: "USER_ACCESS_CONFIG", label: "User Access Config", path: "/admin/user-access" },
    ],
  },
];

const ALL_PAGE_KEYS = PAGE_SECTIONS.flatMap((s) => s.pages.map((p) => p.key));

export default function UserAccessConfigPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null); // userId being saved
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Selected user for editing
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editPages, setEditPages] = useState<Set<string>>(new Set());

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "", lastName: "", email: "", password: "", confirmPassword: "", phone: "",
    roleIds: [] as number[],
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Current admin
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [usersData, rolesData, me] = await Promise.all([
        userService.getAll(),
        userService.getAllRoles(),
        authService.getCurrentUser(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setCurrentUser(me);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  function isAdmin(user: User): boolean {
    return user.roles.some((r) => r.name === "ADMIN");
  }

  function selectUser(user: User) {
    setSelectedUserId(user.id);
    setEditPages(new Set(user.allowedPages || []));
    setSuccessMsg("");
    setError("");
  }

  function togglePage(key: string) {
    setEditPages((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSection(sectionPages: PageDef[]) {
    const keys = sectionPages.map((p) => p.key);
    const allSelected = keys.every((k) => editPages.has(k));
    setEditPages((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        keys.forEach((k) => next.delete(k));
      } else {
        keys.forEach((k) => next.add(k));
      }
      return next;
    });
  }

  function selectAllPages() {
    setEditPages(new Set(ALL_PAGE_KEYS));
  }

  function deselectAllPages() {
    setEditPages(new Set());
  }

  async function savePageAccess() {
    if (selectedUserId == null) return;
    setSaving(selectedUserId);
    setError("");
    try {
      const updated = await userService.updatePageAccess(selectedUserId, Array.from(editPages));
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setSuccessMsg("Page access saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to save page access.");
    } finally {
      setSaving(null);
    }
  }

  async function toggleUserActive(user: User) {
    try {
      const updated = await userService.update(user.id, { active: !user.active });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update user.");
    }
  }

  async function handleCreateUser() {
    setCreateError("");
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
      setCreateError("First Name, Last Name, Email, and Password are required.");
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      setCreateError("Passwords do not match.");
      return;
    }
    if (newUser.password.length < 6) {
      setCreateError("Password must be at least 6 characters.");
      return;
    }
    if (newUser.roleIds.length === 0) {
      setCreateError("Please select at least one role.");
      return;
    }
    setCreating(true);
    try {
      const created = await userService.create({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        password: newUser.password,
        phone: newUser.phone || undefined,
        roleIds: newUser.roleIds,
      });
      setUsers((prev) => [...prev, created]);
      setShowCreateModal(false);
      setNewUser({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", phone: "", roleIds: [] });
      setSuccessMsg(`User "${created.firstName} ${created.lastName}" created!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setCreateError(err.response?.data?.error || err.response?.data?.message || err.message || "Failed to create user.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteUser(user: User) {
    if (!confirm(`Delete user "${user.firstName} ${user.lastName}" (${user.email})?\n\nThis cannot be undone.`)) return;
    try {
      await userService.delete(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      if (selectedUserId === user.id) setSelectedUserId(null);
      setSuccessMsg("User deleted.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete user.");
    }
  }

  async function handleResetPassword(user: User) {
    if (!confirm(`Reset password for "${user.firstName} ${user.lastName}"?\n\nA temporary password will be generated.`)) return;
    try {
      await authService.adminResetPassword(user.email);
      setSuccessMsg(`Password reset for ${user.email}. They will be asked to set a new password on next login.`);
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reset password.");
    }
  }

  const selectedUser = users.find((u) => u.id === selectedUserId) || null;
  const filteredUsers = searchQuery.trim()
    ? users.filter((u) => {
        const q = searchQuery.toLowerCase();
        return (
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.roles.some((r) => r.name.toLowerCase().includes(q))
        );
      })
    : users;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-arcadia-600 mr-3" />
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-lg sm:text-2xl font-bold text-arcadia-800">User Access Configuration</h1>
        <button onClick={() => setShowCreateModal(true)}
          className="bg-arcadia-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-arcadia-700 transition self-start sm:self-auto">
          + Create User
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <button onClick={() => setError("")} className="float-right text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{successMsg}</div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
        {/* ═══ LEFT: User List ═══ */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Users ({users.length})</h3>
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500 outline-none"
            />
          </div>
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
            {filteredUsers.map((user) => {
              const selected = selectedUserId === user.id;
              const adminUser = isAdmin(user);
              const pageCount = user.allowedPages?.length || 0;
              return (
                <div key={user.id}
                  onClick={() => selectUser(user)}
                  className={`px-4 py-3 cursor-pointer transition ${
                    selected ? "bg-arcadia-50 border-l-4 border-arcadia-600" : "hover:bg-gray-50 border-l-4 border-transparent"
                  } ${!user.active ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                    {!user.active && (
                      <span className="text-[9px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Inactive</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {user.roles.map((r) => (
                      <span key={r.id} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                        r.name === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {r.name}
                      </span>
                    ))}
                    <span className="text-[9px] text-gray-400 ml-auto">
                      {adminUser ? "All pages" : `${pageCount} page${pageCount !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredUsers.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                {searchQuery ? "No users match your search." : "No users found."}
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT: Page Access Configuration ═══ */}
        <div className="flex-1 min-w-0">
          {selectedUser ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* User info header */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h2>
                    <p className="text-xs text-gray-500">{selectedUser.email}</p>
                    <div className="flex gap-1.5 mt-1">
                      {selectedUser.roles.map((r) => (
                        <span key={r.id} className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          r.name === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-50 text-blue-600"
                        }`}>
                          {r.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => toggleUserActive(selectedUser)}
                      className={`text-[10px] sm:text-xs font-medium px-2.5 py-1.5 rounded-lg border transition ${
                        selectedUser.active
                          ? "text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100"
                          : "text-green-600 bg-green-50 border-green-200 hover:bg-green-100"
                      }`}>
                      {selectedUser.active ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => handleResetPassword(selectedUser)}
                      className="text-[10px] sm:text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition">
                      Reset Password
                    </button>
                    {currentUser && currentUser.id !== selectedUser.id && (
                      <button onClick={() => handleDeleteUser(selectedUser)}
                        className="text-[10px] sm:text-xs font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition">
                        Delete User
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isAdmin(selectedUser) ? (
                <div className="px-6 py-12 text-center">
                  <div className="text-5xl mb-3">&#128272;</div>
                  <p className="text-gray-700 font-medium">Admin users have access to all pages</p>
                  <p className="text-sm text-gray-400 mt-1">Remove the ADMIN role to configure page access individually.</p>
                </div>
              ) : (
                <>
                  {/* Page Access Grid */}
                  <div className="px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-700">Page Access</h3>
                      <div className="flex items-center gap-2">
                        <button onClick={selectAllPages}
                          className="text-[10px] sm:text-xs text-arcadia-600 hover:text-arcadia-800 font-medium">
                          Select All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button onClick={deselectAllPages}
                          className="text-[10px] sm:text-xs text-gray-500 hover:text-gray-700 font-medium">
                          Deselect All
                        </button>
                        <span className="text-gray-300 hidden sm:inline">|</span>
                        <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:inline">
                          {editPages.size} of {ALL_PAGE_KEYS.length} selected
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {PAGE_SECTIONS.map((section) => {
                        const allChecked = section.pages.every((p) => editPages.has(p.key));
                        const someChecked = section.pages.some((p) => editPages.has(p.key));
                        return (
                          <div key={section.section} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Section header with toggle all */}
                            <div className="px-3 sm:px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-3 cursor-pointer"
                              onClick={() => toggleSection(section.pages)}>
                              <input type="checkbox"
                                checked={allChecked}
                                ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                                onChange={() => toggleSection(section.pages)}
                                className="rounded border-gray-300 text-arcadia-600 focus:ring-arcadia-500 cursor-pointer" />
                              <span className="text-xs sm:text-sm font-semibold text-gray-700">{section.section}</span>
                              <span className="text-[10px] text-gray-400 ml-auto">
                                {section.pages.filter((p) => editPages.has(p.key)).length}/{section.pages.length}
                              </span>
                            </div>
                            {/* Page checkboxes */}
                            <div className="px-3 sm:px-4 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                              {section.pages.map((page) => (
                                <label key={page.key}
                                  className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                                  <input type="checkbox"
                                    checked={editPages.has(page.key)}
                                    onChange={() => togglePage(page.key)}
                                    className="rounded border-gray-300 text-arcadia-600 focus:ring-arcadia-500 cursor-pointer" />
                                  <span className="text-xs sm:text-sm text-gray-700">{page.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{editPages.size} page(s) selected</span>
                    <button onClick={savePageAccess} disabled={saving === selectedUserId}
                      className="bg-arcadia-600 text-white px-5 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-arcadia-700 transition disabled:opacity-50">
                      {saving === selectedUserId ? "Saving..." : "Save Access"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-center py-16 sm:py-20">
              <div className="text-5xl sm:text-6xl text-gray-200 mb-4">&#128100;</div>
              <p className="text-gray-500 font-medium">Select a user from the list</p>
              <p className="text-sm text-gray-400 mt-1">to configure their page access permissions.</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Create User Modal ═══ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Create New User</h2>
              <button onClick={() => { setShowCreateModal(false); setCreateError(""); }}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{createError}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                  <input type="text" value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
                  <input type="text" value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input type="email" value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input type="tel" value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
                  <input type="password" value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password *</label>
                  <input type="password" value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Roles *</label>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => {
                    const selected = newUser.roleIds.includes(role.id);
                    return (
                      <button key={role.id} type="button"
                        onClick={() => {
                          setNewUser((prev) => ({
                            ...prev,
                            roleIds: selected
                              ? prev.roleIds.filter((id) => id !== role.id)
                              : [...prev.roleIds, role.id],
                          }));
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
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
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => { setShowCreateModal(false); setCreateError(""); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">
                Cancel
              </button>
              <button onClick={handleCreateUser} disabled={creating}
                className="bg-arcadia-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-arcadia-700 transition disabled:opacity-50">
                {creating ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
