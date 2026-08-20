import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AnalyticsProvider } from "./AnalyticsProvider";

export default function AnalyticsDashboard() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-700 mb-2">
            Authentication Required
          </h2>
          <p className="text-neutral-500">Please log in to access analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <AnalyticsProvider>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Outlet />
      </div>
    </AnalyticsProvider>
  );
}
