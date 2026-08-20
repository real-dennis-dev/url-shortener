import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // adjust path if needed

const SystemDashboard = lazy(() =>
  import("../components/system/SystemDashboard")
);
const SystemStatus = lazy(() => import("../components/system/SystemStatus"));
const SystemSettings = lazy(() =>
  import("../components/system/SystemSettings")
);
const SystemMetrics = lazy(() => import("../components/system/SystemMetrics"));
const SystemLogs = lazy(() => import("../components/system/SystemLogs"));
const SystemHealth = lazy(() => import("../components/system/SystemHealth"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
  </div>
);

const AdminGuard = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-error mb-2">Access Denied</h2>
          <p className="text-neutral-500">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }
  return children;
};

export default function SystemRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route
          path="system"
          element={
            <AdminGuard>
              <SystemDashboard />
            </AdminGuard>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<SystemStatus />} />
          <Route path="health" element={<SystemHealth />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="metrics" element={<SystemMetrics />} />
          <Route path="logs" element={<SystemLogs />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
