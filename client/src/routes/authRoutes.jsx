import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import { LoadingSpinner } from "../components/common";

// Lazy-loaded authentication pages
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() =>
  import("../pages/auth/ForgotPasswordPage")
);
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("../pages/auth/VerifyEmailPage"));

// Protected auth-related pages
const ProfilePage = lazy(() => import("../pages/auth/ProfilePage"));
const SessionsPage = lazy(() => import("../pages/auth/SessionsPage"));

function AuthRoutes() {
  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<LoadingSpinner size="lg" />}>
          <Routes>
            {/* /auth */}
            <Route index element={<Navigate to="/auth/login" replace />} />

            {/* /auth/login */}
            <Route
              path="login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* /auth/register */}
            <Route
              path="register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* /auth/forgot-password */}
            <Route
              path="forgot-password"
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              }
            />

            {/* /auth/reset-password/:token */}
            <Route
              path="reset-password/:token"
              element={
                <PublicRoute>
                  <ResetPasswordPage />
                </PublicRoute>
              }
            />

            {/* /auth/verify-email/:token */}
            <Route path="verify-email/:token" element={<VerifyEmailPage />} />

            {/* /auth/profile */}
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* /auth/sessions */}
            <Route
              path="sessions"
              element={
                <ProtectedRoute>
                  <SessionsPage />
                </ProtectedRoute>
              }
            />

            {/* Unknown auth route */}
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default AuthRoutes;
