import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";

// Lazy load components
const NotificationList = lazy(() =>
  import("../components/notifications/NotificationList")
);
const NotificationPreferences = lazy(() =>
  import("../components/notifications/NotificationPreferences")
);
const NotificationAdmin = lazy(() =>
  import("../components/notifications/admin/NotificationAdmin")
);
const EmailTemplateManager = lazy(() =>
  import("../components/notifications/admin/EmailTemplateManager")
);
const NotificationTemplateManager = lazy(() =>
  import("../components/notifications/admin/NotificationTemplateManager")
);

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
  </div>
);

/**
 * Notification Routes Configuration
 */
export const notificationRoutes = [
  {
    path: "notifications",
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <NotificationList />
      </Suspense>
    ),
  },
  {
    path: "notifications/preferences",
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <NotificationPreferences />
      </Suspense>
    ),
  },
];

/**
 * Admin Notification Routes
 * These routes require admin privileges
 */
export const adminNotificationRoutes = [
  {
    path: "admin/notifications",
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <NotificationAdmin />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="send" replace />,
      },
      {
        path: "send",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <NotificationAdmin />
          </Suspense>
        ),
      },
      {
        path: "email-templates",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <EmailTemplateManager />
          </Suspense>
        ),
      },
      {
        path: "notification-templates",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <NotificationTemplateManager />
          </Suspense>
        ),
      },
    ],
  },
];

export default NotificationRoutes;
