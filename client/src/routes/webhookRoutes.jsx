import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const WebhookDashboard = lazy(() =>
  import("../components/webhooks/WebhookDashboard")
);
const WebhookList = lazy(() => import("../components/webhooks/WebhookList"));
const WebhookDetail = lazy(() =>
  import("../components/webhooks/WebhookDetail")
);
const WebhookCreate = lazy(() =>
  import("../components/webhooks/WebhookCreate")
);

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
  </div>
);

export default function WebhookRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="webhooks" element={<WebhookDashboard />}>
          <Route index element={<Navigate to="list" replace />} />
          <Route path="list" element={<WebhookList />} />
          <Route path="create" element={<WebhookCreate />} />
          <Route path=":id" element={<WebhookDetail />} />
          <Route path=":id/edit" element={<WebhookCreate isEdit />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
