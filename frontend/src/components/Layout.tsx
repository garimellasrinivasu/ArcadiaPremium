import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { authService } from "../services/authService";
import type { User } from "../types/user";

interface MenuItem {
  label: string;
  path: string;
  pageKey?: string; // matches user_allowed_pages key for per-user access control
  adminOnly?: boolean;
  requiredRoles?: string[]; // if set, user must have at least one of these roles
  alwaysVisible?: boolean; // shown to all logged-in users regardless of access config
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    label: "User Management",
    items: [
      { label: "Add User", path: "/users/add", pageKey: "USER_ADD" },
      { label: "Delete User", path: "/users/delete", pageKey: "USER_DELETE" },
      { label: "Edit User", path: "/users/edit", pageKey: "USER_EDIT" },
      { label: "User Management Summary", path: "/users", pageKey: "USER_SUMMARY" },
      { label: "Roles & Permissions", path: "/roles", pageKey: "ROLES" },
      { label: "Change Password", path: "/users/change-password", alwaysVisible: true },
    ],
  },
  {
    label: "Activities",
    items: [
      { label: "Sale Entry", path: "/activities/sale-entry", pageKey: "SALE_ENTRY" },
      { label: "Sale Quote", path: "/activities/sale-quote", pageKey: "SALE_QUOTE" },
      { label: "Finance Spent", path: "/activities/finance-spent", pageKey: "FINANCE_SPENT" },
      { label: "Master Plan", path: "/activities/master-plan", pageKey: "MASTER_PLAN" },
      { label: "Site Attendance", path: "/activities/site-attendance", pageKey: "SITE_ATTENDANCE" },
      { label: "Project Documents", path: "/activities/documents", pageKey: "PROJECT_DOCUMENTS" },
      { label: "Partner Investment", path: "/activities/partner-investment", pageKey: "PARTNER_INVESTMENT" },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Attendance Reports", path: "/reports/attendance", pageKey: "ATTENDANCE_REPORTS" },
    ],
  },
  {
    label: "Admin Settings",
    items: [
      { label: "Projects", path: "/admin/projects", pageKey: "PROJECTS" },
      { label: "Approval Chains", path: "/admin/approval-chains", pageKey: "APPROVAL_CHAINS" },
      { label: "Capital Fund", path: "/admin/capitol-fund", pageKey: "CAPITOL_FUND" },
      { label: "Project Estimation", path: "/admin/project-estimation", pageKey: "PROJECT_ESTIMATION" },
      { label: "User Access Config", path: "/admin/user-access", pageKey: "USER_ACCESS_CONFIG" },
    ],
  },
];

function CurrentDate() {
  return (
    <span className="text-sm text-gray-600">
      {new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })}
    </span>
  );
}

function CollapsibleSection({
  section,
  currentPath,
  isAdmin,
  allowedPages,
}: {
  section: MenuSection;
  currentPath: string;
  isAdmin: boolean;
  allowedPages: Set<string>;
}) {
  const visibleItems = section.items.filter((item) => {
    // Always-visible items (e.g. Change Password) shown to everyone
    if (item.alwaysVisible) return true;
    // Admin users see everything
    if (isAdmin) return true;
    // Per-user page access check
    if (item.pageKey) return allowedPages.has(item.pageKey);
    // No pageKey = hidden for non-admin (should not happen after migration)
    return false;
  });

  // Don't render the section at all if no items are visible
  if (visibleItems.length === 0) return null;

  const isActive = visibleItems.some((item) => currentPath === item.path);
  const [open, setOpen] = useState(isActive);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold transition rounded-lg ${
          isActive
            ? "text-arcadia-800 bg-arcadia-50"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <span
          className={`text-xs font-bold transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        >
          &#9654;
        </span>
        {section.label}
      </button>

      {open && (
        <ul className="ml-6 mt-0.5 space-y-0.5">
          {visibleItems.map((item) => {
            const active = currentPath === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`block px-3 py-2 text-sm rounded-lg transition ${
                    active
                      ? "bg-arcadia-600 text-white font-medium"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setCurrentUser)
      .catch(() => {});
  }, []);

  // Close sidebar on navigation (mobile only)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const displayName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : "...";

  const isAdmin = currentUser
    ? currentUser.role?.name === "ADMIN"
    : false;

  const allowedPages = new Set<string>(currentUser?.allowedPages || []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ===== TOP HEADER ===== */}
      <header className="px-4 lg:px-6 py-5 flex items-center border-b border-arcadia-200" style={{ background: "linear-gradient(135deg, #e0effe 0%, #f0f7ff 40%, #fdf9ef 100%)" }}>
        {/* Left — Hamburger (mobile only) */}
        <div className="flex-1 flex items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            aria-label="Toggle Menu"
          >
            {isSidebarOpen ? (
              <span className="text-2xl leading-none">✕</span>
            ) : (
              <span className="text-2xl leading-none">☰</span>
            )}
          </button>
        </div>

        {/* Center — Logo */}
        <div className="flex-shrink-0">
          <Link to="/" className="flex items-center justify-center">
            <img
              src="/arcadia-logo.png"
              alt="Arcadia Premium"
              className="h-12 lg:h-20 object-contain transition-all"
            />
          </Link>
        </div>

        {/* Right — Date & User */}
        <div className="flex-1 text-right space-y-0.5">
          <CurrentDate />
          <div className="text-sm text-gray-700">
            Logged In :{" "}
            <span className="font-semibold text-arcadia-700 underline underline-offset-2">
              {displayName}
            </span>
          </div>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <div className="flex flex-1 relative">

        {/* Sidebar and Main Content Container */}


        {/* ===== LEFT SIDEBAR ===== */}
        <aside className={`
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          fixed lg:relative
          inset-y-0 left-0
          z-50 lg:z-0
          w-64 bg-white border-r border-gray-200
          py-4 px-3
          flex flex-col justify-between
          transition-transform duration-300 ease-in-out
          lg:transition-none
          shadow-xl lg:shadow-none
        `}>
          <nav className="space-y-1">
            {menuSections.map((section) => (
              <CollapsibleSection
                key={section.label}
                section={section}
                currentPath={location.pathname}
                isAdmin={isAdmin}
                allowedPages={allowedPages}
              />
            ))}
          </nav>

          <div className="border-t border-gray-200 pt-3 mt-4 px-2">
            <button
              onClick={() => authService.logout()}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <span className="text-base">&#9205;</span>
              Logout
            </button>
          </div>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 p-4 md:p-8 bg-gray-50 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
