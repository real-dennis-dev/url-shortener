// routes/authRoutes.jsx
import { Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

// Lazy load components for better performance
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() =>
  import("../pages/auth/ForgotPasswordPage")
);
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("../pages/auth/VerifyEmailPage"));
const ProfilePage = lazy(() => import("../pages/auth/ProfilePage"));
const SessionsPage = lazy(() => import("../pages/auth/SessionsPage"));

// Protected route wrapper component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
};

// Public route wrapper (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Auth route configuration
const authRoutes = [
  {
    path: "auth",
    element: (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: "login",
        element: (
          <PublicRoute>
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <LoginPage />
            </Suspense>
          </PublicRoute>
        ),
      },
      {
        path: "register",
        element: (
          <PublicRoute>
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <RegisterPage />
            </Suspense>
          </PublicRoute>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <PublicRoute>
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <ForgotPasswordPage />
            </Suspense>
          </PublicRoute>
        ),
      },
      {
        path: "reset-password/:token",
        element: (
          <PublicRoute>
            <Suspense fallback={<LoadingSpinner size="lg" />}>
              <ResetPasswordPage />
            </Suspense>
          </PublicRoute>
        ),
      },
      {
        path: "verify-email/:token",
        element: (
          <Suspense fallback={<LoadingSpinner size="lg" />}>
            <VerifyEmailPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "profile",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner size="lg" />}>
          <ProfilePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "sessions",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner size="lg" />}>
          <SessionsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
];

export default authRoutes;

// Utility to use with React Router v6
export const getAuthRoutes = () => authRoutes;
