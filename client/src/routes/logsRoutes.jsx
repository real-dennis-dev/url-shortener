import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const LogsDashboard = lazy(() => import("../components/logs/LogsDashboard"));
const LogList = lazy(() => import("../components/logs/LogList"));
const LogDetail = lazy(() => import("../components/logs/LogDetail"));
const LogStatistics = lazy(() => import("../components/logs/LogStatistics"));
const LogExport = lazy(() => import("../components/logs/LogExport"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
  </div>
);

export default function LogsRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="logs" element={<LogsDashboard />}>
          <Route index element={<Navigate to="list" replace />} />
          <Route path="list" element={<LogList />} />
          <Route path="list/:id" element={<LogDetail />} />
          <Route path="statistics" element={<LogStatistics />} />
          <Route path="export" element={<LogExport />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
