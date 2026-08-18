import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoadingSpinner } from "../components/common";

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  /*
   * Wait until AuthContext finishes checking
   * whether the user has an existing session.
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  /*
   * Already authenticated.
   *
   * Don't allow authenticated users to remain
   * on login/register/etc.
   */
  if (isAuthenticated) {
    const from = location.state?.from?.pathname;

    return <Navigate to={from || "/dashboard"} replace />;
  }

  /*
   * Guest user can access the page.
   */
  return children;
}

export default PublicRoute;
