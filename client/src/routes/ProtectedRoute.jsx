import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoadingSpinner } from "../components/common";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  /*
   * AuthContext is still checking /auth/me.
   *
   * Do not redirect while this is happening.
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  /*
   * User is not authenticated.
   *
   * Send them to login and preserve the page
   * they originally attempted to access.
   */
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/auth/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  /*
   * User is authenticated.
   */
  return children;
}

export default ProtectedRoute;
