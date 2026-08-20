import { api } from "./api";

const BASE_PATH = "/api/v1/logs";

/**
 * API Logs Service - Handles all API log operations
 */
export const LogsService = {
  /**
   * Get API logs with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Filter logs from this date (YYYY-MM-DD)
   * @param {string} params.endDate - Filter logs up to this date (YYYY-MM-DD)
   * @param {string} params.method - Filter by HTTP method (GET, POST, PUT, DELETE, PATCH)
   * @param {number} params.statusCode - Filter by status code
   * @param {string} params.endpoint - Filter by endpoint (partial match)
   * @param {number} params.minResponseTime - Minimum response time in ms
   * @param {number} params.maxResponseTime - Maximum response time in ms
   * @param {string} params.search - Search in request/response body and endpoint
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20, max: 100)
   * @param {string} params.sortBy - Sort field (createdAt, responseTime, statusCode)
   * @param {string} params.sortOrder - Sort order (ASC, DESC)
   * @returns {Promise} - Returns paginated logs
   */
  getLogs: async (params = {}) => {
    const queryParams = new URLSearchParams();

    const paramMap = {
      startDate: "startDate",
      endDate: "endDate",
      method: "method",
      statusCode: "statusCode",
      endpoint: "endpoint",
      minResponseTime: "minResponseTime",
      maxResponseTime: "maxResponseTime",
      search: "search",
      page: "page",
      limit: "limit",
      sortBy: "sortBy",
      sortOrder: "sortOrder",
    };

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        const paramKey = paramMap[key];
        if (paramKey) {
          queryParams.append(paramKey, value);
        }
      }
    });

    // Set defaults if not provided
    if (!params.page) queryParams.append("page", "1");
    if (!params.limit) queryParams.append("limit", "20");
    if (!params.sortBy) queryParams.append("sortBy", "createdAt");
    if (!params.sortOrder) queryParams.append("sortOrder", "DESC");

    const endpoint = `${BASE_PATH}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },

  /**
   * Get detailed information about a specific log entry
   * @param {string} id - Log ID (UUID)
   * @returns {Promise} - Returns detailed log entry
   */
  getLogDetails: async (id) => {
    return api.get(`${BASE_PATH}/${id}`);
  },

  /**
   * Get aggregated log statistics
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Statistics from this date (YYYY-MM-DD)
   * @param {string} params.endDate - Statistics up to this date (YYYY-MM-DD)
   * @returns {Promise} - Returns log statistics
   */
  getStatistics: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const endpoint = `${BASE_PATH}/stats${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },

  /**
   * Export logs in specified format
   * @param {Object} params - Query parameters
   * @param {string} params.format - Export format (csv, excel, json)
   * @param {string} params.startDate - Filter logs from this date
   * @param {string} params.endDate - Filter logs up to this date
   * @param {string} params.method - Filter by HTTP method
   * @param {number} params.statusCode - Filter by status code
   * @returns {Promise<Blob>} - Returns exported file as blob
   */
  exportLogs: async (params = {}) => {
    const queryParams = new URLSearchParams();
    const paramMap = {
      format: "format",
      startDate: "startDate",
      endDate: "endDate",
      method: "method",
      statusCode: "statusCode",
    };

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        const paramKey = paramMap[key];
        if (paramKey) {
          queryParams.append(paramKey, value);
        }
      }
    });

    if (!params.format) queryParams.append("format", "json");

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }${BASE_PATH}/export?${queryParams.toString()}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept:
            params.format === "csv"
              ? "text/csv"
              : params.format === "excel"
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : "application/json",
        },
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const error = new Error(data?.message || "Export failed");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return response.blob();
  },

  /**
   * Get quick summary of user's API usage
   * @returns {Promise} - Returns user log summary
   */
  getUserSummary: async () => {
    return api.get(`${BASE_PATH}/summary`);
  },

  /**
   * Delete logs older than specified days (admin only)
   * @param {number} days - Number of days to keep (default: 30)
   * @returns {Promise} - Returns deletion result
   */
  cleanOldLogs: async (days = 30) => {
    const queryParams = new URLSearchParams();
    queryParams.append("days", days);
    return api.delete(`${BASE_PATH}/clean?${queryParams.toString()}`);
  },
};

export default LogsService;
