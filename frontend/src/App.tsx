import { Routes, Route, Navigate } from "react-router-dom";
import { authService } from "./services/authService";
import { ProjectProvider } from "./contexts/ProjectContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import AddUserPage from "./pages/AddUserPage";
import DeleteUserPage from "./pages/DeleteUserPage";
import EditUserPage from "./pages/EditUserPage";
import RolesPage from "./pages/RolesPage";
import SaleQuotePage from "./pages/SaleQuotePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import FinanceSpentPage from "./pages/FinanceSpentPage";
import PujaExpensesPage from "./pages/PujaExpensesPage";
import ExpensesSummaryPage from "./pages/ExpensesSummaryPage";
import WeeklyExpensesPage from "./pages/WeeklyExpensesPage";
import PetrolExpensesPage from "./pages/PetrolExpensesPage";
import InitialSalesPage from "./pages/InitialSalesPage";
import SaleEntryPage from "./pages/SaleEntryPage";
import MasterPlanPage from "./pages/MasterPlanPage";
import SiteAttendancePage from "./pages/SiteAttendancePage";
import ApprovalChainAdminPage from "./pages/ApprovalChainAdminPage";
import AttendanceReportsPage from "./pages/AttendanceReportsPage";
import ProjectManagementPage from "./pages/ProjectManagementPage";
import ProjectDocumentsPage from "./pages/ProjectDocumentsPage";
import CapitolFundPage from "./pages/CapitolFundPage";
import ProjectEstimationPage from "./pages/ProjectEstimationPage";
import PartnerInvestmentPage from "./pages/PartnerInvestmentPage";
import UserAccessConfigPage from "./pages/UserAccessConfigPage";
import WalkInsPage from "./pages/WalkInsPage";
import LandConverterPage from "./pages/LandConverterPage";
import ContractorListPage from "./pages/ContractorListPage";
import ActivityMasterPage from "./pages/ActivityMasterPage";
import JobsWBSPage from "./pages/JobsWBSPage";
import JobEstimationPage from "./pages/JobEstimationPage";
import WorkOrderPage from "./pages/WorkOrderPage";
import MeasurementBookPage from "./pages/MeasurementBookPage";
import RABillPage from "./pages/RABillPage";
import RABillPaymentCertPage from "./pages/RABillPaymentCertPage";
import VendorListPage from "./pages/VendorListPage";
import MaterialGroupPage from "./pages/MaterialGroupPage";
import VendorMaterialMappingPage from "./pages/VendorMaterialMappingPage";
import MaterialRatePage from "./pages/MaterialRatePage";
import WarehousePage from "./pages/WarehousePage";
import MaterialBOQPage from "./pages/MaterialBOQPage";
import RequisitionPage from "./pages/RequisitionPage";
import IndentPage from "./pages/IndentPage";
import PurchaseOrderPage from "./pages/PurchaseOrderPage";
import MRNPage from "./pages/MRNPage";
import GRNPage from "./pages/GRNPage";
import MaterialIssuePage from "./pages/MaterialIssuePage";
import PurchaseBillPage from "./pages/PurchaseBillPage";
import POPaymentCertificatePage from "./pages/POPaymentCertificatePage";
import StockTransferPage from "./pages/StockTransferPage";
import SubcontractingDashboardPage from "./pages/SubcontractingDashboardPage";
import CostingStandardHeadPage from "./pages/CostingStandardHeadPage";
import CostingCustomHeadPage from "./pages/CostingCustomHeadPage";
import MapCostHeadPage from "./pages/MapCostHeadPage";
import WOTemplateSettingPage from "./pages/WOTemplateSettingPage";
import WorkOrderReportsPage from "./pages/WorkOrderReportsPage";
import ContractorBillReportPage from "./pages/ContractorBillReportPage";
import WOReportByUnitPage from "./pages/WOReportByUnitPage";
import WOReportByActivityPage from "./pages/WOReportByActivityPage";
import MBReportByActivityPage from "./pages/MBReportByActivityPage";
import BillApprovalHistoryPage from "./pages/BillApprovalHistoryPage";
import RateAnalysisPage from "./pages/RateAnalysisPage";
import ProjectExecutionTemplatePage from "./pages/ProjectExecutionTemplatePage";
import DailyExecutionUpdatePage from "./pages/DailyExecutionUpdatePage";
import TallyPage from "./pages/TallyPage";
import GroundLevelWorkPage from "./pages/GroundLevelWorkPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  // Block access if user must change their temporary password first
  if (authService.mustChangePassword()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ProjectProvider>
              <Layout />
            </ProjectProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        {/* User Management */}
        <Route path="users" element={<UsersPage />} />
        <Route path="users/add" element={<AddUserPage />} />
        <Route path="users/delete" element={<DeleteUserPage />} />
        <Route path="users/edit" element={<EditUserPage />} />
        <Route path="users/change-password" element={<ChangePasswordPage />} />
        <Route path="roles" element={<RolesPage />} />

        {/* Activities */}
        <Route path="activities/sale-entry" element={<SaleEntryPage />} />
        <Route path="activities/sale-quote" element={<SaleQuotePage />} />
        <Route path="activities/finance-spent" element={<FinanceSpentPage />} />
        <Route path="activities/expenses" element={<ExpensesSummaryPage />} />
        <Route path="activities/expenses/puja" element={<PujaExpensesPage />} />
        <Route path="activities/expenses/weekly" element={<WeeklyExpensesPage />} />
        <Route path="activities/expenses/petrol" element={<PetrolExpensesPage />} />
        <Route path="activities/puja-expenses" element={<PujaExpensesPage />} />
        <Route path="activities/initial-sales" element={<InitialSalesPage />} />
        <Route path="activities/master-plan" element={<MasterPlanPage />} />
        <Route path="activities/site-attendance" element={<SiteAttendancePage />} />
        <Route path="activities/documents" element={<ProjectDocumentsPage />} />
        <Route path="activities/partner-investment" element={<PartnerInvestmentPage />} />
        <Route path="activities/walk-ins" element={<WalkInsPage />} />
        <Route path="activities/land-converter" element={<LandConverterPage />} />
        <Route path="activities/ground-level-work" element={<GroundLevelWorkPage />} />
        <Route path="admin/approval-chains" element={<ApprovalChainAdminPage />} />
        <Route path="admin/projects" element={<ProjectManagementPage />} />
        <Route path="admin/capitol-fund" element={<CapitolFundPage />} />
        <Route path="admin/project-estimation" element={<ProjectEstimationPage />} />
        <Route path="admin/user-access" element={<UserAccessConfigPage />} />
        <Route path="reports/attendance" element={<AttendanceReportsPage />} />
        <Route path="tally" element={<TallyPage />} />

        {/* Subcontracting */}
        <Route path="subcontracting/contractors" element={<ContractorListPage />} />
        <Route path="subcontracting/activity-master" element={<ActivityMasterPage />} />
        <Route path="subcontracting/jobs" element={<JobsWBSPage />} />
        <Route path="subcontracting/estimation" element={<JobEstimationPage />} />
        <Route path="subcontracting/work-orders" element={<WorkOrderPage />} />
        <Route path="subcontracting/measurement-books" element={<MeasurementBookPage />} />
        <Route path="subcontracting/ra-bills" element={<RABillPage />} />
        <Route path="subcontracting/ra-payments" element={<RABillPaymentCertPage />} />
        <Route path="subcontracting/dashboard" element={<SubcontractingDashboardPage />} />
        <Route path="subcontracting/costing-standard" element={<CostingStandardHeadPage />} />
        <Route path="subcontracting/costing-custom" element={<CostingCustomHeadPage />} />
        <Route path="subcontracting/map-cost-head" element={<MapCostHeadPage />} />
        <Route path="subcontracting/wo-templates" element={<WOTemplateSettingPage />} />
        <Route path="subcontracting/wo-reports" element={<WorkOrderReportsPage />} />
        <Route path="subcontracting/contractor-bill-report" element={<ContractorBillReportPage />} />
        <Route path="subcontracting/wo-report-unit" element={<WOReportByUnitPage />} />
        <Route path="subcontracting/wo-report-activity" element={<WOReportByActivityPage />} />
        <Route path="subcontracting/mb-report-activity" element={<MBReportByActivityPage />} />
        <Route path="subcontracting/bill-approval-history" element={<BillApprovalHistoryPage />} />
        <Route path="subcontracting/rate-analysis" element={<RateAnalysisPage />} />

        {/* Project Execution */}
        <Route path="execution/templates" element={<ProjectExecutionTemplatePage />} />
        <Route path="execution/daily-update" element={<DailyExecutionUpdatePage />} />

        {/* Material Management */}
        <Route path="material/vendors" element={<VendorListPage />} />
        <Route path="material/groups" element={<MaterialGroupPage />} />
        <Route path="material/vendor-mapping" element={<VendorMaterialMappingPage />} />
        <Route path="material/rates" element={<MaterialRatePage />} />
        <Route path="material/warehouses" element={<WarehousePage />} />
        <Route path="material/boq" element={<MaterialBOQPage />} />

        {/* Supply Chain */}
        <Route path="supply-chain/requisitions" element={<RequisitionPage />} />
        <Route path="supply-chain/indents" element={<IndentPage />} />
        <Route path="supply-chain/purchase-orders" element={<PurchaseOrderPage />} />
        <Route path="supply-chain/mrn" element={<MRNPage />} />
        <Route path="supply-chain/grn" element={<GRNPage />} />
        <Route path="supply-chain/issues" element={<MaterialIssuePage />} />
        <Route path="supply-chain/purchase-bills" element={<PurchaseBillPage />} />
        <Route path="supply-chain/po-payments" element={<POPaymentCertificatePage />} />
        <Route path="supply-chain/stock-transfers" element={<StockTransferPage />} />
      </Route>
    </Routes>
  );
}
