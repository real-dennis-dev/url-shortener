import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import AnalyticsService from "../services/analytics.service";

/**
 * Custom hook for managing analytics operations
 */
export function useAnalytics() {
  const { isAuthenticated } = useAuth();

  // State
  const [dashboardData, setDashboardData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [urlAnalytics, setUrlAnalytics] = useState(null);
  const [deviceAnalytics, setDeviceAnalytics] = useState(null);
  const [locationAnalytics, setLocationAnalytics] = useState(null);
  const [referrers, setReferrers] = useState([]);
  const [timelineData, setTimelineData] = useState(null);
  const [realtimeData, setRealtimeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [selectedUrlId, setSelectedUrlId] = useState(null);
  const [timelineInterval, setTimelineInterval] = useState("day");

  // Real-time polling
  const pollingIntervalRef = useRef(null);
  const [isPolling, setIsPolling] = useState(false);

  /**
   * Format date for API
   */
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  /**
   * Get default date range (last 30 days)
   */
  const getDefaultDateRange = useCallback(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      startDate: formatDate(start),
      endDate: formatDate(end),
    };
  }, []);

  /**
   * Fetch dashboard data
   */
  const fetchDashboard = useCallback(
    async (customDateRange = null) => {
      if (!isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const range = customDateRange || dateRange;
        const params = {};
        if (range.startDate) params.startDate = range.startDate;
        if (range.endDate) params.endDate = range.endDate;

        const response = await AnalyticsService.getDashboard(params);
        if (response.data) {
          setDashboardData(response.data);
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err.message || "Failed to fetch dashboard data");
        console.error("Dashboard fetch error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, dateRange]
  );

  /**
   * Fetch overview analytics
   */
  const fetchOverview = useCallback(
    async (customDateRange = null) => {
      if (!isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const range = customDateRange || dateRange;
        const params = {};
        if (range.startDate) params.startDate = range.startDate;
        if (range.endDate) params.endDate = range.endDate;

        const response = await AnalyticsService.getOverview(params);
        if (response.data) {
          setOverviewData(response.data);
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err.message || "Failed to fetch overview data");
        console.error("Overview fetch error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, dateRange]
  );

  /**
   * Fetch URL analytics
   */
  const fetchUrlAnalytics = useCallback(
    async (urlId, customDateRange = null, filters = {}) => {
      if (!isAuthenticated || !urlId) return;

      setLoading(true);
      setError(null);

      try {
        const range = customDateRange || dateRange;
        const params = {
          ...filters,
        };
        if (range.startDate) params.startDate = range.startDate;
        if (range.endDate) params.endDate = range.endDate;

        const response = await AnalyticsService.getUrlAnalytics(urlId, params);
        if (response.data) {
          setUrlAnalytics(response.data);
          setSelectedUrlId(urlId);
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err.message || "Failed to fetch URL analytics");
        console.error("URL analytics fetch error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, dateRange]
  );

  /**
   * Fetch device analytics
   */
  const fetchDeviceAnalytics = useCallback(
    async (urlId = null, customDateRange = null) => {
      if (!isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const range = customDateRange || dateRange;
        const params = {};
        if (urlId) params.urlId = urlId;
        if (range.startDate) params.startDate = range.startDate;
        if (range.endDate) params.endDate = range.endDate;

        const response = await AnalyticsService.getDeviceAnalytics(params);
        if (response.data) {
          setDeviceAnalytics(response.data);
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err.message || "Failed to fetch device analytics");
        console.error("Device analytics fetch error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, dateRange]
  );

  /**
   * Fetch location analytics
   */
  const fetchLocationAnalytics = useCallback(
    async (urlId = null, customDateRange = null) => {
      if (!isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const range = customDateRange || dateRange;
        const params = {};
        if (urlId) params.urlId = urlId;
        if (range.startDate) params.startDate = range.startDate;
        if (range.endDate) params.endDate = range.endDate;

        const response = await AnalyticsService.getLocationAnalytics(params);
        if (response.data) {
          setLocationAnalytics(response.data);
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err.message || "Failed to fetch location analytics");
        console.error("Location analytics fetch error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, dateRange]
  );

  /**
   * Fetch referrers
   */
  const fetchReferrers = useCallback(
    async (urlId = null, limit = 10) => {
      if (!isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const params = { limit };
        if (urlId) params.urlId = urlId;

        const response = await AnalyticsService.getReferrers(params);
        if (response.data) {
          setReferrers(response.data);
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err.message || "Failed to fetch referrers");
        console.error("Referrers fetch error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Fetch timeline data
   */
  const fetchTimeline = useCallback(
    async (urlId = null, interval = null, customDateRange = null) => {
      if (!isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const range = customDateRange || dateRange;
        const params = {
          interval: interval || timelineInterval,
        };
        if (urlId) params.urlId = urlId;
        if (range.startDate) params.startDate = range.startDate;
        if (range.endDate) params.endDate = range.endDate;

        const response = await AnalyticsService.getTimeline(params);
        if (response.data) {
          setTimelineData(response.data);
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err.message || "Failed to fetch timeline data");
        console.error("Timeline fetch error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, dateRange, timelineInterval]
  );

  /**
   * Fetch real-time analytics
   */
  const fetchRealtime = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await AnalyticsService.getRealtime();
      if (response.data) {
        setRealtimeData(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      console.error("Real-time fetch error:", err);
      return null;
    }
  }, [isAuthenticated]);

  /**
   * Start real-time polling
   */
  const startRealtimePolling = useCallback(
    (interval = 5000) => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      setIsPolling(true);

      // Initial fetch
      fetchRealtime();

      pollingIntervalRef.current = setInterval(() => {
        fetchRealtime();
      }, interval);
    },
    [fetchRealtime]
  );

  /**
   * Stop real-time polling
   */
  const stopRealtimePolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  /**
   * Export analytics data
   */
  const exportAnalytics = useCallback(
    async (urlId, format = "csv", customDateRange = null) => {
      if (!isAuthenticated || !urlId) return null;

      setLoading(true);
      setError(null);

      try {
        const range = customDateRange || dateRange;
        const params = {
          format,
        };
        if (range.startDate) params.startDate = range.startDate;
        if (range.endDate) params.endDate = range.endDate;

        const blob = await AnalyticsService.exportAnalytics(urlId, params);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const extension =
          format === "csv" ? "csv" : format === "excel" ? "xlsx" : "json";
        link.download = `analytics_export.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return true;
      } catch (err) {
        setError(err.message || "Failed to export analytics");
        console.error("Export error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, dateRange]
  );

  /**
   * Update date range
   */
  const updateDateRange = useCallback((newRange) => {
    setDateRange((prev) => ({
      ...prev,
      ...newRange,
    }));
  }, []);

  /**
   * Update timeline interval
   */
  const updateTimelineInterval = useCallback((interval) => {
    setTimelineInterval(interval);
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
    stopRealtimePolling();
    setDashboardData(null);
    setOverviewData(null);
    setUrlAnalytics(null);
    setDeviceAnalytics(null);
    setLocationAnalytics(null);
    setReferrers([]);
    setTimelineData(null);
    setRealtimeData(null);
    setError(null);
    setLoading(false);
    setSelectedUrlId(null);
    setDateRange(getDefaultDateRange());
    setTimelineInterval("day");
  }, [stopRealtimePolling, getDefaultDateRange]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopRealtimePolling();
    };
  }, [stopRealtimePolling]);

  // Auto-fetch dashboard when authenticated or date range changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated, dateRange.startDate, dateRange.endDate]);

  return {
    // State
    dashboardData,
    overviewData,
    urlAnalytics,
    deviceAnalytics,
    locationAnalytics,
    referrers,
    timelineData,
    realtimeData,
    loading,
    error,
    dateRange,
    selectedUrlId,
    timelineInterval,
    isPolling,

    // Actions
    fetchDashboard,
    fetchOverview,
    fetchUrlAnalytics,
    fetchDeviceAnalytics,
    fetchLocationAnalytics,
    fetchReferrers,
    fetchTimeline,
    fetchRealtime,
    startRealtimePolling,
    stopRealtimePolling,
    exportAnalytics,
    updateDateRange,
    updateTimelineInterval,
    clearError,
    reset,
    getDefaultDateRange,
  };
}

export default useAnalytics;
