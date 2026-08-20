import { api } from "./api";

const BASE_PATH = "/api/v1/analytics";

/**
 * Analytics Service - Handles all analytics API operations
 */
export const AnalyticsService = {
  /**
   * Get analytics dashboard data
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @returns {Promise} - Returns dashboard analytics data
   */
  getDashboard: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const endpoint = `${BASE_PATH}/dashboard${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },

  /**
   * Get overview analytics
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @returns {Promise} - Returns overview analytics
   */
  getOverview: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const endpoint = `${BASE_PATH}/overview${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },

  /**
   * Get analytics for a specific URL
   * @param {string} urlId - URL ID (UUID)
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {string} params.deviceType - Filter by device type
   * @param {string} params.country - Filter by country
   * @param {string} params.browser - Filter by browser
   * @returns {Promise} - Returns URL analytics data
   */
  getUrlAnalytics: async (urlId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.deviceType) queryParams.append("deviceType", params.deviceType);
    if (params.country) queryParams.append("country", params.country);
    if (params.browser) queryParams.append("browser", params.browser);

    const endpoint = `${BASE_PATH}/urls/${urlId}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },

  /**
   * Get top referrers
   * @param {Object} params - Query parameters
   * @param {string} params.urlId - Filter by specific URL (UUID)
   * @param {number} params.limit - Number of referrers to return (default: 10)
   * @returns {Promise} - Returns top referrers
   */
  getReferrers: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.urlId) queryParams.append("urlId", params.urlId);
    if (params.limit) queryParams.append("limit", params.limit);

    const endpoint = `${BASE_PATH}/referrers${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },

  /**
   * Get device analytics
   * @param {Object} params - Query parameters
   * @param {string} params.urlId - Filter by specific URL (UUID)
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @returns {Promise} - Returns device analytics
   */
  getDeviceAnalytics: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.urlId) queryParams.append("urlId", params.urlId);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const endpoint = `${BASE_PATH}/devices${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },

  /**
   * Get location analytics
   * @param {Object} params - Query parameters
   * @param {string} params.urlId - Filter by specific URL (UUID)
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @returns {Promise} - Returns location analytics
   */
  getLocationAnalytics: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.urlId) queryParams.append("urlId", params.urlId);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const endpoint = `${BASE_PATH}/locations${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },

  /**
   * Get timeline data
   * @param {Object} params - Query parameters
   * @param {string} params.urlId - Filter by specific URL (UUID)
   * @param {string} params.interval - Time interval (hour, day, week, month)
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @returns {Promise} - Returns timeline data
   */
  getTimeline: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.urlId) queryParams.append("urlId", params.urlId);
    if (params.interval) queryParams.append("interval", params.interval);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const endpoint = `${BASE_PATH}/timeline${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },

  /**
   * Export analytics data
   * @param {string} urlId - URL ID (UUID)
   * @param {Object} params - Query parameters
   * @param {string} params.format - Export format (csv, json, excel)
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Blob>} - Returns exported file as blob
   */
  exportAnalytics: async (urlId, params = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append("urlId", urlId);
    if (params.format) queryParams.append("format", params.format);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

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
   * Get real-time analytics
   * @returns {Promise} - Returns real-time analytics data
   */
  getRealtime: async () => {
    return api.get(`${BASE_PATH}/realtime`);
  },
};

export default AnalyticsService;
