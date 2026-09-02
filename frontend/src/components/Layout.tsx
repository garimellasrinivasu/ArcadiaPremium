import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { authService } from "../services/authService";
import type { User } from "../types/user";
import ViewOnlyWrapper from "./ViewOnlyWrapper";
import { useProject, PROJECTS } from "../contexts/ProjectContext";

interface MenuItem {
  label: string;
  path: string;
  pageKey?: string; // matches user_allowed_pages key for per-user access control
  adminOnly?: boolean;
  requiredRoles?: string[]; // if set, user must have at least one of these roles
  alwaysVisible?: boolean; // shown to all logged-in users regardless of access config
  externalLink?: boolean; // if true, opens in new tab as an external link
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
      { label: "Initial Sales", path: "/activities/initial-sales", pageKey: "INITIAL_SALES" },
      { label: "Sale Entry", path: "/activities/sale-entry", pageKey: "SALE_ENTRY" },
      { label: "Sale Quote", path: "/activities/sale-quote", pageKey: "SALE_QUOTE" },
      { label: "Finance Spent", path: "/activities/finance-spent", pageKey: "FINANCE_SPENT" },
      { label: "Expenses Summary", path: "/activities/expenses", pageKey: "EXPENSES_SUMMARY" },
      { label: "Master Plan", path: "/activities/master-plan", pageKey: "MASTER_PLAN" },
      { label: "Work Execution Updates", path: "/activities/work-execution", pageKey: "WORK_EXECUTION" },
      { label: "Site Attendance", path: "/activities/site-attendance", pageKey: "SITE_ATTENDANCE" },
      { label: "Project Documents", path: "/activities/documents", pageKey: "PROJECT_DOCUMENTS" },
      { label: "Partner Investment", path: "/activities/partner-investment", pageKey: "PARTNER_INVESTMENT" },
      { label: "Walk-Ins", path: "/activities/walk-ins", pageKey: "WALK_INS" },
      { label: "Land Converter", path: "/activities/land-converter", pageKey: "LAND_CONVERTER" },
      { label: "Ground Level Work", path: "/activities/ground-level-work", pageKey: "GROUND_LEVEL_WORK" },
      { label: "Pay Slips", path: "/activities/pay-slips", pageKey: "PAY_SLIPS" },
    ],
  },
  {
    label: "Subcontracting",
    items: [
      { label: "Dashboard", path: "/subcontracting/dashboard", pageKey: "SUBCONTRACTING_DASHBOARD" },
      { label: "Contractors", path: "/subcontracting/contractors", pageKey: "CONTRACTORS" },
      { label: "Activity Master", path: "/subcontracting/activity-master", pageKey: "ACTIVITY_MASTER" },
      { label: "Jobs / WBS", path: "/subcontracting/jobs", pageKey: "JOBS_WBS" },
      { label: "Job Estimation", path: "/subcontracting/estimation", pageKey: "JOB_ESTIMATION" },
      { label: "Work Orders", path: "/subcontracting/work-orders", pageKey: "WORK_ORDERS" },
      { label: "Measurement Books", path: "/subcontracting/measurement-books", pageKey: "MEASUREMENT_BOOK" },
      { label: "RA Bills", path: "/subcontracting/ra-bills", pageKey: "RA_BILLS" },
      { label: "RA Bill Payments", path: "/subcontracting/ra-payments", pageKey: "RA_BILL_PAYMENT_CERT" },
      { label: "Costing - Standard Head", path: "/subcontracting/costing-standard", pageKey: "COSTING_STANDARD_HEAD" },
      { label: "Costing - Custom Head", path: "/subcontracting/costing-custom", pageKey: "COSTING_CUSTOM_HEAD" },
      { label: "Map Cost Head", path: "/subcontracting/map-cost-head", pageKey: "MAP_COST_HEAD" },
      { label: "WO Template Setting", path: "/subcontracting/wo-templates", pageKey: "WO_TEMPLATE_SETTING" },
      { label: "Work Order Reports", path: "/subcontracting/wo-reports", pageKey: "WO_REPORTS" },
      { label: "Contractor Bill Report", path: "/subcontracting/contractor-bill-report", pageKey: "CONTRACTOR_BILL_REPORT" },
      { label: "WO Report By Unit", path: "/subcontracting/wo-report-unit", pageKey: "WO_REPORT_BY_UNIT" },
      { label: "WO Report By Activity", path: "/subcontracting/wo-report-activity", pageKey: "WO_REPORT_BY_ACTIVITY" },
      { label: "MB Report By Activity", path: "/subcontracting/mb-report-activity", pageKey: "MB_REPORT_BY_ACTIVITY" },
      { label: "Bill Approval History", path: "/subcontracting/bill-approval-history", pageKey: "BILL_APPROVAL_HISTORY" },
      { label: "Rate Analysis", path: "/subcontracting/rate-analysis", pageKey: "RATE_ANALYSIS" },
    ],
  },
  {
    label: "Project Execution",
    items: [
      { label: "Execution Templates", path: "/execution/templates", pageKey: "PROJ_EXECUTION_TEMPLATE" },
      { label: "Daily Execution Update", path: "/execution/daily-update", pageKey: "DAILY_EXECUTION_UPDATE" },
    ],
  },
  {
    label: "Material Management",
    items: [
      { label: "Vendors", path: "/material/vendors", pageKey: "VENDOR_LIST" },
      { label: "Material Groups", path: "/material/groups", pageKey: "MATERIAL_MASTER" },
      { label: "Vendor-Material Mapping", path: "/material/vendor-mapping", pageKey: "VENDOR_MATERIAL_MAP" },
      { label: "Material Rates", path: "/material/rates", pageKey: "MATERIAL_RATE" },
      { label: "Warehouses", path: "/material/warehouses", pageKey: "WAREHOUSE" },
      { label: "Material BOQ", path: "/material/boq", pageKey: "MATERIAL_BOQ" },
    ],
  },
  {
    label: "Supply Chain",
    items: [
      { label: "Requisitions", path: "/supply-chain/requisitions", pageKey: "MATERIAL_REQUISITION" },
      { label: "Indents", path: "/supply-chain/indents", pageKey: "MATERIAL_INDENT" },
      { label: "Purchase Orders", path: "/supply-chain/purchase-orders", pageKey: "PURCHASE_ORDER" },
      { label: "MRN", path: "/supply-chain/mrn", pageKey: "MRN" },
      { label: "GRN", path: "/supply-chain/grn", pageKey: "GRN" },
      { label: "Material Issues", path: "/supply-chain/issues", pageKey: "MATERIAL_ISSUE" },
      { label: "Purchase Bills", path: "/supply-chain/purchase-bills", pageKey: "PURCHASE_BILL" },
      { label: "PO Payments", path: "/supply-chain/po-payments", pageKey: "PO_PAYMENT_CERT" },
      { label: "Stock Transfers", path: "/supply-chain/stock-transfers", pageKey: "STOCK_TRANSFER" },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Attendance Reports", path: "/reports/attendance", pageKey: "ATTENDANCE_REPORTS" },
    ],
  },
  {
    label: "Accounts",
    items: [
      { label: "Accounts Ledger", path: "/accounts/ledger", pageKey: "ACCOUNTS" },
      { label: "Invoice & Payment Entry", path: "/accounts/invoice-book", pageKey: "INVOICE_ENTRY" },
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

function AnalogClock() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const radius = center - 4;
      const now = new Date();

      setTimeStr(
        now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
      );

      ctx.clearRect(0, 0, size, size);

      // Clock face
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1e3a5f";
      ctx.stroke();

      // Hour markers
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6 - Math.PI / 2;
        const isMajor = i % 3 === 0;
        const outerR = radius - 2;
        const innerR = isMajor ? radius - 10 : radius - 6;
        ctx.beginPath();
        ctx.moveTo(center + outerR * Math.cos(angle), center + outerR * Math.sin(angle));
        ctx.lineTo(center + innerR * Math.cos(angle), center + innerR * Math.sin(angle));
        ctx.lineWidth = isMajor ? 2.5 : 1;
        ctx.strokeStyle = isMajor ? "#1e3a5f" : "#6b7280";
        ctx.stroke();
      }

      // Hour numbers
      ctx.fillStyle = "#1e3a5f";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 1; i <= 12; i++) {
        const angle = (i * Math.PI) / 6 - Math.PI / 2;
        const numR = radius - 18;
        ctx.fillText(String(i), center + numR * Math.cos(angle), center + numR * Math.sin(angle));
      }

      const hours = now.getHours() % 12;
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      // Hour hand
      const hAngle = ((hours + minutes / 60) * Math.PI) / 6 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(center + (radius * 0.5) * Math.cos(hAngle), center + (radius * 0.5) * Math.sin(hAngle));
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#1e3a5f";
      ctx.lineCap = "round";
      ctx.stroke();

      // Minute hand
      const mAngle = ((minutes + seconds / 60) * Math.PI) / 30 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(center + (radius * 0.7) * Math.cos(mAngle), center + (radius * 0.7) * Math.sin(mAngle));
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#2d6aa0";
      ctx.lineCap = "round";
      ctx.stroke();

      // Second hand
      const sAngle = (seconds * Math.PI) / 30 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(center + (radius * 0.78) * Math.cos(sAngle), center + (radius * 0.78) * Math.sin(sAngle));
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#c0392b";
      ctx.lineCap = "round";
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(center, center, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#1e3a5f";
      ctx.fill();
    }

    draw();
    const interval = setInterval(draw, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <canvas ref={canvasRef} width={116} height={116} className="hidden lg:block" />
      <span className="text-sm font-bold text-gray-700 tracking-wide">{timeStr}</span>
    </div>
  );
}

function CollapsibleSection({
  section,
  currentPath,
  isAdmin,
  allowedPages,
  viewOnlyPages,
}: {
  section: MenuSection;
  currentPath: string;
  isAdmin: boolean;
  allowedPages: Set<string>;
  viewOnlyPages: Set<string>;
}) {
  const visibleItems = section.items.filter((item) => {
    // Always-visible items (e.g. Change Password) shown to everyone
    if (item.alwaysVisible) return true;
    // Admin users see everything
    if (isAdmin) return true;
    // Per-user page access check — show if full access OR view-only
    if (item.pageKey) return allowedPages.has(item.pageKey) || viewOnlyPages.has(item.pageKey);
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
            const isViewOnly = !isAdmin && item.pageKey ? viewOnlyPages.has(item.pageKey) && !allowedPages.has(item.pageKey) : false;

            if (item.externalLink) {
              return (
                <li key={item.path}>
                  <a
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition text-indigo-700 hover:bg-indigo-50 font-medium"
                  >
                    {item.label}
                    <span className="ml-auto text-[10px] text-indigo-400">&#8599;</span>
                  </a>
                </li>
              );
            }

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition ${
                    active
                      ? "bg-arcadia-600 text-white font-medium"
                      : isViewOnly
                        ? "text-gray-400 hover:bg-gray-50"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                  {isViewOnly && (
                    <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${
                      active ? "bg-white/20 text-white/80" : "bg-amber-50 text-amber-500"
                    }`} title="View Only">
                      VIEW
                    </span>
                  )}
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
  const { selectedProject, setSelectedProject } = useProject();

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
  const viewOnlyPages = new Set<string>(currentUser?.viewOnlyPages || []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ===== TOP HEADER ===== */}
      <header className="px-4 lg:px-6 py-5 flex items-center border-b border-arcadia-200" style={{ background: "linear-gradient(135deg, #e0effe 0%, #f0f7ff 40%, #fdf9ef 100%)" }}>
        {/* Left — Clock + Hamburger (mobile) */}
        <div className="flex-1 flex items-center gap-3">
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
          <AnalogClock />
        </div>

        {/* Center — Project Logos */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-3 lg:gap-5">
            {PROJECTS.map((proj) => {
              const isSelected = selectedProject.key === proj.key;
              return (
                <button
                  key={proj.key}
                  onClick={() => setSelectedProject(proj)}
                  title={proj.name}
                  className={`relative rounded-lg transition-all duration-200 p-1 lg:p-2 ${
                    isSelected
                      ? "scale-105"
                      : "opacity-50 hover:opacity-80"
                  }`}
                >
                  <img
                    src={proj.logo}
                    alt={proj.name}
                    className="h-9 lg:h-16 w-auto object-contain"
                  />
                  {isSelected && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-gray-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
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
          <nav className="space-y-1 flex-1 overflow-y-auto">
            {menuSections.map((section) => (
              <CollapsibleSection
                key={section.label}
                section={section}
                currentPath={location.pathname}
                isAdmin={isAdmin}
                allowedPages={allowedPages}
                viewOnlyPages={viewOnlyPages}
              />
            ))}

            {/* Personal Documents */}
            {(isAdmin || allowedPages.has("PERSONAL_DOCUMENTS") || viewOnlyPages.has("PERSONAL_DOCUMENTS")) && (
              <div className="mt-2">
                <Link
                  to="/personal-documents"
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold rounded-lg transition ${
                    location.pathname === "/personal-documents"
                      ? "bg-teal-100 text-teal-800"
                      : "text-teal-700 hover:bg-teal-50"
                  }`}
                >
                  <span className="text-xs font-bold">&#128194;</span>
                  Personal Documents
                </Link>
              </div>
            )}
          </nav>

          {/* Tally — embedded page */}
          <div className="mb-1">
            <Link
              to="/tally"
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold rounded-lg transition ${
                location.pathname === "/tally"
                  ? "bg-indigo-100 text-indigo-800"
                  : "text-indigo-700 hover:bg-indigo-50"
              }`}
            >
              <span className="text-xs font-bold">&#9654;</span>
              Tally
            </Link>
          </div>

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
          <ViewOnlyWrapper>
            <Outlet />
          </ViewOnlyWrapper>
        </main>
      </div>
    </div>
  );
}
