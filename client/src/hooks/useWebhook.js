import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import WebhookService from "../services/webhook.service";

/**
 * Custom hook for managing webhook operations
 */
export function useWebhook() {
  const { isAuthenticated } = useAuth();
  const [webhooks, setWebhooks] = useState([]);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [events, setEvents] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [eventPagination, setEventPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    sortBy: "createdAt",
    sortOrder: "DESC",
  });

  const abortControllerRef = useRef(null);

  /**
   * Fetch all webhooks with pagination and sorting
   */
  const fetchWebhooks = useCallback(
    async (page = pagination.page, limit = pagination.limit) => {
      if (!isAuthenticated) return;

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const response = await WebhookService.getAllWebhooks({
          page,
          limit,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });

        if (response) {
          setWebhooks(response.webhooks || []);
          setPagination({
            page: response.page || 1,
            limit: response.limit || 10,
            total: response.total || 0,
            totalPages: response.totalPages || 0,
          });
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to fetch webhooks");
          console.error("Fetch webhooks error:", err);
        }
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isAuthenticated, filters, pagination.page, pagination.limit]
  );

  /**
   * Create a new webhook
   */
  const createWebhook = useCallback(
    async (data) => {
      if (!isAuthenticated) {
        setError("Please log in to create webhooks");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await WebhookService.createWebhook(data);

        // Refresh the list
        await fetchWebhooks();

        return response;
      } catch (err) {
        setError(err.message || "Failed to create webhook");
        console.error("Create webhook error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, fetchWebhooks]
  );

  /**
   * Update a webhook
   */
  const updateWebhook = useCallback(
    async (id, data) => {
      if (!isAuthenticated || !id) {
        setError("Invalid request");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await WebhookService.updateWebhook(id, data);

        // Update selected webhook if it matches
        if (selectedWebhook?.id === id) {
          setSelectedWebhook(response);
        }

        // Refresh the list
        await fetchWebhooks();

        return response;
      } catch (err) {
        setError(err.message || "Failed to update webhook");
        console.error("Update webhook error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, selectedWebhook, fetchWebhooks]
  );

  /**
   * Delete a webhook
   */
  const deleteWebhook = useCallback(
    async (id) => {
      if (!isAuthenticated || !id) {
        setError("Invalid request");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        await WebhookService.deleteWebhook(id);

        // Clear selected webhook if it matches
        if (selectedWebhook?.id === id) {
          setSelectedWebhook(null);
        }

        // Refresh the list
        await fetchWebhooks();

        return true;
      } catch (err) {
        setError(err.message || "Failed to delete webhook");
        console.error("Delete webhook error:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, selectedWebhook, fetchWebhooks]
  );

  /**
   * Test a webhook
   */
  const testWebhook = useCallback(
    async (id, data = {}) => {
      if (!isAuthenticated || !id) {
        setError("Invalid request");
        return null;
      }

      setLoading(true);
      setError(null);
      setTestResult(null);

      try {
        const response = await WebhookService.testWebhook(id, data);
        setTestResult(response);
        return response;
      } catch (err) {
        setError(err.message || "Webhook test failed");
        console.error("Test webhook error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Fetch webhook events
   */
  const fetchWebhookEvents = useCallback(
    async (id, page = eventPagination.page, limit = eventPagination.limit) => {
      if (!isAuthenticated || !id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await WebhookService.getWebhookEvents(id, {
          page,
          limit,
          sortBy: "createdAt",
          sortOrder: "DESC",
        });

        if (response) {
          setEvents(response.events || []);
          setEventPagination({
            page: response.page || 1,
            limit: response.limit || 20,
            total: response.total || 0,
            totalPages: response.totalPages || 0,
          });
        }
      } catch (err) {
        setError(err.message || "Failed to fetch webhook events");
        console.error("Fetch webhook events error:", err);
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, eventPagination.page, eventPagination.limit]
  );

  /**
   * Fetch a single webhook by ID
   */
  const fetchWebhookById = useCallback(
    async (id) => {
      if (!isAuthenticated || !id) return null;

      setLoading(true);
      setError(null);

      try {
        // Since there's no GET /webhooks/:id endpoint, we fetch all and find
        const response = await WebhookService.getAllWebhooks({
          limit: 100, // Get enough to find the one we need
        });

        const webhook = response.webhooks?.find((w) => w.id === id);
        if (webhook) {
          setSelectedWebhook(webhook);
          return webhook;
        }

        setError("Webhook not found");
        return null;
      } catch (err) {
        setError(err.message || "Failed to fetch webhook");
        console.error("Fetch webhook error:", err);
        return null;
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
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Change page
   */
  const changePage = useCallback((page) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  /**
   * Change events page
   */
  const changeEventsPage = useCallback((page) => {
    setEventPagination((prev) => ({ ...prev, page }));
  }, []);

  /**
   * Clear errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear test result
   */
  const clearTestResult = useCallback(() => {
    setTestResult(null);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setWebhooks([]);
    setSelectedWebhook(null);
    setEvents([]);
    setTestResult(null);
    setError(null);
    setPagination({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });
    setEventPagination({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
    setFilters({
      sortBy: "createdAt",
      sortOrder: "DESC",
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-fetch webhooks when authenticated or filters change
  useEffect(() => {
    if (isAuthenticated) {
      fetchWebhooks(pagination.page, pagination.limit);
    }
  }, [isAuthenticated, pagination.page, filters.sortBy, filters.sortOrder]);

  return {
    // State
    webhooks,
    selectedWebhook,
    events,
    testResult,
    loading,
    error,
    pagination,
    eventPagination,
    filters,

    // Actions
    fetchWebhooks,
    fetchWebhookById,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    fetchWebhookEvents,
    updateFilters,
    changePage,
    changeEventsPage,
    clearError,
    clearTestResult,
    reset,
  };
}

export default useWebhook;
