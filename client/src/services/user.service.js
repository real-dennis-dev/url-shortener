import { api } from "./api";

const BASE_PATH = "/api/v1/users";

/**
 * User Service - Handles all user-related API operations
 */
export const UserService = {
  /**
   * Get user profile
   * @returns {Promise} - Returns user profile data
   */
  getProfile: async () => {
    return api.get(`${BASE_PATH}/profile`);
  },

  /**
   * Update user profile
   * @param {Object} data - Profile update data
   * @param {string} data.fullName - Full name (min 2, max 100 chars)
   * @param {string} data.avatarUrl - Avatar image URL
   * @param {string} data.email - Email address
   * @param {Object} data.preferences - User preferences
   * @returns {Promise} - Returns updated profile
   */
  updateProfile: async (data) => {
    return api.put(`${BASE_PATH}/profile`, data);
  },

  /**
   * Regenerate API key
   * @returns {Promise} - Returns new API key
   */
  regenerateApiKey: async () => {
    return api.post(`${BASE_PATH}/api-key`);
  },

  /**
   * Change password
   * @param {Object} data - Password change data
   * @param {string} data.currentPassword - Current password
   * @param {string} data.newPassword - New password (min 8 chars, with special chars)
   * @param {string} data.confirmNewPassword - Confirm new password
   * @returns {Promise} - Returns success message
   */
  changePassword: async (data) => {
    return api.put(`${BASE_PATH}/password`, data);
  },

  /**
   * Get user preferences
   * @returns {Promise} - Returns user preferences
   */
  getPreferences: async () => {
    return api.get(`${BASE_PATH}/preferences`);
  },

  /**
   * Update user preferences
   * @param {Object} data - Preferences update data
   * @param {Object} data.preferences - Preferences object
   * @returns {Promise} - Returns updated preferences
   */
  updatePreferences: async (data) => {
    return api.put(`${BASE_PATH}/preferences`, data);
  },

  /**
   * Update user plan (Admin only)
   * @param {string} plan - Plan type (free, pro, business, enterprise)
   * @returns {Promise} - Returns updated plan info
   */
  updatePlan: async (plan) => {
    return api.put(`${BASE_PATH}/plan`, { plan });
  },

  /**
   * Get user statistics
   * @returns {Promise} - Returns user statistics
   */
  getStatistics: async () => {
    return api.get(`${BASE_PATH}/stats`);
  },

  /**
   * Delete user account
   * @param {Object} data - Account deletion data
   * @param {boolean} data.confirm - Confirmation flag
   * @param {string} data.password - Current password
   * @returns {Promise} - Returns success message
   */
  deleteAccount: async (data) => {
    return api.delete(`${BASE_PATH}/delete`, {
      body: JSON.stringify(data),
    });
  },

  /**
   * Get user activity
   * @param {Object} params - Query parameters
   * @param {string} params.activityType - Filter by activity type
   * @param {string} params.dateFrom - Filter from date (YYYY-MM-DD)
   * @param {string} params.dateTo - Filter to date (YYYY-MM-DD)
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20, max: 100)
   * @returns {Promise} - Returns paginated activity logs
   */
  getActivity: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.activityType)
      queryParams.append("activityType", params.activityType);
    if (params.dateFrom) queryParams.append("dateFrom", params.dateFrom);
    if (params.dateTo) queryParams.append("dateTo", params.dateTo);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    const endpoint = `${BASE_PATH}/activity${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },

  /**
   * Get all users (Admin only)
   * @param {Object} params - Query parameters
   * @param {string} params.role - Filter by role
   * @param {string} params.plan - Filter by plan
   * @param {string} params.status - Filter by status
   * @param {string} params.search - Search by email or full name
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20, max: 100)
   * @returns {Promise} - Returns paginated users list
   */
  getAllUsers: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.role) queryParams.append("role", params.role);
    if (params.plan) queryParams.append("plan", params.plan);
    if (params.status) queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    const endpoint = `${BASE_PATH}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },
};

export default UserService;
