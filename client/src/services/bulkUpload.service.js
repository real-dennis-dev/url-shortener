import { api } from "./api";

const BASE_PATH = "/api/v1/bulk-upload";

/**
 * Bulk Upload Service - Handles all bulk upload API operations
 */
export const BulkUploadService = {
  /**
   * Upload a CSV or Excel file containing URLs
   * @param {File} file - The file to upload
   * @returns {Promise} - Returns jobId and status
   */
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}${BASE_PATH}`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const error = new Error(data?.message || "File upload failed");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return response.json();
  },

  /**
   * Get all bulk uploads for the authenticated user
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20, max: 100)
   * @param {string} params.status - Filter by status
   * @returns {Promise} - Returns paginated list of uploads
   */
  getAllUploads: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.status) queryParams.append("status", params.status);

    const endpoint = `${BASE_PATH}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },

  /**
   * Get status and details of a specific bulk upload job
   * @param {string} id - Bulk upload ID (UUID)
   * @returns {Promise} - Returns upload details with status
   */
  getUploadStatus: async (id) => {
    return api.get(`${BASE_PATH}/${id}`);
  },

  /**
   * Cancel a pending or processing bulk upload job
   * @param {string} id - Bulk upload ID (UUID)
   * @returns {Promise} - Returns cancelled status
   */
  cancelUpload: async (id) => {
    return api.post(`${BASE_PATH}/${id}/cancel`);
  },

  /**
   * Download template for bulk upload
   * @param {string} format - File format ('csv' or 'excel')
   * @returns {Promise<Blob>} - Returns template file as blob
   */
  downloadTemplate: async (format = "csv") => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}${BASE_PATH}/template?format=${format}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept:
            format === "csv"
              ? "text/csv"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const error = new Error(data?.message || "Template download failed");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return response.blob();
  },

  /**
   * Get statistics for all bulk uploads by the user
   * @returns {Promise} - Returns summary statistics and recent uploads
   */
  getStatistics: async () => {
    return api.get(`${BASE_PATH}/stats/overview`);
  },
};

export default BulkUploadService;
