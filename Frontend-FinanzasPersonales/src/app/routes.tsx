import { createBrowserRouter, Navigate } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { DashboardLayout } from "./components/DashboardLayout";
import { DashboardHome } from "./pages/DashboardHome";
import { RegisterIncomePage } from "./pages/RegisterIncomePage";
import { RegisterExpensePage } from "./pages/RegisterExpensePage";
import { AdminPage } from "./pages/AdminPage";

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
      { path: "income", element: <RegisterIncomePage /> },
      { path: "expense", element: <RegisterExpensePage /> },
      { path: "history", element: <Navigate to="/dashboard" replace /> },
      { path: "admin", element: <AdminPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);