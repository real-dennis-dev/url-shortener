// src/modules/notifications/controller.js
const NotificationService = require("./service");
const { sendSuccess, sendError } = require("../../utils/response");

class NotificationController {
  constructor() {
    this.service = new NotificationService();
  }

  // ============================
  // USER NOTIFICATIONS
  // ============================

  /**
   * Get user notifications
   * GET /api/v1/notifications
   */
  getNotifications = async (req, res) => {
    try {
      const userId = req.user.id;
      const filters = {
        isRead:
          req.query.isRead !== undefined
            ? req.query.isRead === "true"
            : undefined,
        type: req.query.type,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      };

      // Remove undefined filters
      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) delete filters[key];
      });

      const result = await this.service.getUserNotifications(
        userId,
        filters,
        req.pagination
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Mark notification as read
   * PUT /api/v1/notifications/:id
   */
  markAsRead = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await this.service.markAsRead(id, userId);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Mark all as read
   * POST /api/v1/notifications/read-all
   */
  markAllAsRead = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await this.service.markAllAsRead(userId);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get unread count
   * GET /api/v1/notifications/unread
   */
  getUnreadCount = async (req, res) => {
    try {
      const userId = req.user.id;
      const count = await this.service.getUnreadCount(userId);
      sendSuccess(res, { count });
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Delete notification
   * DELETE /api/v1/notifications/:id
   */
  deleteNotification = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await this.service.deleteNotification(id, userId);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Create notification (admin)
   * POST /api/v1/notifications
   */
  createNotification = async (req, res) => {
    try {
      const {
        title,
        message,
        type,
        metadata,
        userId: targetUserId,
      } = req.validatedData;
      const userId = targetUserId || req.user.id;

      const result = await this.service.createNotification(
        userId,
        title,
        message,
        type,
        metadata
      );
      sendSuccess(res, result, 201);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Send bulk notifications (admin)
   * POST /api/v1/notifications/bulk
   */
  sendBulkNotifications = async (req, res) => {
    try {
      const { userIds, title, message, type, metadata } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return sendError(res, new Error("userIds array is required"), 400);
      }

      const result = await this.service.sendBulkNotifications(
        userIds,
        title,
        message,
        type,
        metadata
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  // ============================
  // PREFERENCES
  // ============================

  /**
   * Get notification preferences
   * GET /api/v1/notifications/preferences
   */
  getPreferences = async (req, res) => {
    try {
      const userId = req.user.id;
      const preferences = await this.service.getPreferences(userId);
      sendSuccess(res, { preferences });
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Update notification preferences
   * PUT /api/v1/notifications/preferences
   */
  updatePreferences = async (req, res) => {
    try {
      const userId = req.user.id;
      const preferences = req.validatedData;
      const updated = await this.service.updatePreferences(userId, preferences);
      sendSuccess(res, { preferences: updated });
    } catch (error) {
      sendError(res, error);
    }
  };

  // ============================
  // EMAIL NOTIFICATIONS
  // ============================

  /**
   * Send email notification
   * POST /api/v1/notifications/email
   */
  sendEmailNotification = async (req, res) => {
    try {
      const { to, subject, html, text, templateName, variables, attachments } =
        req.validatedData;

      let result;
      if (templateName) {
        // Use template
        result = await this.service.sendEmailWithTemplate(
          to,
          templateName,
          variables
        );
      } else {
        // Send custom email
        const emailResult = await this.service.email.sendEmail(
          to,
          subject,
          html,
          { text, attachments }
        );
        result = { success: true, messageId: emailResult.messageId };
      }

      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Send email with template to user
   * POST /api/v1/notifications/email/template
   */
  sendEmailWithTemplate = async (req, res) => {
    try {
      const { userId, templateName, variables } = req.body;

      if (!userId) {
        return sendError(res, new Error("userId is required"), 400);
      }

      const result = await this.service.sendEmailNotification(
        userId,
        null,
        null,
        templateName,
        variables
      );

      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Send bulk email with template
   * POST /api/v1/notifications/email/bulk
   */
  sendBulkEmailWithTemplate = async (req, res) => {
    try {
      const { recipients, templateName, variables } = req.body;

      if (
        !recipients ||
        !Array.isArray(recipients) ||
        recipients.length === 0
      ) {
        return sendError(res, new Error("recipients array is required"), 400);
      }

      const result = await this.service.sendBulkEmailWithTemplate(
        recipients,
        templateName,
        variables
      );

      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  // ============================
  // TEMPLATE MANAGEMENT
  // ============================

  /**
   * Get email templates
   * GET /api/v1/notifications/email-templates
   */
  getEmailTemplates = async (req, res) => {
    try {
      const { name, category, isActive } = req.query;
      const filters = { name, category, isActive };

      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) delete filters[key];
      });

      const result = await this.service.getEmailTemplates(
        filters,
        req.pagination
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get notification templates
   * GET /api/v1/notifications/notification-templates
   */
  getNotificationTemplates = async (req, res) => {
    try {
      const { name, category, isActive } = req.query;
      const filters = { name, category, isActive };

      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) delete filters[key];
      });

      const result = await this.service.getNotificationTemplates(
        filters,
        req.pagination
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Create email template
   * POST /api/v1/notifications/email-templates
   */
  createEmailTemplate = async (req, res) => {
    try {
      const adminId = req.user.id;
      const result = await this.service.createEmailTemplate(
        req.validatedData,
        adminId
      );
      sendSuccess(res, result, 201);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Update email template
   * PUT /api/v1/notifications/email-templates/:name
   */
  updateEmailTemplate = async (req, res) => {
    try {
      const { name } = req.params;
      const adminId = req.user.id;
      const result = await this.service.updateEmailTemplate(
        name,
        req.validatedData,
        adminId
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Delete email template
   * DELETE /api/v1/notifications/email-templates/:name
   */
  deleteEmailTemplate = async (req, res) => {
    try {
      const { name } = req.params;
      const adminId = req.user.id;
      const result = await this.service.deleteEmailTemplate(name, adminId);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Create notification template
   * POST /api/v1/notifications/notification-templates
   */
  createNotificationTemplate = async (req, res) => {
    try {
      const adminId = req.user.id;
      const result = await this.service.createNotificationTemplate(
        req.validatedData,
        adminId
      );
      sendSuccess(res, result, 201);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Update notification template
   * PUT /api/v1/notifications/notification-templates/:name
   */
  updateNotificationTemplate = async (req, res) => {
    try {
      const { name } = req.params;
      const adminId = req.user.id;
      const result = await this.service.updateNotificationTemplate(
        name,
        req.validatedData,
        adminId
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Delete notification template
   * DELETE /api/v1/notifications/notification-templates/:name
   */
  deleteNotificationTemplate = async (req, res) => {
    try {
      const { name } = req.params;
      const adminId = req.user.id;
      const result = await this.service.deleteNotificationTemplate(
        name,
        adminId
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Preview template
   * POST /api/v1/notifications/templates/preview
   */
  previewTemplate = async (req, res) => {
    try {
      const { template, type, sampleData } = req.body;
      const notificationUtils = require("./utils");
      const preview = notificationUtils.previewTemplate(
        template,
        type,
        sampleData
      );
      sendSuccess(res, { preview });
    } catch (error) {
      sendError(res, error);
    }
  };
}

module.exports = NotificationController;
