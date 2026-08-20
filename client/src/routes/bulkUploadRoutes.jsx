import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const BulkUploadDashboard = lazy(() =>
  import("../components/bulk-upload/BulkUploadDashboard")
);
const BulkUploadList = lazy(() =>
  import("../components/bulk-upload/BulkUploadList")
);
const BulkUploadDetail = lazy(() =>
  import("../components/bulk-upload/BulkUploadDetail")
);
const BulkUploadStats = lazy(() =>
  import("../components/bulk-upload/BulkUploadStats")
);

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
  </div>
);

export default function BulkUploadRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="bulk-upload" element={<BulkUploadDashboard />}>
          <Route index element={<Navigate to="uploads" replace />} />
          <Route path="uploads" element={<BulkUploadList />} />
          <Route path="uploads/:id" element={<BulkUploadDetail />} />
          <Route path="stats" element={<BulkUploadStats />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
