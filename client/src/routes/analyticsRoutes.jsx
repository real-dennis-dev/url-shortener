import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const AnalyticsDashboard = lazy(() =>
  import("../components/analytics/AnalyticsDashboard")
);
const AnalyticsOverview = lazy(() =>
  import("../components/analytics/AnalyticsOverview")
);
const AnalyticsUrlDetail = lazy(() =>
  import("../components/analytics/AnalyticsUrlDetail")
);
const AnalyticsRealtime = lazy(() =>
  import("../components/analytics/AnalyticsRealtime")
);
const AnalyticsExport = lazy(() =>
  import("../components/analytics/AnalyticsExport")
);

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
  </div>
);

export default function AnalyticsRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="analytics" element={<AnalyticsDashboard />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AnalyticsOverview />} />
          <Route path="url/:id" element={<AnalyticsUrlDetail />} />
          <Route path="realtime" element={<AnalyticsRealtime />} />
          <Route path="export" element={<AnalyticsExport />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
