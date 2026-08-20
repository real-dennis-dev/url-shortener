import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const UserProfile = lazy(() => import("../components/users/UserProfile"));
const UserSettings = lazy(() => import("../components/users/UserSettings"));
const UserSecurity = lazy(() => import("../components/users/UserSecurity"));
const UserPreferences = lazy(() =>
  import("../components/users/UserPreferences")
);
const UserStatistics = lazy(() => import("../components/users/UserStatistics"));
const UserActivity = lazy(() => import("../components/users/UserActivity"));
const UserManagement = lazy(() => import("../components/users/UserManagement"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
  </div>
);

export default function UserRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="profile" element={<UserProfile />} />

        <Route path="settings" element={<UserSettings />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="security" element={<UserSecurity />} />
          <Route path="preferences" element={<UserPreferences />} />
        </Route>

        <Route path="statistics" element={<UserStatistics />} />
        <Route path="activity" element={<UserActivity />} />
        <Route path="admin/users" element={<UserManagement />} />
      </Routes>
    </Suspense>
  );
}
