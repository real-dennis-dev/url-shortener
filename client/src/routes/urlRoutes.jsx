import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { LoadingSpinner } from "../components/common";

// Lazy-loaded pages
const UrlList = lazy(() => import("../components/url/UrlList"));
const UrlDetail = lazy(() => import("../components/url/UrlDetail"));
const UrlCreate = lazy(() => import("../components/url/UrlCreate"));
const UrlEdit = lazy(() => import("../components/url/UrlEdit"));
const UrlAnalytics = lazy(() => import("../components/url/UrlAnalytics"));
const UrlBulkCreate = lazy(() => import("../components/url/UrlBulkCreate"));
const UrlStats = lazy(() => import("../components/url/UrlStats"));

const SuspensePage = ({ children }) => (
  <Suspense
    fallback={
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    }
  >
    {children}
  </Suspense>
);

function UrlRoutes() {
  return (
    <Routes>
      {/* /url */}
      <Route
        index
        element={
          <SuspensePage>
            <UrlList />
          </SuspensePage>
        }
      />

      {/* /url/urls */}
      <Route
        path="urls"
        element={
          <SuspensePage>
            <UrlList />
          </SuspensePage>
        }
      />

      {/* /url/urls/create */}
      <Route
        path="urls/create"
        element={
          <SuspensePage>
            <UrlCreate />
          </SuspensePage>
        }
      />

      {/* /url/urls/bulk-create */}
      <Route
        path="urls/bulk-create"
        element={
          <SuspensePage>
            <UrlBulkCreate />
          </SuspensePage>
        }
      />

      {/* /url/urls/:id */}
      <Route
        path="urls/:id"
        element={
          <SuspensePage>
            <UrlDetail />
          </SuspensePage>
        }
      />

      {/* /url/urls/:id/edit */}
      <Route
        path="urls/:id/edit"
        element={
          <SuspensePage>
            <UrlEdit />
          </SuspensePage>
        }
      />

      {/* /url/urls/:id/analytics */}
      <Route
        path="urls/:id/analytics"
        element={
          <SuspensePage>
            <UrlAnalytics />
          </SuspensePage>
        }
      />

      {/* /url/urls/:id/stats */}
      <Route
        path="urls/:id/stats"
        element={
          <SuspensePage>
            <UrlStats />
          </SuspensePage>
        }
      />

      {/* /url/urls/tag/:tag */}
      <Route
        path="urls/tag/:tag"
        element={
          <SuspensePage>
            <UrlList />
          </SuspensePage>
        }
      />

      {/* Anything unknown under /url */}
      <Route path="*" element={<Navigate to="/url" replace />} />
    </Routes>
  );
}

export default UrlRoutes;
