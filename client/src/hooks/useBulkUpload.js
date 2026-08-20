import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import BulkUploadService from "../services/bulkUpload.service";

/**
 * Custom hook for managing bulk upload operations
 */
export function useBulkUpload() {
  const { isAuthenticated } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
  });

  // Polling interval reference
  const pollingIntervalRef = useRef(null);
  const [pollingId, setPollingId] = useState(null);

  /**
   * Upload a file
   */
  const uploadFile = useCallback(
    async (file) => {
      if (!isAuthenticated) {
        setError("Please log in to upload files");
        return null;
      }

      setLoading(true);
      setError(null);
      setUploadProgress(0);

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const response = await BulkUploadService.uploadFile(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Start polling for status if job is created
        if (response.data?.jobId) {
          startPolling(response.data.jobId);
        }

        // Refresh the list
        await fetchUploads();

        return response.data;
      } catch (err) {
        setError(err.message || "Failed to upload file");
        console.error("Upload error:", err);
        return null;
      } finally {
        setLoading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    },
    [isAuthenticated]
  );

  /**
   * Fetch all uploads with pagination and filters
   */
  const fetchUploads = useCallback(
    async (page = pagination.page, limit = pagination.limit) => {
      if (!isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const response = await BulkUploadService.getAllUploads({
          page,
          limit,
          status: filters.status || undefined,
        });

        if (response.data) {
          setUploads(response.data.uploads || []);
          if (response.data.pagination) {
            setPagination({
              page: response.data.pagination.page,
              limit: response.data.pagination.limit,
              total: response.data.pagination.total,
              totalPages: response.data.pagination.totalPages,
            });
          }
        }
      } catch (err) {
        setError(err.message || "Failed to fetch uploads");
        console.error("Fetch uploads error:", err);
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, filters, pagination.page, pagination.limit]
  );

  /**
   * Fetch a single upload by ID
   */
  const fetchUploadById = useCallback(
    async (id) => {
      if (!isAuthenticated || !id) return null;

      setLoading(true);
      setError(null);

      try {
        const response = await BulkUploadService.getUploadStatus(id);
        if (response.data) {
          setSelectedUpload(response.data);
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err.message || "Failed to fetch upload details");
        console.error("Fetch upload error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Cancel an upload
   */
  const cancelUpload = useCallback(
    async (id) => {
      if (!isAuthenticated || !id) return false;

      setLoading(true);
      setError(null);

      try {
        const response = await BulkUploadService.cancelUpload(id);

        // Stop polling if this is the one being polled
        if (pollingId === id) {
          stopPolling();
        }

        // Refresh the list
        await fetchUploads();

        // Update selected upload if it's the same
        if (selectedUpload?.id === id) {
          setSelectedUpload(response.data);
        }

        return true;
      } catch (err) {
        setError(err.message || "Failed to cancel upload");
        console.error("Cancel upload error:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, pollingId, fetchUploads, selectedUpload]
  );

  /**
   * Download template
   */
  const downloadTemplate = useCallback(
    async (format = "csv") => {
      if (!isAuthenticated) {
        setError("Please log in to download template");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const blob = await BulkUploadService.downloadTemplate(format);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `bulk_upload_template.${
          format === "excel" ? "xlsx" : "csv"
        }`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return true;
      } catch (err) {
        setError(err.message || "Failed to download template");
        console.error("Download template error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Fetch statistics
   */
  const fetchStatistics = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const response = await BulkUploadService.getStatistics();
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
   * Start polling for upload status
   */
  const startPolling = useCallback(
    (id, interval = 3000) => {
      // Clear any existing polling
      stopPolling();

      setPollingId(id);

      pollingIntervalRef.current = setInterval(async () => {
        try {
          const response = await BulkUploadService.getUploadStatus(id);
          if (response.data) {
            // Update selected upload if it matches
            if (selectedUpload?.id === id) {
              setSelectedUpload(response.data);
            }

            // Update in the list
            setUploads((prev) =>
              prev.map((upload) =>
                upload.id === id ? { ...upload, ...response.data } : upload
              )
            );

            // Stop polling if completed, failed, or cancelled
            const status = response.data.status;
            if (["completed", "failed", "cancelled"].includes(status)) {
              stopPolling();
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
          // Don't stop polling on temporary errors
        }
      }, interval);
    },
    [selectedUpload]
  );

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setPollingId(null);
  }, []);

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
   * Clear errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    stopPolling();
    setUploads([]);
    setSelectedUpload(null);
    setStatistics(null);
    setError(null);
    setUploadProgress(0);
    setPagination({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
    setFilters({ status: "" });
    setPollingId(null);
  }, [stopPolling]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Auto-fetch uploads when authenticated or filters change
  useEffect(() => {
    if (isAuthenticated) {
      fetchUploads(pagination.page, pagination.limit);
    }
  }, [isAuthenticated, pagination.page, filters.status]);

  return {
    // State
    uploads,
    selectedUpload,
    statistics,
    loading,
    error,
    uploadProgress,
    pagination,
    filters,
    pollingId,

    // Actions
    uploadFile,
    fetchUploads,
    fetchUploadById,
    cancelUpload,
    downloadTemplate,
    fetchStatistics,
    startPolling,
    stopPolling,
    updateFilters,
    changePage,
    clearError,
    reset,
  };
}

export default useBulkUpload;
