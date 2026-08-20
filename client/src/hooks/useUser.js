import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import UserService from "../services/user.service";

/**
 * Custom hook for managing user operations
 */
export function useUser() {
  const { user, isAuthenticated, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  /**
   * Fetch user profile
   */
  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await UserService.getProfile();
      if (response.data) {
        setProfile(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      setError(err.message || "Failed to fetch profile");
      console.error("Fetch profile error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(
    async (data) => {
      if (!isAuthenticated) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await UserService.updateProfile(data);
        if (response.data) {
          setProfile(response.data);
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err.message || "Failed to update profile");
        console.error("Update profile error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Regenerate API key
   */
  const regenerateApiKey = useCallback(async () => {
    if (!isAuthenticated) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await UserService.regenerateApiKey();
      return response.data;
    } catch (err) {
      setError(err.message || "Failed to regenerate API key");
      console.error("Regenerate API key error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Change password
   */
  const changePassword = useCallback(
    async (data) => {
      if (!isAuthenticated) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await UserService.changePassword(data);
        return response;
      } catch (err) {
        setError(err.message || "Failed to change password");
        console.error("Change password error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Fetch user preferences
   */
  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await UserService.getPreferences();
      if (response.data) {
        setPreferences(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      setError(err.message || "Failed to fetch preferences");
      console.error("Fetch preferences error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Update user preferences
   */
  const updatePreferences = useCallback(
    async (data) => {
      if (!isAuthenticated) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await UserService.updatePreferences(data);
        if (response.data) {
          setPreferences(response.data);
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err.message || "Failed to update preferences");
        console.error("Update preferences error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Fetch user statistics
   */
  const fetchStatistics = useCallback(async () => {
    if (!isAuthenticated) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await UserService.getStatistics();
      if (response.data) {
        setStatistics(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      setError(err.message || "Failed to fetch statistics");
      console.error("Fetch statistics error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Fetch user activity
   */
  const fetchActivity = useCallback(
    async (params = {}) => {
      if (!isAuthenticated) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await UserService.getActivity({
          page: pagination.page,
          limit: pagination.limit,
          ...params,
        });

        if (response.data) {
          setActivity(response.data.activities || []);
          setPagination({
            page: response.data.page || 1,
            limit: response.data.limit || 20,
            total: response.data.total || 0,
            totalPages: response.data.totalPages || 0,
          });
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err.message || "Failed to fetch activity");
        console.error("Fetch activity error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, pagination.page, pagination.limit]
  );

  /**
   * Fetch all users (Admin only)
   */
  const fetchAllUsers = useCallback(
    async (params = {}) => {
      if (!isAuthenticated) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await UserService.getAllUsers({
          page: pagination.page,
          limit: pagination.limit,
          ...params,
        });

        if (response.data) {
          setUsers(response.data.users || []);
          setPagination({
            page: response.data.page || 1,
            limit: response.data.limit || 20,
            total: response.data.total || 0,
            totalPages: response.data.totalPages || 0,
          });
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err.message || "Failed to fetch users");
        console.error("Fetch users error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, pagination.page, pagination.limit]
  );

  /**
   * Update user plan (Admin only)
   */
  const updateUserPlan = useCallback(
    async (plan) => {
      if (!isAuthenticated) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await UserService.updatePlan(plan);
        return response.data;
      } catch (err) {
        setError(err.message || "Failed to update plan");
        console.error("Update plan error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Delete user account
   */
  const deleteAccount = useCallback(
    async (data) => {
      if (!isAuthenticated) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await UserService.deleteAccount(data);
        await logout();
        return response;
      } catch (err) {
        setError(err.message || "Failed to delete account");
        console.error("Delete account error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, logout]
  );

  /**
   * Change page for pagination
   */
  const changePage = useCallback((page) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setProfile(null);
    setPreferences(null);
    setStatistics(null);
    setActivity([]);
    setUsers([]);
    setError(null);
    setPagination({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
  }, []);

  // Auto-fetch profile on authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
      fetchPreferences();
    } else {
      reset();
    }
  }, [isAuthenticated, fetchProfile, fetchPreferences, reset]);

  return {
    // State
    profile,
    preferences,
    statistics,
    activity,
    users,
    loading,
    error,
    pagination,

    // Profile actions
    fetchProfile,
    updateProfile,

    // Security actions
    regenerateApiKey,
    changePassword,

    // Preferences actions
    fetchPreferences,
    updatePreferences,

    // Statistics actions
    fetchStatistics,

    // Activity actions
    fetchActivity,

    // Admin actions
    fetchAllUsers,
    updateUserPlan,

    // Account actions
    deleteAccount,

    // Utility actions
    changePage,
    clearError,
    reset,
  };
}

export default useUser;
