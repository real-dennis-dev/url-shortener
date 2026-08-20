import { api } from "./api";

const BASE_PATH = "/api/v1/system";

/**
 * System Service - Handles all system management API operations
 */
export const SystemService = {
  /**
   * Health check - Check the health status of the system
   * @returns {Promise} - Returns health status of all services
   */
  healthCheck: async () => {
    return api.get(`${BASE_PATH}/health`);
  },

  /**
   * Get system status - Retrieve system uptime, memory, CPU, and active users
   * @returns {Promise} - Returns system status information
   */
  getSystemStatus: async () => {
    return api.get(`${BASE_PATH}/status`);
  },

  /**
   * Get system settings - Retrieve system configuration (Admin only)
   * @param {Array<string>} keys - Specific settings keys to retrieve
   * @returns {Promise} - Returns system settings
   */
  getSettings: async (keys = []) => {
    const queryParams = new URLSearchParams();
    if (keys && keys.length > 0) {
      keys.forEach((key) => queryParams.append("keys", key));
    }
    const endpoint = `${BASE_PATH}/settings${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },

  /**
   * Update system settings - Update system configuration (Admin only)
   * @param {Object} settings - Settings object to update
   * @returns {Promise} - Returns updated settings
   */
  updateSettings: async (settings) => {
    return api.put(`${BASE_PATH}/settings`, { settings });
  },

  /**
   * Toggle maintenance mode - Enable or disable system maintenance mode (Admin only)
   * @param {boolean} enable - Enable or disable maintenance mode
   * @param {string} message - Maintenance message (optional)
   * @returns {Promise} - Returns maintenance mode status
   */
  toggleMaintenance: async (enable, message = "") => {
    return api.post(`${BASE_PATH}/maintenance`, { enable, message });
  },

  /**
   * Get system metrics - Retrieve detailed system performance metrics (Admin only)
   * @returns {Promise} - Returns system metrics
   */
  getMetrics: async () => {
    return api.get(`${BASE_PATH}/metrics`);
  },

  /**
   * Clear system cache - Clear all system caches (Admin only)
   * @returns {Promise} - Returns success status
   */
  clearCache: async () => {
    return api.post(`${BASE_PATH}/cache/clear`);
  },

  /**
   * Get system logs - Retrieve system operation logs (Admin only)
   * @param {Object} params - Filter parameters
   * @param {string} params.operation - Filter by operation type
   * @param {number} params.userId - Filter by user ID
   * @param {string} params.dateFrom - Filter from date (YYYY-MM-DD)
   * @param {string} params.dateTo - Filter to date (YYYY-MM-DD)
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 50, max: 100)
   * @returns {Promise} - Returns paginated logs
   */
  getLogs: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.operation) queryParams.append("operation", params.operation);
    if (params.userId) queryParams.append("userId", params.userId);
    if (params.dateFrom) queryParams.append("dateFrom", params.dateFrom);
    if (params.dateTo) queryParams.append("dateTo", params.dateTo);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    const endpoint = `${BASE_PATH}/logs${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },
};

export default SystemService;
