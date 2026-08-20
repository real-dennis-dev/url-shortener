import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import NotificationService from "../services/notification.service";

/**
 * Custom hook for managing notifications
 */
export function useNotifications() {
  const { isAuthenticated } = useAuth();

  // State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    isRead: undefined,
    type: "",
    dateFrom: "",
    dateTo: "",
  });

  // Polling interval for unread count
  const pollingIntervalRef = useRef(null);

  /**
   * Fetch notifications with current filters
   */
  const fetchNotifications = useCallback(
    async (page = pagination.page, limit = pagination.limit) => {
      if (!isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const response = await NotificationService.getNotifications({
          page,
          limit,
          isRead: filters.isRead,
          type: filters.type || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        });

        setNotifications(response.notifications || []);
        setUnreadCount(response.unreadCount || 0);
        setPagination({
          page: response.page || page,
          limit: response.limit || limit,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        });
      } catch (err) {
        setError(err.message || "Failed to fetch notifications");
        console.error("Fetch notifications error:", err);
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, filters, pagination.page, pagination.limit]
  );

  /**
   * Fetch unread count
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await NotificationService.getUnreadCount();
      setUnreadCount(response.count || 0);
    } catch (err) {
      console.error("Fetch unread count error:", err);
    }
  }, [isAuthenticated]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(
    async (id) => {
      if (!isAuthenticated || !id) return false;

      setLoading(true);
      setError(null);

      try {
        await NotificationService.markAsRead(id);

        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id
              ? {
                  ...notification,
                  is_read: true,
                  read_at: new Date().toISOString(),
                }
              : notification
          )
        );

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));

        return true;
      } catch (err) {
        setError(err.message || "Failed to mark notification as read");
        console.error("Mark as read error:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await NotificationService.markAllAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );

      setUnreadCount(0);

      return response.count || 0;
    } catch (err) {
      setError(err.message || "Failed to mark all as read");
      console.error("Mark all as read error:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(
    async (id) => {
      if (!isAuthenticated || !id) return false;

      setLoading(true);
      setError(null);

      try {
        await NotificationService.deleteNotification(id);

        // Remove from local state
        const deleted = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));

        // Update unread count if it was unread
        if (deleted && !deleted.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        return true;
      } catch (err) {
        setError(err.message || "Failed to delete notification");
        console.error("Delete notification error:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, notifications]
  );

  /**
   * Fetch user preferences
   */
  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const response = await NotificationService.getPreferences();
      setPreferences(response.preferences);
      return response.preferences;
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
    async (updatedPreferences) => {
      if (!isAuthenticated) return false;

      setLoading(true);
      setError(null);

      try {
        const response = await NotificationService.updatePreferences(
          updatedPreferences
        );
        setPreferences(response.preferences);
        return true;
      } catch (err) {
        setError(err.message || "Failed to update preferences");
        console.error("Update preferences error:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Change page
   */
  const changePage = useCallback((page) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      isRead: undefined,
      type: "",
      dateFrom: "",
      dateTo: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Start polling for unread count
   */
  const startPolling = useCallback(
    (interval = 30000) => {
      stopPolling();
      pollingIntervalRef.current = setInterval(() => {
        fetchUnreadCount();
      }, interval);
    },
    [fetchUnreadCount]
  );

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    stopPolling();
    setNotifications([]);
    setUnreadCount(0);
    setPreferences(null);
    setError(null);
    setPagination({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
    setFilters({
      isRead: undefined,
      type: "",
      dateFrom: "",
      dateTo: "",
    });
  }, [stopPolling]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Auto-fetch notifications when authenticated or filters change
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(pagination.page, pagination.limit);
    }
  }, [
    isAuthenticated,
    pagination.page,
    filters.isRead,
    filters.type,
    filters.dateFrom,
    filters.dateTo,
  ]);

  // Auto-fetch preferences
  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated]);

  return {
    // State
    notifications,
    unreadCount,
    preferences,
    loading,
    error,
    pagination,
    filters,

    // Actions
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchPreferences,
    updatePreferences,
    updateFilters,
    changePage,
    clearFilters,
    clearError,
    startPolling,
    stopPolling,
    reset,
  };
}

export default useNotifications;
