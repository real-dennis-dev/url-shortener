import { api } from "./api";

const BASE_PATH = "/api/v1/webhooks";

/**
 * Webhook Service - Handles all webhook API operations
 */
export const WebhookService = {
  /**
   * Get all webhooks for the authenticated user
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10, max: 50)
   * @param {string} params.sortBy - Sort field (createdAt, updatedAt, name)
   * @param {string} params.sortOrder - Sort order (ASC, DESC)
   * @returns {Promise} - Returns paginated list of webhooks
   */
  getAllWebhooks: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const endpoint = `${BASE_PATH}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },

  /**
   * Create a new webhook configuration
   * @param {Object} data - Webhook data
   * @param {string} data.url - Webhook endpoint URL
   * @param {string[]} data.events - Events to trigger this webhook
   * @param {string|null} data.secret - Webhook secret for signature validation
   * @param {boolean} data.isActive - Whether the webhook is active
   * @returns {Promise} - Returns created webhook
   */
  createWebhook: async (data) => {
    return api.post(BASE_PATH, data);
  },

  /**
   * Update an existing webhook configuration
   * @param {string} id - Webhook ID (UUID)
   * @param {Object} data - Webhook data to update
   * @param {string} data.url - Webhook endpoint URL
   * @param {string[]} data.events - Events to trigger this webhook
   * @param {string|null} data.secret - Webhook secret for signature validation
   * @param {boolean} data.isActive - Whether the webhook is active
   * @returns {Promise} - Returns updated webhook
   */
  updateWebhook: async (id, data) => {
    return api.put(`${BASE_PATH}/${id}`, data);
  },

  /**
   * Delete a webhook
   * @param {string} id - Webhook ID (UUID)
   * @returns {Promise} - Returns success status
   */
  deleteWebhook: async (id) => {
    return api.delete(`${BASE_PATH}/${id}`);
  },

  /**
   * Test a webhook by sending a test request
   * @param {string} id - Webhook ID (UUID)
   * @param {Object} data - Test data
   * @param {string} data.event - Event to test
   * @param {Object} data.customData - Custom test data
   * @returns {Promise} - Returns test results
   */
  testWebhook: async (id, data = {}) => {
    return api.post(`${BASE_PATH}/${id}/test`, data);
  },

  /**
   * Get event history for a webhook
   * @param {string} id - Webhook ID (UUID)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20, max: 50)
   * @param {string} params.sortBy - Sort field (createdAt, event)
   * @param {string} params.sortOrder - Sort order (ASC, DESC)
   * @returns {Promise} - Returns event history
   */
  getWebhookEvents: async (id, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const endpoint = `${BASE_PATH}/${id}/events${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },
};

export default WebhookService;
