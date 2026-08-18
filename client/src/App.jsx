import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext"; // adjust path if needed

import AuthRoutes from "./routes/AuthRoutes";
import UrlRoutes from "./routes/urlRoutes";
// import ConfessionRoutes from "./routes/ConfessionRoutes";
// import GroupRoutes from "./routes/GroupRoutes";
import LandingPage from "./components/LandingPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./components/DashboardHome";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import NotFound from "./components/NotFound";

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public / Guest */}
      <Route path="/" element={<LandingPage />} />
      {/* Auth pages (login, register, etc.) */}
      <Route path="/auth/*" element={<AuthRoutes />} />
      <Route
        path="/url/*"
        element={
          <ProtectedRoute>
            <UrlRoutes />
          </ProtectedRoute>
        }
      />

      {/* Protected Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        {/* Add more nested routes later */}
        {/* <Route path="settings" element={<Settings />} /> */}
      </Route>
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
