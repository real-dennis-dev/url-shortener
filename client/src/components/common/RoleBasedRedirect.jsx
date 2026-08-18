// src/components/common/RoleBasedRedirect.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import LoadingSpinner from "./LoadingSpinner";

const RoleBasedRedirect = ({ to = "/" }) => {
  const { user, isAuthenticated, loading } = useRequireAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/login", { replace: true });
      } else if (user) {
        console.log("Redirecting user with role:", user.role);

        // Define role-based redirect paths
        const roleRedirects = {
          admin: "/admin/dashboard",
          manager: "/admin/dashboard",
          pharmacist: "/admin/dashboard",
          developer: "/admin/dashboard", // or "/developer/dashboard"
          tester: "/admin/dashboard", // or "/tester/dashboard"
          customer: "/products",
        };

        const redirectPath = roleRedirects[user.role] || to;
        navigate(redirectPath, { replace: true });
      }
    }
  }, [user, isAuthenticated, loading, navigate, to]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return null;
};

export default RoleBasedRedirect;
