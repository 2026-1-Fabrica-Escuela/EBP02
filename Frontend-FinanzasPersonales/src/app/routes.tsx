import { createBrowserRouter, Navigate } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { DashboardLayout } from "./components/DashboardLayout";
import { DashboardHome } from "./pages/DashboardHome";
import { RegisterIncomePage } from "./pages/RegisterIncomePage";
import { RegisterExpensePage } from "./pages/RegisterExpensePage";
import { BudgetPage } from "./pages/BudgetPage";
import { ReportPage } from "./pages/ReportPage";
import { SavingsRecommendationsPage } from "./pages/SavingsRecommendationsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { ActivityReportPage } from "./pages/ActivityReportPage";
import { AdminPage } from "./pages/AdminPage";
import { AdminUserEditPage } from "./pages/AdminUserEditPage";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "budgets", element: <BudgetPage /> },
      { path: "reports", element: <ReportPage /> },
      { path: "recommendations", element: <SavingsRecommendationsPage /> },
      { path: "income", element: <RegisterIncomePage /> },
      { path: "expense", element: <RegisterExpensePage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "admin", element: <AdminPage /> },
      { path: "admin/activity", element: <ActivityReportPage /> },
      { path: "admin/edit/:userId", element: <AdminUserEditPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);