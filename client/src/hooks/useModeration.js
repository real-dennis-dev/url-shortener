import { useCallback, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ModerationService from "../services/moderation.service";

/**
 * Custom hook for moderation operations
 * Provides state management for all moderation features
 */
export const useModeration = () => {
  const { user } = useAuth();
  const isModerator = user?.role === "moderator" || user?.role === "admin";

  // ============================================
  // State
  // ============================================

  // Moderation states
  const [moderating, setModerating] = useState(false);
  const [moderationResult, setModerationResult] = useState(null);
  const [moderationError, setModerationError] = useState(null);

  // Auto-moderation states
  const [autoChecking, setAutoChecking] = useState(false);
  const [autoResult, setAutoResult] = useState(null);

  // Flagged URLs states
  const [flaggedUrls, setFlaggedUrls] = useState([]);
  const [flaggedLoading, setFlaggedLoading] = useState(false);
  const [flaggedPagination, setFlaggedPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 0,
    limit: 20,
  });

  // Moderation logs states
  const [moderationLogs, setModerationLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPagination, setLogsPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 0,
    limit: 20,
  });

  // Reports states
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsPagination, setReportsPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 0,
    limit: 20,
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDetailLoading, setReportDetailLoading] = useState(false);

  // Report creation states
  const [reportCreating, setReportCreating] = useState(false);
  const [reportCreateError, setReportCreateError] = useState(null);

  // Report update states
  const [reportUpdating, setReportUpdating] = useState(false);
  const [reportUpdateError, setReportUpdateError] = useState(null);

  // Blacklist states
  const [blacklist, setBlacklist] = useState([]);
  const [blacklistLoading, setBlacklistLoading] = useState(false);
  const [blacklistPagination, setBlacklistPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 0,
    limit: 20,
  });
  const [blacklistAdding, setBlacklistAdding] = useState(false);
  const [blacklistRemoveLoading, setBlacklistRemoveLoading] = useState(false);

  // ============================================
  // Moderation Actions
  // ============================================

  /**
   * Moderate a URL
   */
  const moderateUrl = useCallback(
    async (urlId, data) => {
      if (!isModerator) {
        setModerationError("Insufficient permissions");
        return { success: false, error: "Insufficient permissions" };
      }

      setModerating(true);
      setModerationError(null);
      try {
        const result = await ModerationService.moderateUrl(urlId, data);
        setModerationResult(result);
        return { success: true, data: result };
      } catch (err) {
        const errorMsg = err.message || "Failed to moderate URL";
        setModerationError(errorMsg);
        return { success: false, error: errorMsg, status: err.status };
      } finally {
        setModerating(false);
      }
    },
    [isModerator]
  );

  /**
   * Auto-moderate a URL
   */
  const autoModerate = useCallback(async (data) => {
    setAutoChecking(true);
    setAutoResult(null);
    try {
      const result = await ModerationService.autoModerate(data);
      setAutoResult(result);
      return { success: true, data: result };
    } catch (err) {
      const errorMsg = err.message || "Failed to auto-moderate URL";
      return { success: false, error: errorMsg, status: err.status };
    } finally {
      setAutoChecking(false);
    }
  }, []);

  /**
   * Get flagged URLs
   */
  const fetchFlaggedUrls = useCallback(
    async (params = {}) => {
      if (!isModerator) {
        return { success: false, error: "Insufficient permissions" };
      }

      setFlaggedLoading(true);
      try {
        const result = await ModerationService.getFlaggedUrls({
          page: params.page || 1,
          limit: params.limit || 20,
        });
        setFlaggedUrls(result.urls || []);
        setFlaggedPagination({
          total: result.total || 0,
          page: result.page || 1,
          totalPages: result.totalPages || 0,
          limit: result.limit || 20,
        });
        return { success: true, data: result };
      } catch (err) {
        const errorMsg = err.message || "Failed to fetch flagged URLs";
        return { success: false, error: errorMsg, status: err.status };
      } finally {
        setFlaggedLoading(false);
      }
    },
    [isModerator]
  );

  /**
   * Get moderation logs for a URL
   */
  const fetchModerationLogs = useCallback(
    async (urlId, params = {}) => {
      if (!isModerator) {
        return { success: false, error: "Insufficient permissions" };
      }

      setLogsLoading(true);
      try {
        const result = await ModerationService.getModerationLogs(urlId, {
          page: params.page || 1,
          limit: params.limit || 20,
        });
        setModerationLogs(result.logs || []);
        setLogsPagination({
          total: result.total || 0,
          page: result.page || 1,
          totalPages: result.totalPages || 0,
          limit: result.limit || 20,
        });
        return { success: true, data: result };
      } catch (err) {
        const errorMsg = err.message || "Failed to fetch moderation logs";
        return { success: false, error: errorMsg, status: err.status };
      } finally {
        setLogsLoading(false);
      }
    },
    [isModerator]
  );

  // ============================================
  // Reports
  // ============================================

  /**
   * Create an abuse report
   */
  const createReport = useCallback(async (data) => {
    setReportCreating(true);
    setReportCreateError(null);
    try {
      const result = await ModerationService.createReport(data);
      return { success: true, data: result };
    } catch (err) {
      const errorMsg = err.message || "Failed to create report";
      setReportCreateError(errorMsg);
      return { success: false, error: errorMsg, status: err.status };
    } finally {
      setReportCreating(false);
    }
  }, []);

  /**
   * Get reports with filters
   */
  const fetchReports = useCallback(
    async (params = {}) => {
      if (!isModerator) {
        return { success: false, error: "Insufficient permissions" };
      }

      setReportsLoading(true);
      try {
        const result = await ModerationService.getReports({
          page: params.page || 1,
          limit: params.limit || 20,
          ...params,
        });
        setReports(result.reports || []);
        setReportsPagination({
          total: result.total || 0,
          page: result.page || 1,
          totalPages: result.totalPages || 0,
          limit: result.limit || 20,
        });
        return { success: true, data: result };
      } catch (err) {
        const errorMsg = err.message || "Failed to fetch reports";
        return { success: false, error: errorMsg, status: err.status };
      } finally {
        setReportsLoading(false);
      }
    },
    [isModerator]
  );

  /**
   * Get report details by ID
   */
  const fetchReportById = useCallback(
    async (id) => {
      if (!isModerator) {
        return { success: false, error: "Insufficient permissions" };
      }

      setReportDetailLoading(true);
      try {
        const result = await ModerationService.getReportById(id);
        setSelectedReport(result);
        return { success: true, data: result };
      } catch (err) {
        const errorMsg = err.message || "Failed to fetch report details";
        return { success: false, error: errorMsg, status: err.status };
      } finally {
        setReportDetailLoading(false);
      }
    },
    [isModerator]
  );

  /**
   * Update report status
   */
  const updateReport = useCallback(
    async (id, data) => {
      if (!isModerator) {
        setReportUpdateError("Insufficient permissions");
        return { success: false, error: "Insufficient permissions" };
      }

      setReportUpdating(true);
      setReportUpdateError(null);
      try {
        const result = await ModerationService.updateReport(id, data);
        // Update the selected report if it matches
        if (selectedReport?.id === id) {
          setSelectedReport(result);
        }
        // Update the reports list
        setReports((prev) =>
          prev.map((report) => (report.id === id ? result : report))
        );
        return { success: true, data: result };
      } catch (err) {
        const errorMsg = err.message || "Failed to update report";
        setReportUpdateError(errorMsg);
        return { success: false, error: errorMsg, status: err.status };
      } finally {
        setReportUpdating(false);
      }
    },
    [isModerator, selectedReport]
  );

  // ============================================
  // Blacklist
  // ============================================

  /**
   * Get domain blacklist
   */
  const fetchBlacklist = useCallback(
    async (params = {}) => {
      if (!isModerator) {
        return { success: false, error: "Insufficient permissions" };
      }

      setBlacklistLoading(true);
      try {
        const result = await ModerationService.getBlacklist({
          page: params.page || 1,
          limit: params.limit || 20,
          ...params,
        });
        setBlacklist(result.blacklist || []);
        setBlacklistPagination({
          total: result.total || 0,
          page: result.page || 1,
          totalPages: result.totalPages || 0,
          limit: result.limit || 20,
        });
        return { success: true, data: result };
      } catch (err) {
        const errorMsg = err.message || "Failed to fetch blacklist";
        return { success: false, error: errorMsg, status: err.status };
      } finally {
        setBlacklistLoading(false);
      }
    },
    [isModerator]
  );

  /**
   * Add domain to blacklist
   */
  const addToBlacklist = useCallback(
    async (data) => {
      if (!isModerator) {
        return { success: false, error: "Insufficient permissions" };
      }

      setBlacklistAdding(true);
      try {
        const result = await ModerationService.addToBlacklist(data);
        // Add to local state if needed
        setBlacklist((prev) => [result, ...prev]);
        return { success: true, data: result };
      } catch (err) {
        const errorMsg = err.message || "Failed to add domain to blacklist";
        return { success: false, error: errorMsg, status: err.status };
      } finally {
        setBlacklistAdding(false);
      }
    },
    [isModerator]
  );

  /**
   * Remove domain from blacklist
   */
  const removeFromBlacklist = useCallback(
    async (id) => {
      if (!isModerator) {
        return { success: false, error: "Insufficient permissions" };
      }

      setBlacklistRemoveLoading(true);
      try {
        const result = await ModerationService.removeFromBlacklist(id);
        // Remove from local state
        setBlacklist((prev) => prev.filter((entry) => entry.id !== id));
        return { success: true, data: result };
      } catch (err) {
        const errorMsg =
          err.message || "Failed to remove domain from blacklist";
        return { success: false, error: errorMsg, status: err.status };
      } finally {
        setBlacklistRemoveLoading(false);
      }
    },
    [isModerator]
  );

  // ============================================
  // Return
  // ============================================

  return {
    // Auth
    isModerator,

    // Moderation
    moderateUrl,
    moderating,
    moderationResult,
    moderationError,
    clearModerationResult: () => setModerationResult(null),
    clearModerationError: () => setModerationError(null),

    // Auto-moderation
    autoModerate,
    autoChecking,
    autoResult,

    // Flagged URLs
    flaggedUrls,
    flaggedLoading,
    flaggedPagination,
    fetchFlaggedUrls,

    // Moderation Logs
    moderationLogs,
    logsLoading,
    logsPagination,
    fetchModerationLogs,

    // Reports
    reports,
    reportsLoading,
    reportsPagination,
    selectedReport,
    reportDetailLoading,
    fetchReports,
    fetchReportById,
    createReport,
    reportCreating,
    reportCreateError,
    updateReport,
    reportUpdating,
    reportUpdateError,

    // Blacklist
    blacklist,
    blacklistLoading,
    blacklistPagination,
    blacklistAdding,
    blacklistRemoveLoading,
    fetchBlacklist,
    addToBlacklist,
    removeFromBlacklist,
  };
};
