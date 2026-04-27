import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { authService } from "../services/authService";
import type { User } from "../types/user";

interface MenuItem {
  label: string;
  path: string;
  adminOnly?: boolean;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    label: "User Management",
    items: [
      { label: "Add User", path: "/users/add", adminOnly: true },
      { label: "Delete User", path: "/users/delete", adminOnly: true },
      { label: "Edit User", path: "/users/edit", adminOnly: true },
      { label: "User Management Summary", path: "/users", adminOnly: true },
      { label: "Change Password", path: "/users/change-password" },
    ],
  },
  {
    label: "Activities",
    items: [
      { label: "Sale Entry", path: "/activities/sale-entry" },
      { label: "Sale Quote", path: "/activities/sale-quote" },
      { label: "Finance Spent", path: "/activities/finance-spent" },
      { label: "Master Plan", path: "/activities/master-plan" },
      { label: "Site Attendance", path: "/activities/site-attendance" },
    ],
  },
  {
    label: "Admin Settings",
    items: [
      { label: "Approval Chains", path: "/admin/approval-chains", adminOnly: true },
    ],
  },
];

function CurrentDateTime() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="text-sm text-gray-600">
      {now.toLocaleDateString("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })}{" "}
      {now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </span>
  );
}

function CollapsibleSection({
  section,
  currentPath,
  isAdmin,
}: {
  section: MenuSection;
  currentPath: string;
  isAdmin: boolean;
}) {
  const visibleItems = section.items.filter(
    (item) => !item.adminOnly || isAdmin
  );

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

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setCurrentUser)
      .catch(() => {});
  }, []);

  const displayName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : "...";

  const isAdmin = currentUser
    ? currentUser.roles.some((r) => r.name === "ADMIN")
    : false;

  return (
    <div className="flex flex-col min-h-screen">
      {/* ===== TOP HEADER ===== */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-arcadia-200" style={{ background: "linear-gradient(135deg, #e0effe 0%, #f0f7ff 40%, #fdf9ef 100%)" }}>
        {/* Left spacer */}
        <div className="w-1/4" />

        {/* Center — Logo */}
        <div className="flex-1 flex justify-center">
          <Link to="/">
            <img
              src="/arcadia-logo.png"
              alt="Arcadia Premium"
              className="h-20 object-contain"
            />
          </Link>
        </div>

        {/* Right — Date/Time & User */}
        <div className="w-1/4 text-right space-y-0.5">
          <CurrentDateTime />
          <div className="text-sm text-gray-700">
            Logged In :{" "}
            <span className="font-semibold text-arcadia-700 underline underline-offset-2">
              {displayName}
            </span>
          </div>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <div className="flex flex-1">
        {/* ===== LEFT SIDEBAR ===== */}
        <aside className="w-64 bg-white border-r border-gray-200 py-4 px-3 flex flex-col justify-between">
          <nav className="space-y-1">
            {menuSections.map((section) => (
              <CollapsibleSection
                key={section.label}
                section={section}
                currentPath={location.pathname}
                isAdmin={isAdmin}
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
        <main className="flex-1 p-8 bg-gray-50 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
