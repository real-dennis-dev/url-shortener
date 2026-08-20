import { useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import LogsService from "../services/logs.service";

/**
 * Custom hook for managing API logs
 */
export function useLogs() {
  const { isAuthenticated, user } = useAuth();

  // State
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [userSummary, setUserSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filter state
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    method: "",
    statusCode: "",
    endpoint: "",
    minResponseTime: "",
    maxResponseTime: "",
    search: "",
    sortBy: "createdAt",
    sortOrder: "DESC",
  });

  /**
   * Fetch logs with current filters and pagination
   */
  const fetchLogs = useCallback(
    async (page = pagination.page, limit = pagination.limit) => {
      if (!isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const params = {
          ...filters,
          page,
          limit,
          // Only include non-empty values
          ...(filters.startDate && { startDate: filters.startDate }),
          ...(filters.endDate && { endDate: filters.endDate }),
          ...(filters.method && { method: filters.method }),
          ...(filters.statusCode && { statusCode: filters.statusCode }),
          ...(filters.endpoint && { endpoint: filters.endpoint }),
          ...(filters.minResponseTime && {
            minResponseTime: filters.minResponseTime,
          }),
          ...(filters.maxResponseTime && {
            maxResponseTime: filters.maxResponseTime,
          }),
          ...(filters.search && { search: filters.search }),
          ...(filters.sortBy && { sortBy: filters.sortBy }),
          ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
        };

        const response = await LogsService.getLogs(params);

        if (response.data) {
          setLogs(response.data.logs || []);
          setPagination({
            page: response.data.page || 1,
            limit: response.data.limit || 20,
            total: response.data.total || 0,
            totalPages: response.data.totalPages || 0,
          });
        }
      } catch (err) {
        setError(err.message || "Failed to fetch logs");
        console.error("Fetch logs error:", err);
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, filters]
  );

  /**
   * Fetch a single log by ID
   */
  const fetchLogById = useCallback(
    async (id) => {
      if (!isAuthenticated || !id) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await LogsService.getLogDetails(id);
        if (response.data) {
          setSelectedLog(response.data);
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err.message || "Failed to fetch log details");
        console.error("Fetch log error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Fetch log statistics
   */
  const fetchStatistics = useCallback(
    async (dateRange = {}) => {
      if (!isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const params = {
          ...(dateRange.startDate && { startDate: dateRange.startDate }),
          ...(dateRange.endDate && { endDate: dateRange.endDate }),
        };
        const response = await LogsService.getStatistics(params);
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
    },
    [isAuthenticated]
  );

  /**
   * Fetch user summary
   */
  const fetchUserSummary = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const response = await LogsService.getUserSummary();
      if (response.data) {
        setUserSummary(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      setError(err.message || "Failed to fetch user summary");
      console.error("Fetch user summary error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Export logs
   */
  const exportLogs = useCallback(
    async (format = "json", dateRange = {}) => {
      if (!isAuthenticated) {
        setError("Please log in to export logs");
        return null;
      }

      setIsExporting(true);
      setExportProgress(0);
      setError(null);

      try {
        const params = {
          format,
          ...(dateRange.startDate && { startDate: dateRange.startDate }),
          ...(dateRange.endDate && { endDate: dateRange.endDate }),
          ...(filters.method && { method: filters.method }),
          ...(filters.statusCode && { statusCode: filters.statusCode }),
        };

        const blob = await LogsService.exportLogs(params);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const extension =
          format === "csv" ? "csv" : format === "excel" ? "xlsx" : "json";
        const timestamp = new Date().toISOString().slice(0, 10);
        link.download = `api_logs_${timestamp}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setExportProgress(100);
        return true;
      } catch (err) {
        setError(err.message || "Failed to export logs");
        console.error("Export logs error:", err);
        return null;
      } finally {
        setIsExporting(false);
        setTimeout(() => setExportProgress(0), 1000);
      }
    },
    [isAuthenticated, filters]
  );

  /**
   * Clean old logs (admin only)
   */
  const cleanOldLogs = useCallback(
    async (days = 30) => {
      if (!isAuthenticated) {
        setError("Please log in to clean logs");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await LogsService.cleanOldLogs(days);
        if (response.data) {
          // Refresh logs after cleaning
          await fetchLogs();
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err.message || "Failed to clean logs");
        console.error("Clean logs error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, fetchLogs]
  );

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    setFilters({
      startDate: "",
      endDate: "",
      method: "",
      statusCode: "",
      endpoint: "",
      minResponseTime: "",
      maxResponseTime: "",
      search: "",
      sortBy: "createdAt",
      sortOrder: "DESC",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Change page
   */
  const changePage = useCallback((page) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  /**
   * Change limit
   */
  const changeLimit = useCallback((limit) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
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
    setLogs([]);
    setSelectedLog(null);
    setStatistics(null);
    setUserSummary(null);
    setError(null);
    setExportProgress(0);
    setIsExporting(false);
    setPagination({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
    resetFilters();
  }, [resetFilters]);

  /**
   * Get status color for status code
   */
  const getStatusColor = useCallback((statusCode) => {
    if (!statusCode) return "neutral";
    if (statusCode >= 200 && statusCode < 300) return "success";
    if (statusCode >= 300 && statusCode < 400) return "warning";
    if (statusCode >= 400 && statusCode < 500) return "error";
    if (statusCode >= 500) return "error";
    return "neutral";
  }, []);

  /**
   * Get method color
   */
  const getMethodColor = useCallback((method) => {
    const colors = {
      GET: "primary",
      POST: "success",
      PUT: "warning",
      DELETE: "error",
      PATCH: "info",
    };
    return colors[method] || "neutral";
  }, []);

  // Auto-fetch logs when authenticated or filters/pagination change
  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs(pagination.page, pagination.limit);
    }
  }, [
    isAuthenticated,
    pagination.page,
    pagination.limit,
    filters.method,
    filters.statusCode,
    filters.search,
  ]);

  // Auto-fetch user summary when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserSummary();
    }
  }, [isAuthenticated]);

  // Auto-fetch statistics when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchStatistics();
    }
  }, [isAuthenticated]);

  return {
    // State
    logs,
    selectedLog,
    statistics,
    userSummary,
    loading,
    error,
    exportProgress,
    isExporting,
    pagination,
    filters,

    // Actions
    fetchLogs,
    fetchLogById,
    fetchStatistics,
    fetchUserSummary,
    exportLogs,
    cleanOldLogs,
    updateFilters,
    resetFilters,
    changePage,
    changeLimit,
    clearError,
    reset,

    // Helpers
    getStatusColor,
    getMethodColor,
  };
}

export default useLogs;
