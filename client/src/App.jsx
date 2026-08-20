import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

import AuthRoutes from "./routes/AuthRoutes";
import UrlRoutes from "./routes/urlRoutes";
import bulkUploadRoutes from "./routes/bulkUploadRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import FooterRoutes from "./routes/footerRoutes";
import AnalyticsRoutes from "./routes/analyticsRoutes";
import BulkUploadRoutes from "./routes/bulkUploadRoutes";
import NotificationRoutes from "./routes/notificationRoutes";
import LogsRoutes from "./routes/logsRoutes";
import ModerationRoutes from "./routes/moderationRoutes";
import SystemRoutes from "./routes/systemRoutes";
import UserRoutes from "./routes/userRoutes";
import WebhookRoutes from "./routes/webhookRoutes";
import LandingPage from "./components/LandingPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./components/DashboardHome";
import ProtectedRoute from "./routes/ProtectedRoute";
import NotFound from "./components/NotFound";

import Login from "./pages/auth/LoginPage";
import Register from "./pages/auth/RegisterPage";

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public / Guest */}
      <Route path="/" element={<LandingPage />} />
      {/* Auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/*" element={<AuthRoutes />} />
      {/* Footer Pages */}
      <Route path="/*" element={<FooterRoutes />} />
      <Route path="analytics/*" element={<AnalyticsRoutes />} />
      <Route path="bulk-upload/*" element={<BulkUploadRoutes />} />
      <Route path="notifications/*" element={<NotificationRoutes />} />
      <Route path="logs/*" element={<LogsRoutes />} />
      <Route path="moderation/*" element={<ModerationRoutes />} />
      <Route path="system/*" element={<SystemRoutes />} />
      <Route path="users/*" element={<UserRoutes />} />
      {/* or more specific paths */}
      <Route path="webhooks/*" element={<WebhookRoutes />} />
      {/* Protected Routes with Dashboard Layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
      </Route>
      {/* URL Management */}
      <Route
        path="/url/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="*" element={<UrlRoutes />} />
      </Route>
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
