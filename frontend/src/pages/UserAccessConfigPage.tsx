import { useState, useEffect, useCallback } from "react";
import { userService } from "../services/userService";
import { authService } from "../services/authService";
import { folderService } from "../services/folderService";
import type { FolderDto } from "../services/folderService";
import { folderPermissionService } from "../services/folderPermissionService";
import { projectService } from "../services/projectService";
import type { ProjectDto } from "../services/projectService";
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
      { key: "WALK_INS", label: "Walk-Ins", path: "/activities/walk-ins" },
      { key: "EXPENSES_SUMMARY", label: "Expenses Summary", path: "/activities/expenses" },
      { key: "PUJA_EXPENSES", label: "Puja Expenses", path: "/activities/expenses/puja" },
      { key: "WEEKLY_EXPENSES", label: "Weekly Expenses", path: "/activities/expenses/weekly" },
      { key: "PETROL_EXPENSES", label: "Petrol Expenses", path: "/activities/expenses/petrol" },
      { key: "LAND_CONVERTER", label: "Land Converter", path: "/activities/land-converter" },
    ],
  },
  {
    section: "Subcontracting",
    pages: [
      { key: "SUBCONTRACTING_DASHBOARD", label: "Dashboard", path: "/subcontracting/dashboard" },
      { key: "CONTRACTORS", label: "Contractors", path: "/subcontracting/contractors" },
      { key: "ACTIVITY_MASTER", label: "Activity Master", path: "/subcontracting/activity-master" },
      { key: "JOBS_WBS", label: "Jobs / WBS", path: "/subcontracting/jobs" },
      { key: "JOB_ESTIMATION", label: "Job Estimation", path: "/subcontracting/estimation" },
      { key: "WORK_ORDERS", label: "Work Orders", path: "/subcontracting/work-orders" },
    ],
  },
  {
    section: "Subcontracting (Billing)",
    pages: [
      { key: "MEASUREMENT_BOOK", label: "Measurement Books", path: "/subcontracting/measurement-books" },
      { key: "RA_BILLS", label: "RA Bills", path: "/subcontracting/ra-bills" },
      { key: "RA_BILL_PAYMENT_CERT", label: "RA Bill Payments", path: "/subcontracting/ra-payments" },
    ],
  },
  {
    section: "Subcontracting (Costing & Config)",
    pages: [
      { key: "COSTING_STANDARD_HEAD", label: "Costing - Standard Head", path: "/subcontracting/costing-standard" },
      { key: "COSTING_CUSTOM_HEAD", label: "Costing - Custom Head", path: "/subcontracting/costing-custom" },
      { key: "MAP_COST_HEAD", label: "Map Cost Head", path: "/subcontracting/map-cost-head" },
      { key: "WO_TEMPLATE_SETTING", label: "WO Template Setting", path: "/subcontracting/wo-templates" },
    ],
  },
  {
    section: "Subcontracting (Reports)",
    pages: [
      { key: "WO_REPORTS", label: "Work Order Reports", path: "/subcontracting/wo-reports" },
      { key: "CONTRACTOR_BILL_REPORT", label: "Contractor Bill Report", path: "/subcontracting/contractor-bill-report" },
      { key: "WO_REPORT_BY_UNIT", label: "WO Report By Unit", path: "/subcontracting/wo-report-unit" },
      { key: "WO_REPORT_BY_ACTIVITY", label: "WO Report By Activity", path: "/subcontracting/wo-report-activity" },
      { key: "MB_REPORT_BY_ACTIVITY", label: "MB Report By Activity", path: "/subcontracting/mb-report-activity" },
      { key: "BILL_APPROVAL_HISTORY", label: "Bill Approval History", path: "/subcontracting/bill-approval-history" },
      { key: "RATE_ANALYSIS", label: "Rate Analysis", path: "/subcontracting/rate-analysis" },
    ],
  },
  {
    section: "Project Execution",
    pages: [
      { key: "PROJ_EXECUTION_TEMPLATE", label: "Execution Templates", path: "/execution/templates" },
      { key: "DAILY_EXECUTION_UPDATE", label: "Daily Execution Update", path: "/execution/daily-update" },
    ],
  },
  {
    section: "Material Management",
    pages: [
      { key: "VENDOR_LIST", label: "Vendors", path: "/material/vendors" },
      { key: "MATERIAL_MASTER", label: "Material Groups", path: "/material/groups" },
      { key: "VENDOR_MATERIAL_MAP", label: "Vendor-Material Mapping", path: "/material/vendor-mapping" },
      { key: "MATERIAL_RATE", label: "Material Rates", path: "/material/rates" },
      { key: "WAREHOUSE", label: "Warehouses", path: "/material/warehouses" },
      { key: "MATERIAL_BOQ", label: "Material BOQ", path: "/material/boq" },
    ],
  },
  {
    section: "Supply Chain",
    pages: [
      { key: "MATERIAL_REQUISITION", label: "Requisitions", path: "/supply-chain/requisitions" },
      { key: "MATERIAL_INDENT", label: "Indents", path: "/supply-chain/indents" },
      { key: "PURCHASE_ORDER", label: "Purchase Orders", path: "/supply-chain/purchase-orders" },
      { key: "MRN", label: "MRN", path: "/supply-chain/mrn" },
      { key: "GRN", label: "GRN", path: "/supply-chain/grn" },
      { key: "MATERIAL_ISSUE", label: "Material Issues", path: "/supply-chain/issues" },
      { key: "PURCHASE_BILL", label: "Purchase Bills", path: "/supply-chain/purchase-bills" },
      { key: "PO_PAYMENT_CERT", label: "PO Payments", path: "/supply-chain/po-payments" },
      { key: "STOCK_TRANSFER", label: "Stock Transfers", path: "/supply-chain/stock-transfers" },
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
  const [editViewOnlyPages, setEditViewOnlyPages] = useState<Set<string>>(new Set());

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "", lastName: "", email: "", password: "", confirmPassword: "", phone: "",
    roleId: 0 as number,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Current admin
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Tab state for right panel
  const [activeTab, setActiveTab] = useState<"pages" | "documents">("pages");

  // Document Access state
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [docProject, setDocProject] = useState<string>("");
  const [folderTree, setFolderTree] = useState<FolderDto[]>([]);
  const [folderPerms, setFolderPerms] = useState<Map<number, string>>(new Map()); // folderId -> permission level
  const [originalPerms, setOriginalPerms] = useState<Map<number, string>>(new Map());
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [savingDocs, setSavingDocs] = useState(false);
  const [docSuccessMsg, setDocSuccessMsg] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [usersData, rolesData, me, projectsData] = await Promise.all([
        userService.getAll(),
        userService.getAllRoles(),
        authService.getCurrentUser(),
        projectService.getActiveProjects(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setCurrentUser(me);
      setProjects(projectsData);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  function isAdmin(user: User): boolean {
    return user.role?.name === "ADMIN";
  }

  function selectUser(user: User) {
    setSelectedUserId(user.id);
    setEditPages(new Set(user.allowedPages || []));
    setEditViewOnlyPages(new Set(user.viewOnlyPages || []));
    setSuccessMsg("");
    setError("");
    // Reset document access when switching users
    setDocProject("");
    setFolderTree([]);
    setFolderPerms(new Map());
    setOriginalPerms(new Map());
    setDocSuccessMsg("");
  }

  /** Get page access state: "none" | "view" | "full" */
  function getPageState(key: string): "none" | "view" | "full" {
    if (editPages.has(key)) return "full";
    if (editViewOnlyPages.has(key)) return "view";
    return "none";
  }

  /** Set page access state — ensures mutual exclusion between full and view-only */
  function setPageState(key: string, state: "none" | "view" | "full") {
    setEditPages((prev) => {
      const next = new Set(prev);
      if (state === "full") next.add(key); else next.delete(key);
      return next;
    });
    setEditViewOnlyPages((prev) => {
      const next = new Set(prev);
      if (state === "view") next.add(key); else next.delete(key);
      return next;
    });
  }

  function toggleSectionFull(sectionPages: PageDef[]) {
    const keys = sectionPages.map((p) => p.key);
    const allFull = keys.every((k) => editPages.has(k));
    keys.forEach((k) => setPageState(k, allFull ? "none" : "full"));
  }

  function selectAllPages() {
    setEditPages(new Set(ALL_PAGE_KEYS));
    setEditViewOnlyPages(new Set());
  }

  function deselectAllPages() {
    setEditPages(new Set());
    setEditViewOnlyPages(new Set());
  }

  function viewAllPages() {
    setEditPages(new Set());
    setEditViewOnlyPages(new Set(ALL_PAGE_KEYS));
  }

  async function savePageAccess() {
    if (selectedUserId == null) return;
    setSaving(selectedUserId);
    setError("");
    try {
      const updated = await userService.updatePageAccess(
        selectedUserId,
        Array.from(editPages),
        Array.from(editViewOnlyPages),
      );
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
    if (!newUser.roleId) {
      setCreateError("Please select a role.");
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
        roleId: newUser.roleId,
      });
      setUsers((prev) => [...prev, created]);
      setShowCreateModal(false);
      setNewUser({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", phone: "", roleId: 0 });
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

  /* ─── Document Access helpers ─── */

  /** Flatten folder tree into a list with depth for rendering */
  function flattenTree(nodes: FolderDto[], depth = 0): { folder: FolderDto; depth: number }[] {
    const result: { folder: FolderDto; depth: number }[] = [];
    for (const node of nodes) {
      result.push({ folder: node, depth });
      if (node.children && node.children.length > 0) {
        result.push(...flattenTree(node.children, depth + 1));
      }
    }
    return result;
  }

  /** Load folder tree and user permissions when project changes */
  const loadDocAccess = useCallback(async (projectName: string, userEmail: string) => {
    if (!projectName || !userEmail) return;
    setLoadingFolders(true);
    setDocSuccessMsg("");
    try {
      const [tree, userPerms] = await Promise.all([
        folderService.getTree(projectName),
        folderPermissionService.getPermissionsByUser(userEmail),
      ]);
      setFolderTree(tree);

      // Build a map of folderId -> permissionLevel for the selected user
      const permMap = new Map<number, string>();
      for (const perm of userPerms) {
        permMap.set(perm.folderId, perm.permissionLevel);
      }
      setFolderPerms(new Map(permMap));
      setOriginalPerms(new Map(permMap));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load document access.");
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  /** Handle project change in Document Access tab */
  function handleDocProjectChange(projectName: string) {
    setDocProject(projectName);
    if (projectName && selectedUserId != null) {
      const user = users.find((u) => u.id === selectedUserId);
      if (user) loadDocAccess(projectName, user.email);
    } else {
      setFolderTree([]);
      setFolderPerms(new Map());
      setOriginalPerms(new Map());
    }
  }

  /** Set permission for a folder */
  function setFolderPerm(folderId: number, level: string) {
    setFolderPerms((prev) => {
      const next = new Map(prev);
      if (level === "NONE") {
        next.delete(folderId);
      } else {
        next.set(folderId, level);
      }
      return next;
    });
  }

  /** Check if Document Access has unsaved changes */
  function docHasChanges(): boolean {
    if (folderPerms.size !== originalPerms.size) return true;
    for (const [key, val] of folderPerms) {
      if (originalPerms.get(key) !== val) return true;
    }
    for (const key of originalPerms.keys()) {
      if (!folderPerms.has(key)) return true;
    }
    return false;
  }

  /** Save document access changes */
  async function saveDocAccess() {
    if (!selectedUserId || !docProject) return;
    const user = users.find((u) => u.id === selectedUserId);
    if (!user) return;

    setSavingDocs(true);
    setError("");
    try {
      const permissions: { folderId: number; permissionLevel: string }[] = [];
      for (const [folderId, level] of folderPerms) {
        permissions.push({ folderId, permissionLevel: level });
      }
      await folderPermissionService.batchUpdatePermissions(user.email, docProject, permissions);
      setOriginalPerms(new Map(folderPerms));
      setDocSuccessMsg("Document access saved successfully!");
      setTimeout(() => setDocSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save document access.");
    } finally {
      setSavingDocs(false);
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
          (u.role?.name?.toLowerCase().includes(q) ?? false)
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
              const fullCount = user.allowedPages?.length || 0;
              const viewCount = user.viewOnlyPages?.length || 0;
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
                    {user.role && (
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                        user.role.name === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {user.role.name}
                      </span>
                    )}
                    <span className="text-[9px] text-gray-400 ml-auto">
                      {adminUser ? "All pages" : (
                        <>
                          {fullCount} full{viewCount > 0 && <>, {viewCount} view</>}
                        </>
                      )}
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
                      {selectedUser.role && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          selectedUser.role.name === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-50 text-blue-600"
                        }`}>
                          {selectedUser.role.name}
                        </span>
                      )}
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
                  <p className="text-gray-700 font-medium">Admin users have access to all pages and documents</p>
                  <p className="text-sm text-gray-400 mt-1">This user has the Admin role.</p>
                </div>
              ) : (
                <>
                  {/* ═══ Tabs ═══ */}
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab("pages")}
                      className={`flex-1 px-4 py-3 text-xs sm:text-sm font-medium transition border-b-2 ${
                        activeTab === "pages"
                          ? "border-arcadia-600 text-arcadia-700 bg-arcadia-50/40"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Page Access
                    </button>
                    <button
                      onClick={() => setActiveTab("documents")}
                      className={`flex-1 px-4 py-3 text-xs sm:text-sm font-medium transition border-b-2 ${
                        activeTab === "documents"
                          ? "border-arcadia-600 text-arcadia-700 bg-arcadia-50/40"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Document Access
                    </button>
                  </div>

                  {/* ═══ Page Access Tab ═══ */}
                  {activeTab === "pages" && (
                    <>
                      <div className="px-4 sm:px-6 py-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-gray-700">Page Access</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={selectAllPages}
                              className="text-[10px] sm:text-xs text-arcadia-600 hover:text-arcadia-800 font-medium">
                              All Full
                            </button>
                            <span className="text-gray-300">|</span>
                            <button onClick={viewAllPages}
                              className="text-[10px] sm:text-xs text-amber-600 hover:text-amber-800 font-medium">
                              All View
                            </button>
                            <span className="text-gray-300">|</span>
                            <button onClick={deselectAllPages}
                              className="text-[10px] sm:text-xs text-gray-500 hover:text-gray-700 font-medium">
                              All None
                            </button>
                            <span className="text-gray-300 hidden sm:inline">|</span>
                            <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:inline">
                              {editPages.size} full, {editViewOnlyPages.size} view
                            </span>
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 mb-3 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-100 border border-red-300" /> No Access (hidden)
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-100 border border-amber-400" /> View Only (read-only)
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-100 border border-green-400" /> Full Access
                          </span>
                        </div>

                        <div className="space-y-4">
                          {PAGE_SECTIONS.map((section) => {
                            const fullCount = section.pages.filter((p) => editPages.has(p.key)).length;
                            const viewCount = section.pages.filter((p) => editViewOnlyPages.has(p.key)).length;
                            const allFull = section.pages.every((p) => editPages.has(p.key));
                            return (
                              <div key={section.section} className="border border-gray-200 rounded-lg overflow-hidden">
                                {/* Section header */}
                                <div className="px-3 sm:px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                                  <input type="checkbox"
                                    checked={allFull}
                                    onChange={() => toggleSectionFull(section.pages)}
                                    title="Toggle all to Full Access"
                                    className="rounded border-gray-300 text-arcadia-600 focus:ring-arcadia-500 cursor-pointer" />
                                  <span className="text-xs sm:text-sm font-semibold text-gray-700">{section.section}</span>
                                  <span className="text-[10px] text-gray-400 ml-auto">
                                    {fullCount} full{viewCount > 0 && `, ${viewCount} view`} / {section.pages.length}
                                  </span>
                                </div>
                                {/* Page access rows */}
                                <div className="px-3 sm:px-4 py-2 space-y-1">
                                  {section.pages.map((page) => {
                                    const state = getPageState(page.key);
                                    return (
                                      <div key={page.key} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition">
                                        <span className="text-xs sm:text-sm text-gray-700 flex-1 min-w-0 truncate">{page.label}</span>
                                        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5 flex-shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => setPageState(page.key, "none")}
                                            className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                                              state === "none"
                                                ? "bg-red-100 text-red-700 shadow-sm"
                                                : "text-gray-400 hover:text-gray-600"
                                            }`}
                                            title="No Access"
                                          >
                                            None
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setPageState(page.key, "view")}
                                            className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                                              state === "view"
                                                ? "bg-amber-100 text-amber-700 shadow-sm"
                                                : "text-gray-400 hover:text-gray-600"
                                            }`}
                                            title="View Only — page visible but all actions disabled"
                                          >
                                            View
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setPageState(page.key, "full")}
                                            className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                                              state === "full"
                                                ? "bg-green-100 text-green-700 shadow-sm"
                                                : "text-gray-400 hover:text-gray-600"
                                            }`}
                                            title="Full Access"
                                          >
                                            Full
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Save button */}
                      <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {editPages.size} full, {editViewOnlyPages.size} view-only
                        </span>
                        <button onClick={savePageAccess} disabled={saving === selectedUserId}
                          className="bg-arcadia-600 text-white px-5 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-arcadia-700 transition disabled:opacity-50">
                          {saving === selectedUserId ? "Saving..." : "Save Access"}
                        </button>
                      </div>
                    </>
                  )}

                  {/* ═══ Document Access Tab ═══ */}
                  {activeTab === "documents" && (
                    <>
                      <div className="px-4 sm:px-6 py-4">
                        {/* Project selector */}
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Select Project</label>
                          <select
                            value={docProject}
                            onChange={(e) => handleDocProjectChange(e.target.value)}
                            className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500 outline-none bg-white"
                          >
                            <option value="">-- Select a project --</option>
                            {projects.map((p) => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </select>
                        </div>

                        {docSuccessMsg && (
                          <div className="p-3 mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                            {docSuccessMsg}
                          </div>
                        )}

                        {!docProject ? (
                          <div className="text-center py-10">
                            <div className="text-4xl text-gray-200 mb-3">&#128194;</div>
                            <p className="text-gray-400 text-sm">Select a project to manage folder access for this user.</p>
                          </div>
                        ) : loadingFolders ? (
                          <div className="flex items-center justify-center py-10 text-gray-500">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-arcadia-600 mr-3" />
                            Loading folders...
                          </div>
                        ) : folderTree.length === 0 ? (
                          <div className="text-center py-10">
                            <div className="text-4xl text-gray-200 mb-3">&#128193;</div>
                            <p className="text-gray-400 text-sm">No folders found for this project.</p>
                            <p className="text-gray-300 text-xs mt-1">Create folders in Project Documents first.</p>
                          </div>
                        ) : (
                          <>
                            {/* Legend */}
                            <div className="flex items-center gap-4 mb-3 text-[10px] text-gray-500">
                              <span className="flex items-center gap-1">
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-100 border border-gray-300" /> No Access
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-100 border border-blue-400" /> View Only
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-100 border border-amber-400" /> Upload
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-100 border border-green-400" /> Full Control
                              </span>
                            </div>

                            {/* Folder tree with permission selectors */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              <div className="px-3 sm:px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                <span className="text-xs sm:text-sm font-semibold text-gray-700">
                                  Folders — {docProject}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {folderPerms.size} shared
                                </span>
                              </div>
                              <div className="divide-y divide-gray-100">
                                {flattenTree(folderTree).map(({ folder, depth }) => {
                                  const currentLevel = folderPerms.get(folder.id) || "NONE";
                                  return (
                                    <div
                                      key={folder.id}
                                      className="flex items-center gap-2 py-2 px-3 sm:px-4 hover:bg-gray-50 transition"
                                      style={{ paddingLeft: `${16 + depth * 24}px` }}
                                    >
                                      {/* Folder icon + name */}
                                      <span className="text-sm text-amber-500 flex-shrink-0">
                                        {folder.children && folder.children.length > 0 ? "📂" : "📁"}
                                      </span>
                                      <span className="text-xs sm:text-sm text-gray-700 flex-1 min-w-0 truncate">
                                        {folder.name}
                                      </span>

                                      {/* Permission level selector */}
                                      <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5 flex-shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => setFolderPerm(folder.id, "NONE")}
                                          className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                                            currentLevel === "NONE"
                                              ? "bg-gray-200 text-gray-700 shadow-sm"
                                              : "text-gray-400 hover:text-gray-600"
                                          }`}
                                          title="No Access"
                                        >
                                          None
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setFolderPerm(folder.id, "VIEW")}
                                          className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                                            currentLevel === "VIEW"
                                              ? "bg-blue-100 text-blue-700 shadow-sm"
                                              : "text-gray-400 hover:text-gray-600"
                                          }`}
                                          title="View Only — can see files but not upload or delete"
                                        >
                                          View
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setFolderPerm(folder.id, "UPLOAD")}
                                          className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                                            currentLevel === "UPLOAD"
                                              ? "bg-amber-100 text-amber-700 shadow-sm"
                                              : "text-gray-400 hover:text-gray-600"
                                          }`}
                                          title="Upload — can view and upload files"
                                        >
                                          Upload
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setFolderPerm(folder.id, "MANAGE")}
                                          className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                                            currentLevel === "MANAGE"
                                              ? "bg-green-100 text-green-700 shadow-sm"
                                              : "text-gray-400 hover:text-gray-600"
                                          }`}
                                          title="Full Control — can view, upload, delete, and manage permissions"
                                        >
                                          Full
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Save button for document access */}
                      {docProject && folderTree.length > 0 && (
                        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {folderPerms.size} folder{folderPerms.size !== 1 ? "s" : ""} shared
                            {docHasChanges() && (
                              <span className="text-amber-600 ml-2">• unsaved changes</span>
                            )}
                          </span>
                          <button onClick={saveDocAccess} disabled={savingDocs || !docHasChanges()}
                            className="bg-arcadia-600 text-white px-5 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-arcadia-700 transition disabled:opacity-50">
                            {savingDocs ? "Saving..." : "Save Document Access"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
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
                <label className="block text-xs font-medium text-gray-600 mb-2">Role *</label>
                <select
                  value={newUser.roleId}
                  onChange={(e) => setNewUser({ ...newUser, roleId: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-arcadia-500 focus:border-arcadia-500 outline-none bg-white"
                >
                  <option value={0}>-- Select a role --</option>
                  {roles.filter((r) => r.name !== "ADMIN").map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
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
