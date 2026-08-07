import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { authService } from "../services/authService";
import type { User } from "../types/user";

/**
 * Maps route paths to their corresponding page keys.
 * Must stay in sync with Layout.tsx menuSections.
 */
const PATH_TO_PAGE_KEY: Record<string, string> = {
  "/users/add": "USER_ADD",
  "/users/delete": "USER_DELETE",
  "/users/edit": "USER_EDIT",
  "/users": "USER_SUMMARY",
  "/roles": "ROLES",
  "/activities/sale-entry": "SALE_ENTRY",
  "/activities/sale-quote": "SALE_QUOTE",
  "/activities/finance-spent": "FINANCE_SPENT",
  "/activities/master-plan": "MASTER_PLAN",
  "/activities/site-attendance": "SITE_ATTENDANCE",
  "/activities/documents": "PROJECT_DOCUMENTS",
  "/activities/partner-investment": "PARTNER_INVESTMENT",
  "/activities/walk-ins": "WALK_INS",
  "/activities/land-converter": "LAND_CONVERTER",
  "/activities/ground-level-work": "GROUND_LEVEL_WORK",
  "/admin/approval-chains": "APPROVAL_CHAINS",
  "/admin/projects": "PROJECTS",
  "/admin/capitol-fund": "CAPITOL_FUND",
  "/admin/project-estimation": "PROJECT_ESTIMATION",
  "/admin/user-access": "USER_ACCESS_CONFIG",
  "/reports/attendance": "ATTENDANCE_REPORTS",
  "/subcontracting/dashboard": "SUBCONTRACTING_DASHBOARD",
  "/subcontracting/contractors": "CONTRACTORS",
  "/subcontracting/activity-master": "ACTIVITY_MASTER",
  "/subcontracting/jobs": "JOBS_WBS",
  "/subcontracting/estimation": "JOB_ESTIMATION",
  "/subcontracting/work-orders": "WORK_ORDERS",
  "/subcontracting/measurement-books": "MEASUREMENT_BOOK",
  "/subcontracting/ra-bills": "RA_BILLS",
  "/subcontracting/ra-payments": "RA_BILL_PAYMENT_CERT",
  "/subcontracting/costing-standard": "COSTING_STANDARD_HEAD",
  "/subcontracting/costing-custom": "COSTING_CUSTOM_HEAD",
  "/subcontracting/map-cost-head": "MAP_COST_HEAD",
  "/subcontracting/wo-templates": "WO_TEMPLATE_SETTING",
  "/subcontracting/wo-reports": "WO_REPORTS",
  "/subcontracting/contractor-bill-report": "CONTRACTOR_BILL_REPORT",
  "/subcontracting/wo-report-unit": "WO_REPORT_BY_UNIT",
  "/subcontracting/wo-report-activity": "WO_REPORT_BY_ACTIVITY",
  "/subcontracting/mb-report-activity": "MB_REPORT_BY_ACTIVITY",
  "/subcontracting/bill-approval-history": "BILL_APPROVAL_HISTORY",
  "/subcontracting/rate-analysis": "RATE_ANALYSIS",
  "/execution/templates": "PROJ_EXECUTION_TEMPLATE",
  "/execution/daily-update": "DAILY_EXECUTION_UPDATE",
  "/material/vendors": "VENDOR_LIST",
  "/material/groups": "MATERIAL_MASTER",
  "/material/vendor-mapping": "VENDOR_MATERIAL_MAP",
  "/material/rates": "MATERIAL_RATE",
  "/material/warehouses": "WAREHOUSE",
  "/material/boq": "MATERIAL_BOQ",
  "/supply-chain/requisitions": "MATERIAL_REQUISITION",
  "/supply-chain/indents": "MATERIAL_INDENT",
  "/supply-chain/purchase-orders": "PURCHASE_ORDER",
  "/supply-chain/mrn": "MRN",
  "/supply-chain/grn": "GRN",
  "/supply-chain/issues": "MATERIAL_ISSUE",
  "/supply-chain/purchase-bills": "PURCHASE_BILL",
  "/supply-chain/po-payments": "PO_PAYMENT_CERT",
  "/supply-chain/stock-transfers": "STOCK_TRANSFER",
};

/**
 * Pages that handle view-only mode internally.
 * These pages show the banner but DON'T get pointer-events blocked,
 * because they need partial interactivity (e.g., browsing but no editing).
 */
const SELF_MANAGED_VIEW_ONLY = new Set(["/activities/documents"]);

interface ViewOnlyWrapperProps {
  children: React.ReactNode;
}

export default function ViewOnlyWrapper({ children }: ViewOnlyWrapperProps) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser).catch(() => {});
  }, []);

  // Determine if the current page is view-only
  const pageKey = PATH_TO_PAGE_KEY[location.pathname];
  const isAdmin = currentUser?.role?.name === "ADMIN";
  const viewOnlyPages = new Set<string>(currentUser?.viewOnlyPages || []);
  const allowedPages = new Set<string>(currentUser?.allowedPages || []);

  // View-only if: not admin, has a page key, is in viewOnlyPages but NOT in allowedPages
  const isViewOnly = !isAdmin && !!pageKey && viewOnlyPages.has(pageKey) && !allowedPages.has(pageKey);

  if (!isViewOnly) {
    return <>{children}</>;
  }

  // Self-managed pages: show banner but let the page handle interaction restrictions
  const isSelfManaged = SELF_MANAGED_VIEW_ONLY.has(location.pathname);

  return (
    <div className="relative">
      {/* View-Only Banner */}
      <div className="sticky top-0 z-40 bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2 shadow-sm">
        <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="text-sm font-medium text-amber-800">
          View Only Mode
        </span>
        <span className="text-xs text-amber-600">
          — You can view this page but cannot make any changes.
        </span>
      </div>

      {isSelfManaged ? (
        /* Self-managed: page controls its own interactivity */
        <div>{children}</div>
      ) : (
        /* Default: block all interactions */
        <div
          style={{
            pointerEvents: "none",
            userSelect: "none",
            opacity: 0.75,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Hook for pages that self-manage view-only mode.
 * Returns true if the current user has view-only access to the current page.
 */
export function useIsViewOnly(): boolean {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser).catch(() => {});
  }, []);

  const pageKey = PATH_TO_PAGE_KEY[location.pathname];
  const isAdmin = currentUser?.role?.name === "ADMIN";
  const viewOnlyPages = new Set<string>(currentUser?.viewOnlyPages || []);
  const allowedPages = new Set<string>(currentUser?.allowedPages || []);

  return !isAdmin && !!pageKey && viewOnlyPages.has(pageKey) && !allowedPages.has(pageKey);
}

/**
 * Hook that returns whether the current user is allowed to download/export files.
 * Admin users always have download enabled; for others it reads user.downloadEnabled.
 * Returns true (allowed) by default until the user is loaded.
 */
export function useDownloadEnabled(): boolean {
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      if (user.role?.name === "ADMIN") {
        setAllowed(true);
      } else {
        setAllowed(user.downloadEnabled !== false);
      }
    }).catch(() => {});
  }, []);

  return allowed;
}
