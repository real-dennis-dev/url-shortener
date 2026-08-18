// src/hooks/useUrl.js
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import URLService from "../services/url.service";

/**
 * Hook for managing URL data and operations
 */
export const useUrl = () => {
  const { user, isAuthenticated } = useAuth();
  const [urls, setUrls] = useState([]);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState({
    sort: "created_at",
    order: "DESC",
    status: "",
    search: "",
    tags: "",
    date_from: "",
    date_to: "",
  });

  /**
   * Load user URLs with filters
   */
  const loadUrls = useCallback(
    async (page = 1, customFilters = {}) => {
      if (!isAuthenticated) {
        setError("Please log in to view your URLs");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const finalFilters = { ...filters, ...customFilters };
        const response = await URLService.getUserUrls({
          page,
          limit: pagination.limit,
          ...finalFilters,
        });

        if (response.success) {
          setUrls(response.data.urls || []);
          setPagination(response.data.pagination || pagination);
          setFilters(finalFilters);
        } else {
          throw new Error(response.message || "Failed to load URLs");
        }
      } catch (err) {
        setError(err.message || "An error occurred while loading URLs");
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, filters, pagination.limit]
  );

  /**
   * Get URL details by ID
   */
  const getUrlDetails = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await URLService.getUrlDetails(id);
      if (response.success) {
        setCurrentUrl(response.data);
        return response.data;
      } else {
        throw new Error(response.message || "Failed to load URL details");
      }
    } catch (err) {
      setError(err.message || "An error occurred while loading URL details");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new short URL
   */
  const createUrl = useCallback(
    async (data) => {
      if (!isAuthenticated) {
        setError("Please log in to create a URL");
        throw new Error("Unauthorized");
      }

      setLoading(true);
      setError(null);

      try {
        const response = await URLService.createShortUrl(data);
        if (response.success) {
          // Reload URLs to include the new one
          await loadUrls(pagination.page);
          return response.data;
        } else {
          throw new Error(response.message || "Failed to create URL");
        }
      } catch (err) {
        setError(err.message || "An error occurred while creating the URL");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, loadUrls, pagination.page]
  );

  /**
   * Update an existing URL
   */
  const updateUrl = useCallback(
    async (id, data) => {
      setLoading(true);
      setError(null);

      try {
        const response = await URLService.updateUrl(id, data);
        if (response.success) {
          // Update current URL if it's the same
          if (currentUrl && currentUrl.id === id) {
            setCurrentUrl(response.data);
          }
          // Reload URLs
          await loadUrls(pagination.page);
          return response.data;
        } else {
          throw new Error(response.message || "Failed to update URL");
        }
      } catch (err) {
        setError(err.message || "An error occurred while updating the URL");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentUrl, loadUrls, pagination.page]
  );

  /**
   * Delete a URL
   */
  const deleteUrl = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);

      try {
        const response = await URLService.deleteUrl(id);
        if (response.success) {
          // Remove from list
          setUrls((prev) => prev.filter((url) => url.id !== id));
          if (currentUrl && currentUrl.id === id) {
            setCurrentUrl(null);
          }
          return true;
        } else {
          throw new Error(response.message || "Failed to delete URL");
        }
      } catch (err) {
        setError(err.message || "An error occurred while deleting the URL");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentUrl]
  );

  /**
   * Bulk create URLs
   */
  const bulkCreateUrls = useCallback(
    async (urlsData) => {
      if (!isAuthenticated) {
        setError("Please log in to create URLs");
        throw new Error("Unauthorized");
      }

      setLoading(true);
      setError(null);

      try {
        const response = await URLService.bulkCreateUrls(urlsData);
        if (response.success) {
          // Reload URLs
          await loadUrls(pagination.page);
          return response.data;
        } else {
          throw new Error(response.message || "Failed to create URLs");
        }
      } catch (err) {
        setError(err.message || "An error occurred while creating URLs");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, loadUrls, pagination.page]
  );

  /**
   * Get URL analytics
   */
  const getUrlAnalytics = useCallback(
    async (id, startDate = null, endDate = null) => {
      setLoading(true);
      setError(null);

      try {
        const response = await URLService.getUrlAnalytics(id, {
          startDate,
          endDate,
        });
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || "Failed to load analytics");
        }
      } catch (err) {
        setError(err.message || "An error occurred while loading analytics");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get URL statistics
   */
  const getUrlStats = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await URLService.getUrlStats(id);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || "Failed to load statistics");
      }
    } catch (err) {
      setError(err.message || "An error occurred while loading statistics");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Set password for a URL
   */
  const setUrlPassword = useCallback(
    async (id, password) => {
      setLoading(true);
      setError(null);

      try {
        const response = await URLService.setUrlPassword(id, password);
        if (response.success) {
          // Reload URL details
          if (currentUrl && currentUrl.id === id) {
            await getUrlDetails(id);
          }
          return true;
        } else {
          throw new Error(response.message || "Failed to set password");
        }
      } catch (err) {
        setError(err.message || "An error occurred while setting password");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentUrl, getUrlDetails]
  );

  /**
   * Remove password from a URL
   */
  const removeUrlPassword = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);

      try {
        const response = await URLService.removeUrlPassword(id);
        if (response.success) {
          // Reload URL details
          if (currentUrl && currentUrl.id === id) {
            await getUrlDetails(id);
          }
          return true;
        } else {
          throw new Error(response.message || "Failed to remove password");
        }
      } catch (err) {
        setError(err.message || "An error occurred while removing password");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentUrl, getUrlDetails]
  );

  /**
   * Set URL expiration
   */
  const setUrlExpiration = useCallback(
    async (id, expires_at) => {
      setLoading(true);
      setError(null);

      try {
        const response = await URLService.setUrlExpiration(id, expires_at);
        if (response.success) {
          // Reload URL details
          if (currentUrl && currentUrl.id === id) {
            await getUrlDetails(id);
          }
          return response.data;
        } else {
          throw new Error(response.message || "Failed to set expiration");
        }
      } catch (err) {
        setError(err.message || "An error occurred while setting expiration");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentUrl, getUrlDetails]
  );

  /**
   * Get URLs by tag
   */
  const getUrlsByTag = useCallback(
    async (tag, page = 1) => {
      setLoading(true);
      setError(null);

      try {
        const response = await URLService.getUrlsByTag(tag, {
          page,
          limit: pagination.limit,
        });
        if (response.success) {
          setUrls(response.data.urls || []);
          setPagination(response.data.pagination || pagination);
          return response.data;
        } else {
          throw new Error(response.message || "Failed to load URLs by tag");
        }
      } catch (err) {
        setError(err.message || "An error occurred while loading URLs by tag");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, pagination]
  );

  /**
   * Redirect to original URL using short code
   */
  const redirectToOriginalUrl = useCallback(
    async (shortCode, password = null) => {
      try {
        const response = await URLService.redirectToUrl(shortCode, password);
        // The response will contain the redirect URL in the Location header
        // Since we're using fetch, we need to handle this differently
        // We'll return the response data for the caller to handle
        return response;
      } catch (err) {
        if (err.status === 401) {
          // Password required
          throw {
            requiresPassword: true,
            urlId: err.data?.url_id,
            message: err.message || "Password required",
          };
        }
        throw err;
      }
    },
    []
  );

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    setFilters({
      sort: "created_at",
      order: "DESC",
      status: "",
      search: "",
      tags: "",
      date_from: "",
      date_to: "",
    });
  }, []);

  /**
   * Change page
   */
  const changePage = useCallback(
    (page) => {
      loadUrls(page);
    },
    [loadUrls]
  );

  /**
   * Initial load when authenticated
   */
  useEffect(() => {
    if (isAuthenticated) {
      loadUrls(1);
    } else {
      setUrls([]);
      setCurrentUrl(null);
    }
  }, [isAuthenticated, loadUrls]);

  return {
    // State
    urls,
    currentUrl,
    loading,
    error,
    pagination,
    filters,

    // Actions
    loadUrls,
    getUrlDetails,
    createUrl,
    updateUrl,
    deleteUrl,
    bulkCreateUrls,
    getUrlAnalytics,
    getUrlStats,
    setUrlPassword,
    removeUrlPassword,
    setUrlExpiration,
    getUrlsByTag,
    redirectToOriginalUrl,
    resetFilters,
    changePage,
  };
};

export default useUrl;
