import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import SystemService from "../services/system.service";

/**
 * Custom hook for managing system operations
 */
export function useSystem() {
  const { isAuthenticated, user } = useAuth();

  // Health Check State
  const [health, setHealth] = useState(null);

  // System Status State
  const [status, setStatus] = useState(null);

  // Settings State
  const [settings, setSettings] = useState(null);

  // Metrics State
  const [metrics, setMetrics] = useState(null);

  // Logs State
  const [logs, setLogs] = useState([]);
  const [logsPagination, setLogsPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [logsFilters, setLogsFilters] = useState({
    operation: "",
    userId: "",
    dateFrom: "",
    dateTo: "",
  });

  // Maintenance State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-refresh interval
  const refreshIntervalRef = useRef(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  /**
   * Check system health
   */
  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await SystemService.healthCheck();
      if (response.data) {
        setHealth(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      setError(err.message || "Failed to check health");
      console.error("Health check error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get system status
   */
  const fetchSystemStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await SystemService.getSystemStatus();
      if (response.data) {
        setStatus(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      setError(err.message || "Failed to fetch system status");
      console.error("System status error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get system settings
   */
  const fetchSettings = useCallback(
    async (keys = []) => {
      if (!isAuthenticated) {
        setError("Authentication required to view settings");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await SystemService.getSettings(keys);
        if (response.data) {
          setSettings(response.data);
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err.message || "Failed to fetch settings");
        console.error("Fetch settings error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Update system settings
   */
  const updateSettings = useCallback(
    async (settingsData) => {
      if (!isAuthenticated) {
        setError("Authentication required to update settings");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await SystemService.updateSettings(settingsData);
        if (response.data) {
          setSettings(response.data);
          return true;
        }
        return false;
      } catch (err) {
        setError(err.message || "Failed to update settings");
        console.error("Update settings error:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Toggle maintenance mode
   */
  const toggleMaintenance = useCallback(
    async (enable, message = "") => {
      if (!isAuthenticated) {
        setError("Authentication required to toggle maintenance mode");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await SystemService.toggleMaintenance(enable, message);
        if (response.data) {
          setMaintenanceMode(response.data.maintenanceMode);
          setMaintenanceMessage(response.data.message || "");
          return true;
        }
        return false;
      } catch (err) {
        setError(err.message || "Failed to toggle maintenance mode");
        console.error("Toggle maintenance error:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Get system metrics
   */
  const fetchMetrics = useCallback(async () => {
    if (!isAuthenticated) {
      setError("Authentication required to view metrics");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await SystemService.getMetrics();
      if (response.data) {
        setMetrics(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      setError(err.message || "Failed to fetch metrics");
      console.error("Fetch metrics error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Clear system cache
   */
  const clearCache = useCallback(async () => {
    if (!isAuthenticated) {
      setError("Authentication required to clear cache");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await SystemService.clearCache();
      return response.data?.success || false;
    } catch (err) {
      setError(err.message || "Failed to clear cache");
      console.error("Clear cache error:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Fetch system logs
   */
  const fetchLogs = useCallback(
    async (params = {}) => {
      if (!isAuthenticated) {
        setError("Authentication required to view logs");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const mergedParams = {
          ...logsFilters,
          page: logsPagination.page,
          limit: logsPagination.limit,
          ...params,
        };

        const response = await SystemService.getLogs(mergedParams);
        if (response.data) {
          setLogs(response.data.logs || []);
          setLogsPagination({
            page: response.data.page || 1,
            limit: response.data.limit || 50,
            total: response.data.total || 0,
            totalPages: response.data.totalPages || 0,
          });
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err.message || "Failed to fetch logs");
        console.error("Fetch logs error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, logsFilters, logsPagination.page, logsPagination.limit]
  );

  /**
   * Update logs filters
   */
  const updateLogsFilters = useCallback((newFilters) => {
    setLogsFilters((prev) => ({ ...prev, ...newFilters }));
    setLogsPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Change logs page
   */
  const changeLogsPage = useCallback((page) => {
    setLogsPagination((prev) => ({ ...prev, page }));
  }, []);

  /**
   * Start auto-refresh
   */
  const startAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    setAutoRefresh(true);

    refreshIntervalRef.current = setInterval(() => {
      // Refresh all data
      if (isAuthenticated) {
        fetchSystemStatus();
        if (user?.isAdmin) {
          fetchMetrics();
        }
      }
    }, refreshInterval);
  }, [isAuthenticated, refreshInterval, fetchSystemStatus, fetchMetrics, user]);

  /**
   * Stop auto-refresh
   */
  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    setAutoRefresh(false);
  }, []);

  /**
   * Clear errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    stopAutoRefresh();
    setHealth(null);
    setStatus(null);
    setSettings(null);
    setMetrics(null);
    setLogs([]);
    setLogsPagination({
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0,
    });
    setLogsFilters({
      operation: "",
      userId: "",
      dateFrom: "",
      dateTo: "",
    });
    setMaintenanceMode(false);
    setMaintenanceMessage("");
    setError(null);
    setLoading(false);
  }, [stopAutoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoRefresh();
    };
  }, [stopAutoRefresh]);

  // Auto-fetch initial data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      checkHealth();
      fetchSystemStatus();

      // If admin, fetch additional data
      if (user?.isAdmin) {
        fetchSettings();
        fetchMetrics();
        fetchLogs();

        // Start auto-refresh for admins
        startAutoRefresh();
      }
    }
  }, [isAuthenticated, user]);

  return {
    // State
    health,
    status,
    settings,
    metrics,
    logs,
    logsPagination,
    logsFilters,
    maintenanceMode,
    maintenanceMessage,
    loading,
    error,
    autoRefresh,
    refreshInterval,
    isAdmin: user?.isAdmin || false,

    // Actions
    checkHealth,
    fetchSystemStatus,
    fetchSettings,
    updateSettings,
    toggleMaintenance,
    fetchMetrics,
    clearCache,
    fetchLogs,
    updateLogsFilters,
    changeLogsPage,
    startAutoRefresh,
    stopAutoRefresh,
    setRefreshInterval,
    clearError,
    reset,
  };
}

export default useSystem;
