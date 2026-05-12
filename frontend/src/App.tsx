import { Routes, Route, Navigate } from "react-router-dom";
import { authService } from "./services/authService";
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
            <Layout />
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
        <Route path="activities/master-plan" element={<MasterPlanPage />} />
        <Route path="activities/site-attendance" element={<SiteAttendancePage />} />
        <Route path="activities/documents" element={<ProjectDocumentsPage />} />
        <Route path="activities/partner-investment" element={<PartnerInvestmentPage />} />
        <Route path="admin/approval-chains" element={<ApprovalChainAdminPage />} />
        <Route path="admin/projects" element={<ProjectManagementPage />} />
        <Route path="admin/capitol-fund" element={<CapitolFundPage />} />
        <Route path="admin/project-estimation" element={<ProjectEstimationPage />} />
        <Route path="reports/attendance" element={<AttendanceReportsPage />} />
      </Route>
    </Routes>
  );
}
