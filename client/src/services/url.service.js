// src/services/url.service.js
import { api } from "./api.js";

/**
 * URL Service - Handles all URL-related API calls
 */
const URLService = {
  /**
   * Get all URLs for the authenticated user
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.sort - Sort field (created_at, click_count, updated_at)
   * @param {string} params.order - Sort order (ASC, DESC)
   * @param {string} params.status - Filter by status (active, inactive, blocked, flagged, expired)
   * @param {string} params.search - Search in URL, title, description
   * @param {string} params.tags - Filter by tags
   * @param {string} params.date_from - Filter from date
   * @param {string} params.date_to - Filter to date
   */
  getUserUrls: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== ""
      ) {
        queryParams.append(key, params[key]);
      }
    });
    const queryString = queryParams.toString();
    return api.get(`/api/v1/urls${queryString ? `?${queryString}` : ""}`);
  },

  /**
   * Get URL details by ID
   * @param {string} id - URL ID (UUID)
   */
  getUrlDetails: (id) => {
    return api.get(`/api/v1/urls/${id}`);
  },

  /**
   * Create a new short URL
   * @param {Object} data - URL creation data
   * @param {string} data.original_url - Original URL to shorten
   * @param {string} data.custom_code - Custom short code (optional)
   * @param {string} data.title - URL title (optional)
   * @param {string} data.description - URL description (optional)
   * @param {string} data.tags - Comma-separated tags (optional)
   * @param {string} data.password - Password protection (optional)
   * @param {string} data.expires_at - Expiration date (optional)
   * @param {string} data.utm_source - UTM source (optional)
   * @param {string} data.utm_medium - UTM medium (optional)
   * @param {string} data.utm_campaign - UTM campaign (optional)
   * @param {string} data.utm_term - UTM term (optional)
   * @param {string} data.utm_content - UTM content (optional)
   * @param {string} data.domain_redirect - Domain redirect URL (optional)
   */
  createShortUrl: (data) => {
    return api.post("/api/v1/urls", data);
  },

  /**
   * Bulk create URLs
   * @param {Array} urls - Array of URL objects
   */
  bulkCreateUrls: (urls) => {
    return api.post("/api/v1/urls/bulk", { urls });
  },

  /**
   * Update an existing URL
   * @param {string} id - URL ID (UUID)
   * @param {Object} data - Update data
   * @param {string} data.title - URL title (optional)
   * @param {string} data.description - URL description (optional)
   * @param {string} data.tags - Comma-separated tags (optional)
   * @param {boolean} data.is_active - Active status (optional)
   * @param {string} data.status - Status (active, inactive) (optional)
   */
  updateUrl: (id, data) => {
    return api.put(`/api/v1/urls/${id}`, data);
  },

  /**
   * Delete a URL (soft delete)
   * @param {string} id - URL ID (UUID)
   */
  deleteUrl: (id) => {
    return api.delete(`/api/v1/urls/${id}`);
  },

  /**
   * Get URL analytics
   * @param {string} id - URL ID (UUID)
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date for analytics
   * @param {string} params.endDate - End date for analytics
   */
  getUrlAnalytics: (id, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    const queryString = queryParams.toString();
    return api.get(
      `/api/v1/urls/${id}/analytics${queryString ? `?${queryString}` : ""}`
    );
  },

  /**
   * Get URL statistics
   * @param {string} id - URL ID (UUID)
   */
  getUrlStats: (id) => {
    return api.get(`/api/v1/urls/${id}/stats`);
  },

  /**
   * Set password for a URL
   * @param {string} id - URL ID (UUID)
   * @param {string} password - Password
   */
  setUrlPassword: (id, password) => {
    return api.post(`/api/v1/urls/${id}/password`, { password });
  },

  /**
   * Remove password from a URL
   * @param {string} id - URL ID (UUID)
   */
  removeUrlPassword: (id) => {
    return api.delete(`/api/v1/urls/${id}/password`);
  },

  /**
   * Set URL expiration
   * @param {string} id - URL ID (UUID)
   * @param {string} expires_at - Expiration date (ISO string)
   */
  setUrlExpiration: (id, expires_at) => {
    return api.put(`/api/v1/urls/${id}/expire`, { expires_at });
  },

  /**
   * Get URLs by tag
   * @param {string} tag - Tag name
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   */
  getUrlsByTag: (tag, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    const queryString = queryParams.toString();
    return api.get(
      `/api/v1/urls/tags/${tag}${queryString ? `?${queryString}` : ""}`
    );
  },

  /**
   * Redirect to original URL using short code (public)
   * @param {string} shortCode - Short code
   * @param {string} password - Password for protected URLs (optional)
   */
  redirectToUrl: (shortCode, password = null) => {
    const headers = {};
    if (password) {
      headers["x-url-password"] = password;
    }
    return api.get(`/${shortCode}`, { headers });
  },
};

export default URLService;
