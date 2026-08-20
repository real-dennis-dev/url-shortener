import { api } from "./api";

const BASE_PATH = "/api/v1/notifications";

/**
 * Notifications Service - Handles all notification API operations
 */
export const NotificationService = {
  // ============================
  // USER NOTIFICATIONS
  // ============================

  /**
   * Get user notifications with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20, max: 100)
   * @param {boolean} params.isRead - Filter by read status
   * @param {string} params.type - Filter by notification type
   * @param {string} params.dateFrom - Filter from date (YYYY-MM-DD)
   * @param {string} params.dateTo - Filter to date (YYYY-MM-DD)
   * @returns {Promise} - Returns notifications with pagination
   */
  getNotifications: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.isRead !== undefined)
      queryParams.append("isRead", params.isRead);
    if (params.type) queryParams.append("type", params.type);
    if (params.dateFrom) queryParams.append("dateFrom", params.dateFrom);
    if (params.dateTo) queryParams.append("dateTo", params.dateTo);

    const endpoint = `${BASE_PATH}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },

  /**
   * Create a notification (admin only)
   * @param {Object} data - Notification data
   * @param {number} data.userId - Target user ID (optional)
   * @param {string} data.title - Notification title
   * @param {string} data.message - Notification message
   * @param {string} data.type - Notification type (info, success, warning, error)
   * @param {string} data.channel - Notification channel (email, webhook, push)
   * @param {Object} data.metadata - Additional metadata
   * @returns {Promise} - Returns created notification
   */
  createNotification: async (data) => {
    return api.post(BASE_PATH, data);
  },

  /**
   * Mark a notification as read
   * @param {string} id - Notification ID (UUID)
   * @returns {Promise} - Returns updated notification
   */
  markAsRead: async (id) => {
    return api.put(`${BASE_PATH}/${id}`);
  },

  /**
   * Delete a notification
   * @param {string} id - Notification ID (UUID)
   * @returns {Promise} - Returns success status
   */
  deleteNotification: async (id) => {
    return api.delete(`${BASE_PATH}/${id}`);
  },

  /**
   * Mark all notifications as read
   * @returns {Promise} - Returns count of marked notifications
   */
  markAllAsRead: async () => {
    return api.post(`${BASE_PATH}/read-all`);
  },

  /**
   * Get unread notification count
   * @returns {Promise} - Returns unread count
   */
  getUnreadCount: async () => {
    return api.get(`${BASE_PATH}/unread`);
  },

  /**
   * Send bulk notifications (admin only)
   * @param {Object} data - Bulk notification data
   * @param {number[]} data.userIds - Array of user IDs
   * @param {string} data.title - Notification title
   * @param {string} data.message - Notification message
   * @param {string} data.type - Notification type
   * @param {Object} data.metadata - Additional metadata
   * @returns {Promise} - Returns results of bulk send
   */
  sendBulkNotifications: async (data) => {
    return api.post(`${BASE_PATH}/bulk`, data);
  },

  // ============================
  // PREFERENCES
  // ============================

  /**
   * Get user notification preferences
   * @returns {Promise} - Returns user preferences
   */
  getPreferences: async () => {
    return api.get(`${BASE_PATH}/preferences`);
  },

  /**
   * Update user notification preferences
   * @param {Object} preferences - Updated preferences
   * @returns {Promise} - Returns updated preferences
   */
  updatePreferences: async (preferences) => {
    return api.put(`${BASE_PATH}/preferences`, preferences);
  },

  // ============================
  // EMAIL NOTIFICATIONS
  // ============================

  /**
   * Send email notification (admin only)
   * @param {Object} data - Email data
   * @param {string} data.to - Recipient email
   * @param {string} data.subject - Email subject
   * @param {string} data.html - HTML content
   * @param {string} data.text - Plain text content
   * @param {string} data.templateName - Template name to use
   * @param {Object} data.variables - Variables for template
   * @param {Array} data.attachments - Email attachments
   * @returns {Promise} - Returns send status
   */
  sendEmail: async (data) => {
    return api.post(`${BASE_PATH}/email`, data);
  },

  /**
   * Send email with template (admin only)
   * @param {Object} data - Template email data
   * @param {number} data.userId - User ID
   * @param {string} data.templateName - Template name
   * @param {Object} data.variables - Variables for template
   * @returns {Promise} - Returns send status
   */
  sendTemplateEmail: async (data) => {
    return api.post(`${BASE_PATH}/email/template`, data);
  },

  /**
   * Send bulk emails with template (admin only)
   * @param {Object} data - Bulk email data
   * @param {string[]} data.recipients - List of recipient emails
   * @param {string} data.templateName - Template name
   * @param {Object} data.variables - Variables for template
   * @returns {Promise} - Returns bulk send status
   */
  sendBulkEmails: async (data) => {
    return api.post(`${BASE_PATH}/email/bulk`, data);
  },

  // ============================
  // EMAIL TEMPLATE MANAGEMENT
  // ============================

  /**
   * Get email templates (admin only)
   * @param {Object} params - Query parameters
   * @param {string} params.name - Filter by template name
   * @param {string} params.category - Filter by category
   * @param {boolean} params.isActive - Filter by active status
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise} - Returns list of email templates
   */
  getEmailTemplates: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.name) queryParams.append("name", params.name);
    if (params.category) queryParams.append("category", params.category);
    if (params.isActive !== undefined)
      queryParams.append("isActive", params.isActive);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    const endpoint = `${BASE_PATH}/email-templates${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },

  /**
   * Create email template (admin only)
   * @param {Object} data - Template data
   * @param {string} data.name - Template name
   * @param {string} data.subject - Email subject
   * @param {string} data.htmlContent - HTML content
   * @param {string} data.textContent - Plain text content
   * @param {string[]} data.variables - Template variables
   * @param {string} data.description - Template description
   * @param {string} data.category - Template category
   * @param {boolean} data.isActive - Active status
   * @returns {Promise} - Returns created template
   */
  createEmailTemplate: async (data) => {
    return api.post(`${BASE_PATH}/email-templates`, data);
  },

  /**
   * Update email template (admin only)
   * @param {string} name - Template name
   * @param {Object} data - Updated template data
   * @returns {Promise} - Returns updated template
   */
  updateEmailTemplate: async (name, data) => {
    return api.put(`${BASE_PATH}/email-templates/${name}`, data);
  },

  /**
   * Delete email template (admin only)
   * @param {string} name - Template name
   * @returns {Promise} - Returns deletion status
   */
  deleteEmailTemplate: async (name) => {
    return api.delete(`${BASE_PATH}/email-templates/${name}`);
  },

  // ============================
  // NOTIFICATION TEMPLATE MANAGEMENT
  // ============================

  /**
   * Get notification templates (admin only)
   * @param {Object} params - Query parameters
   * @param {string} params.name - Filter by template name
   * @param {string} params.category - Filter by category
   * @param {boolean} params.isActive - Filter by active status
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise} - Returns list of notification templates
   */
  getNotificationTemplates: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.name) queryParams.append("name", params.name);
    if (params.category) queryParams.append("category", params.category);
    if (params.isActive !== undefined)
      queryParams.append("isActive", params.isActive);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    const endpoint = `${BASE_PATH}/notification-templates${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return api.get(endpoint);
  },

  /**
   * Create notification template (admin only)
   * @param {Object} data - Template data
   * @param {string} data.name - Template name
   * @param {string} data.title - Notification title
   * @param {string} data.messageTemplate - Message template
   * @param {string} data.type - Notification type
   * @param {string[]} data.variables - Template variables
   * @param {string} data.description - Template description
   * @param {string} data.category - Template category
   * @param {boolean} data.isActive - Active status
   * @returns {Promise} - Returns created template
   */
  createNotificationTemplate: async (data) => {
    return api.post(`${BASE_PATH}/notification-templates`, data);
  },

  /**
   * Update notification template (admin only)
   * @param {string} name - Template name
   * @param {Object} data - Updated template data
   * @returns {Promise} - Returns updated template
   */
  updateNotificationTemplate: async (name, data) => {
    return api.put(`${BASE_PATH}/notification-templates/${name}`, data);
  },

  /**
   * Delete notification template (admin only)
   * @param {string} name - Template name
   * @returns {Promise} - Returns deletion status
   */
  deleteNotificationTemplate: async (name) => {
    return api.delete(`${BASE_PATH}/notification-templates/${name}`);
  },

  /**
   * Preview template (admin only)
   * @param {Object} data - Preview data
   * @param {Object} data.template - Template object with content
   * @param {string} data.type - Template type (email, notification)
   * @param {Object} data.sampleData - Sample data for preview
   * @returns {Promise} - Returns preview result
   */
  previewTemplate: async (data) => {
    return api.post(`${BASE_PATH}/templates/preview`, data);
  },
};

export default NotificationService;
