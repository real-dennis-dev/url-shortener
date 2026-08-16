// hooks/useAuth.js
import { useState, useCallback, useEffect, useMemo } from "react";
import { useAuth as useAuthContext } from "../contexts/AuthContext";
import AuthService from "../services/auth.service";
import { toast } from "../components/common/Toast";

/**
 * useAuth hook - Provides authentication functionality
 * Extends the AuthContext with additional UI state management
 */
export const useAuth = () => {
  const authContext = useAuthContext();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionStats, setSessionStats] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);

  // Reset error state
  const clearError = useCallback(() => setError(null), []);

  // Login with UI state management
  const login = useCallback(
    async (email, password, rememberMe = false) => {
      try {
        setLoading(true);
        setError(null);

        const deviceInfo = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          rememberMe,
        };

        const response = await AuthService.login(email, password, deviceInfo);

        // Update auth context
        authContext.setUser(response.data.user);

        toast({
          title: "Welcome back!",
          children: `Hello, ${response.data.user.fullName}`,
          variant: "success",
        });

        return response;
      } catch (err) {
        const message = err.data?.message || err.message || "Login failed";
        setError(message);
        toast({
          title: "Login Failed",
          children: message,
          variant: "error",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [authContext]
  );

  // Register with UI state management
  const register = useCallback(
    async (data) => {
      try {
        setLoading(true);
        setError(null);

        const response = await AuthService.register(data);

        // Update auth context
        authContext.setUser(response.data.user);

        toast({
          title: "Welcome!",
          children: `Account created successfully. Hello, ${response.data.user.fullName}!`,
          variant: "success",
        });

        return response;
      } catch (err) {
        const message =
          err.data?.message || err.message || "Registration failed";
        setError(message);
        toast({
          title: "Registration Failed",
          children: message,
          variant: "error",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [authContext]
  );

  // Logout with UI state management
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await AuthService.logout();
      authContext.setUser(null);
      toast({
        title: "Logged Out",
        children: "You have been successfully logged out.",
        variant: "info",
      });
    } catch (err) {
      // Even if logout fails on server, clear local state
      console.warn("Logout error:", err);
      authContext.setUser(null);
      toast({
        title: "Logout",
        children: "You have been logged out locally.",
        variant: "warning",
      });
    } finally {
      setLoading(false);
    }
  }, [authContext]);

  // Change password
  const changePassword = useCallback(
    async (currentPassword, newPassword, confirmPassword) => {
      try {
        setLoading(true);
        setError(null);

        const response = await AuthService.changePassword(
          currentPassword,
          newPassword,
          confirmPassword
        );

        toast({
          title: "Password Updated",
          children: "Your password has been changed successfully.",
          variant: "success",
        });

        return response;
      } catch (err) {
        const message =
          err.data?.message || err.message || "Password change failed";
        setError(message);
        toast({
          title: "Password Change Failed",
          children: message,
          variant: "error",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Request password reset
  const requestPasswordReset = useCallback(async (email) => {
    try {
      setLoading(true);
      setError(null);

      const response = await AuthService.requestPasswordReset(email);

      toast({
        title: "Reset Email Sent",
        children: "Check your email for password reset instructions.",
        variant: "success",
      });

      return response;
    } catch (err) {
      const message =
        err.data?.message || err.message || "Failed to send reset email";
      setError(message);
      toast({
        title: "Reset Failed",
        children: message,
        variant: "error",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset password with token
  const resetPassword = useCallback(
    async (token, newPassword, confirmPassword) => {
      try {
        setLoading(true);
        setError(null);

        const response = await AuthService.resetPassword(
          token,
          newPassword,
          confirmPassword
        );

        toast({
          title: "Password Reset",
          children: "Your password has been reset successfully. Please login.",
          variant: "success",
        });

        return response;
      } catch (err) {
        const message =
          err.data?.message || err.message || "Password reset failed";
        setError(message);
        toast({
          title: "Reset Failed",
          children: message,
          variant: "error",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Verify email
  const verifyEmail = useCallback(
    async (token) => {
      try {
        setLoading(true);
        setError(null);

        const response = await AuthService.verifyEmail(token);

        toast({
          title: "Email Verified",
          children: "Your email has been verified successfully.",
          variant: "success",
        });

        // Refresh user data
        await authContext.checkAuth();

        return response;
      } catch (err) {
        const message =
          err.data?.message || err.message || "Email verification failed";
        setError(message);
        toast({
          title: "Verification Failed",
          children: message,
          variant: "error",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [authContext]
  );

  // Regenerate API key
  const regenerateApiKey = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AuthService.regenerateApiKey();

      toast({
        title: "API Key Regenerated",
        children: "Your API key has been regenerated successfully.",
        variant: "success",
      });

      // Refresh user data to get new API key
      await authContext.checkAuth();

      return response;
    } catch (err) {
      const message =
        err.data?.message || err.message || "Failed to regenerate API key";
      setError(message);
      toast({
        title: "API Key Regeneration Failed",
        children: message,
        variant: "error",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authContext]);

  // Session Management

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AuthService.getSessions();
      setSessions(response.data || []);
      return response;
    } catch (err) {
      const message =
        err.data?.message || err.message || "Failed to fetch sessions";
      setError(message);
      toast({
        title: "Sessions Fetch Failed",
        children: message,
        variant: "error",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch session statistics
  const fetchSessionStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AuthService.getSessionStats();
      setSessionStats(response.data);
      return response;
    } catch (err) {
      const message =
        err.data?.message || err.message || "Failed to fetch session stats";
      setError(message);
      toast({
        title: "Session Stats Fetch Failed",
        children: message,
        variant: "error",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch current session
  const fetchCurrentSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AuthService.getCurrentSession();
      setCurrentSession(response.data);
      return response;
    } catch (err) {
      const message =
        err.data?.message || err.message || "Failed to fetch current session";
      setError(message);
      toast({
        title: "Current Session Fetch Failed",
        children: message,
        variant: "error",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Revoke a session
  const revokeSession = useCallback(
    async (sessionToken) => {
      try {
        setLoading(true);
        setError(null);

        const response = await AuthService.revokeSession(sessionToken);

        toast({
          title: "Session Revoked",
          children: "The session has been successfully revoked.",
          variant: "success",
        });

        // Refresh sessions list
        await fetchSessions();

        return response;
      } catch (err) {
        const message =
          err.data?.message || err.message || "Failed to revoke session";
        setError(message);
        toast({
          title: "Session Revoke Failed",
          children: message,
          variant: "error",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchSessions]
  );

  // Revoke all sessions except current
  const revokeAllSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AuthService.revokeAllSessions();

      toast({
        title: "All Sessions Revoked",
        children: "All other sessions have been successfully revoked.",
        variant: "success",
      });

      // Refresh sessions list
      await fetchSessions();

      return response;
    } catch (err) {
      const message =
        err.data?.message || err.message || "Failed to revoke all sessions";
      setError(message);
      toast({
        title: "Session Revoke Failed",
        children: message,
        variant: "error",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSessions]);

  // Auto-fetch sessions when authenticated
  useEffect(() => {
    if (authContext.isAuthenticated) {
      fetchSessions();
      fetchSessionStats();
      fetchCurrentSession();
    }
  }, [authContext.isAuthenticated]);

  // Memoized return value
  return useMemo(
    () => ({
      // Authentication state
      user: authContext.user,
      loading: loading || authContext.loading,
      error,
      isAuthenticated: authContext.isAuthenticated,

      // Authentication actions
      login,
      logout,
      register,
      changePassword,
      requestPasswordReset,
      resetPassword,
      verifyEmail,
      regenerateApiKey,
      checkAuth: authContext.checkAuth,

      // Session management
      sessions,
      sessionStats,
      currentSession,
      fetchSessions,
      fetchSessionStats,
      fetchCurrentSession,
      revokeSession,
      revokeAllSessions,

      // Utilities
      clearError,
    }),
    [
      authContext.user,
      authContext.loading,
      authContext.isAuthenticated,
      authContext.checkAuth,
      loading,
      error,
      sessions,
      sessionStats,
      currentSession,
      login,
      logout,
      register,
      changePassword,
      requestPasswordReset,
      resetPassword,
      verifyEmail,
      regenerateApiKey,
      fetchSessions,
      fetchSessionStats,
      fetchCurrentSession,
      revokeSession,
      revokeAllSessions,
      clearError,
    ]
  );
};
