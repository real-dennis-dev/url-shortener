import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

const ModerateUrlPage = lazy(() =>
  import("../pages/moderation/ModerateUrlPage")
);
const ReportsPage = lazy(() => import("../pages/moderation/ReportsPage"));
const ReportDetailPage = lazy(() =>
  import("../pages/moderation/ReportDetailPage")
);
const BlacklistPage = lazy(() => import("../pages/moderation/BlacklistPage"));
const FlaggedUrlsPage = lazy(() =>
  import("../pages/moderation/FlaggedUrlsPage")
);
const ModerationLogsPage = lazy(() =>
  import("../pages/moderation/ModerationLogsPage")
);

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
  </div>
);

export default function ModerationRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="moderation" element={<ModerateUrlPage />} />
        <Route path="moderation/reports" element={<ReportsPage />} />
        <Route path="moderation/reports/:id" element={<ReportDetailPage />} />
        <Route path="moderation/flagged" element={<FlaggedUrlsPage />} />
        <Route path="moderation/logs/:urlId" element={<ModerationLogsPage />} />
        <Route path="moderation/blacklist" element={<BlacklistPage />} />
      </Routes>
    </Suspense>
  );
}

// Optional helpers you already had
export const hasModerationPermission = (user) => {
  return user?.role === "moderator" || user?.role === "admin";
};
