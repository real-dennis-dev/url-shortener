import { api } from "./api";

const MODERATION_BASE = "/api/v1/moderation";

/**
 * Moderation Service - Handles all moderation API calls
 */
const ModerationService = {
  // ============================================
  // Moderation Actions
  // ============================================

  /**
   * Moderate a URL
   * @param {string} urlId - UUID of the URL to moderate
   * @param {Object} data - Moderation data
   * @param {string} data.action - 'block', 'flag', 'warn', 'delete', 'review'
   * @param {string} data.reason - Reason for moderation (max 500 chars)
   * @param {string} data.notes - Additional notes (max 1000 chars)
   * @returns {Promise<Object>} - { success, message, url, moderationLog }
   */
  moderateUrl(urlId, data) {
    return api.post(`${MODERATION_BASE}/urls/${urlId}`, data);
  },

  /**
   * Auto-moderate a URL
   * @param {Object} data - URL data to check
   * @param {string} data.url - URL to check
   * @param {string} data.title - URL title
   * @param {string} data.description - URL description
   * @returns {Promise<Object>} - { flagged, reason, action, confidence }
   */
  autoModerate(data) {
    return api.post(`${MODERATION_BASE}/auto`, data);
  },

  /**
   * Get flagged and blocked URLs
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20, max: 100)
   * @returns {Promise<Object>} - { urls, total, page, totalPages, limit }
   */
  getFlaggedUrls(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    const query = queryParams.toString();
    return api.get(`${MODERATION_BASE}/flagged${query ? `?${query}` : ""}`);
  },

  /**
   * Get moderation logs for a URL
   * @param {string} urlId - UUID of the URL
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20, max: 100)
   * @returns {Promise<Object>} - { logs, total, page, totalPages, limit }
   */
  getModerationLogs(urlId, params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    const query = queryParams.toString();
    return api.get(
      `${MODERATION_BASE}/logs/${urlId}${query ? `?${query}` : ""}`
    );
  },

  // ============================================
  // Reports
  // ============================================

  /**
   * Create an abuse report
   * @param {Object} data - Report data
   * @param {string} data.urlId - UUID of the URL to report
   * @param {string} data.reason - 'spam', 'malware', 'phishing', 'harassment', 'adult_content', 'illegal_activity', 'copyright', 'other'
   * @param {string} data.description - Additional description (max 1000 chars)
   * @param {string} data.reporterEmail - Reporter email (optional if authenticated)
   * @returns {Promise<Object>} - Report object
   */
  createReport(data) {
    return api.post(`${MODERATION_BASE}/reports`, data);
  },

  /**
   * Get reports with filters
   * @param {Object} params - Query parameters
   * @param {string} params.status - 'pending', 'investigating', 'resolved', 'dismissed'
   * @param {string} params.reason - 'spam', 'malware', 'phishing', 'harassment', 'adult_content', 'illegal_activity', 'copyright', 'other'
   * @param {string} params.urlId - Filter by URL ID
   * @param {number} params.reportedBy - Filter by reporter user ID
   * @param {string} params.dateFrom - Filter from date (YYYY-MM-DD)
   * @param {string} params.dateTo - Filter to date (YYYY-MM-DD)
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20, max: 100)
   * @returns {Promise<Object>} - { reports, total, page, totalPages, limit }
   */
  getReports(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append("status", params.status);
    if (params.reason) queryParams.append("reason", params.reason);
    if (params.urlId) queryParams.append("urlId", params.urlId);
    if (params.reportedBy) queryParams.append("reportedBy", params.reportedBy);
    if (params.dateFrom) queryParams.append("dateFrom", params.dateFrom);
    if (params.dateTo) queryParams.append("dateTo", params.dateTo);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    const query = queryParams.toString();
    return api.get(`${MODERATION_BASE}/reports${query ? `?${query}` : ""}`);
  },

  /**
   * Get report details by ID
   * @param {string} id - Report UUID
   * @returns {Promise<Object>} - ReportDetail object
   */
  getReportById(id) {
    return api.get(`${MODERATION_BASE}/reports/${id}`);
  },

  /**
   * Update report status
   * @param {string} id - Report UUID
   * @param {Object} data - Update data
   * @param {string} data.status - 'pending', 'investigating', 'resolved', 'dismissed'
   * @param {string} data.resolution - Resolution details (required if status is resolved)
   * @returns {Promise<Object>} - Updated Report object
   */
  updateReport(id, data) {
    return api.put(`${MODERATION_BASE}/reports/${id}`, data);
  },

  // ============================================
  // Blacklist
  // ============================================

  /**
   * Get domain blacklist
   * @param {Object} params - Query parameters
   * @param {string} params.domain - Filter by domain
   * @param {string} params.expiresAt - Filter by expiration (YYYY-MM-DD)
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20, max: 100)
   * @returns {Promise<Object>} - { blacklist, total, page, totalPages, limit }
   */
  getBlacklist(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.domain) queryParams.append("domain", params.domain);
    if (params.expiresAt) queryParams.append("expiresAt", params.expiresAt);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    const query = queryParams.toString();
    return api.get(`${MODERATION_BASE}/blacklist${query ? `?${query}` : ""}`);
  },

  /**
   * Add domain to blacklist
   * @param {Object} data - Blacklist data
   * @param {string} data.domain - Domain to blacklist
   * @param {string} data.reason - Reason for blacklisting (max 500 chars)
   * @param {string} data.expiresAt - Expiration date (ISO datetime, optional)
   * @returns {Promise<Object>} - BlacklistEntry object
   */
  addToBlacklist(data) {
    return api.post(`${MODERATION_BASE}/blacklist`, data);
  },

  /**
   * Remove domain from blacklist
   * @param {number} id - Blacklist entry ID
   * @returns {Promise<Object>} - { success, deleted }
   */
  removeFromBlacklist(id) {
    return api.delete(`${MODERATION_BASE}/blacklist/${id}`);
  },
};

export default ModerationService;
