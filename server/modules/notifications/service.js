// src/modules/notifications/service.js
const { v4: uuidv4 } = require("uuid");
const DatabaseService = require("../../services/database.service");
const CacheService = require("../../services/cache.service");
const QueueService = require("../../services/queue.service");
const EmailService = require("../../services/email.service");
const { ValidationError, NotFoundError } = require("../../utils/errors");
const notificationUtils = require("./utils");

class NotificationService {
  constructor() {
    this.db = new DatabaseService();
    this.cache = new CacheService();
    this.queue = new QueueService();
    this.email = new EmailService();
  }

  // ============================
  // USER NOTIFICATIONS
  // ============================

  /**
   * Get user notifications with filters and pagination
   */
  async getUserNotifications(userId, filters = {}, pagination = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "DESC",
      isRead,
      type,
      dateFrom,
      dateTo,
    } = pagination;

    const offset = (page - 1) * limit;

    // Build cache key
    const cacheKey = `notifications:${userId}:${JSON.stringify(
      filters
    )}:${JSON.stringify(pagination)}`;

    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Build WHERE clause
    let whereConditions = ["user_id = $1"];
    let params = [userId];
    let paramCounter = 2;

    if (isRead !== undefined) {
      whereConditions.push(`is_read = $${paramCounter}`);
      params.push(isRead);
      paramCounter++;
    }

    if (type) {
      whereConditions.push(`type = $${paramCounter}`);
      params.push(type);
      paramCounter++;
    }

    if (dateFrom) {
      whereConditions.push(`created_at >= $${paramCounter}`);
      params.push(dateFrom);
      paramCounter++;
    }

    if (dateTo) {
      whereConditions.push(`created_at <= $${paramCounter}`);
      params.push(dateTo);
      paramCounter++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM notifications 
      ${whereClause}
    `;
    const countResult = await this.db.executeQuery(countQuery, params);
    const total = parseInt(countResult[0].total);

    // Get paginated notifications
    const sortColumn = sortBy === "createdAt" ? "created_at" : sortBy;
    const query = `
      SELECT * FROM notifications
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    params.push(limit, offset);
    const notifications = await this.db.executeQuery(query, params);

    const result = {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
      unreadCount: await this.getUnreadCount(userId),
    };

    // Cache for 5 minutes
    await this.cache.set(cacheKey, result, 300);

    return result;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    // Check if notification exists and belongs to user
    const notification = await this.db.executeQuery(
      "SELECT id, is_read FROM notifications WHERE id = $1 AND user_id = $2",
      [notificationId, userId]
    );

    if (!notification || notification.length === 0) {
      throw new NotFoundError("Notification not found");
    }

    if (notification[0].is_read) {
      return { success: true, message: "Already marked as read" };
    }

    const result = await this.db.executeQuery(
      `UPDATE notifications 
       SET is_read = TRUE, 
           read_at = NOW(),
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [notificationId]
    );

    // Clear cache
    await this.clearNotificationCache(userId);

    return {
      success: true,
      notification: result[0],
    };
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    const result = await this.db.executeQuery(
      `UPDATE notifications 
       SET is_read = TRUE, 
           read_at = NOW(),
           updated_at = NOW()
       WHERE user_id = $1 AND is_read = FALSE
       RETURNING id`,
      [userId]
    );

    const count = result.length;

    // Clear cache
    await this.clearNotificationCache(userId);

    return {
      success: true,
      count,
    };
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    // Try cache first
    const cacheKey = `notifications:unread:${userId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const result = await this.db.executeQuery(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE",
      [userId]
    );

    const count = parseInt(result[0].count);

    // Cache for 1 minute (real-time enough)
    await this.cache.set(cacheKey, count, 60);

    return count;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    const result = await this.db.executeQuery(
      "DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id",
      [notificationId, userId]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError("Notification not found");
    }

    // Clear cache
    await this.clearNotificationCache(userId);

    return { success: true };
  }

  /**
   * Create notification
   */
  async createNotification(
    userId,
    title,
    message,
    type = "info",
    metadata = null,
    channel = "push"
  ) {
    // Validate user exists
    const user = await this.db.executeQuery(
      "SELECT id, email, preferences FROM users WHERE id = $1",
      [userId]
    );

    if (!user || user.length === 0) {
      throw new ValidationError("User not found", 404);
    }

    // Check if template exists for this type
    let finalTitle = title;
    let finalMessage = message;

    // Check if we should use a template
    if (metadata && metadata.templateName) {
      const template = await this.getNotificationTemplate(
        metadata.templateName
      );
      if (template) {
        const variables = metadata.variables || {};
        finalTitle = notificationUtils.formatNotificationTemplate(
          template.title,
          variables
        );
        finalMessage = notificationUtils.formatNotificationTemplate(
          template.message_template,
          variables
        );
      }
    }

    // Create notification
    const result = await this.db.executeQuery(
      `INSERT INTO notifications (id, user_id, title, message, type, channel, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        uuidv4(),
        userId,
        finalTitle,
        finalMessage,
        type,
        channel,
        JSON.stringify(metadata || {}),
      ]
    );

    const notification = result[0];

    // Clear cache
    await this.clearNotificationCache(userId);

    // Send via email if channel includes email
    if (channel === "email" || channel === "all") {
      await this.sendEmailNotification(userId, finalTitle, finalMessage);
    }

    // Send via webhook if channel includes webhook
    if (channel === "webhook" || channel === "all") {
      await this.queue.addJob("send-webhook-notification", {
        userId,
        notificationId: notification.id,
        title: finalTitle,
        message: finalMessage,
        metadata,
      });
    }

    return notification;
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    userIds,
    title,
    message,
    type = "info",
    metadata = null
  ) {
    const results = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        const notification = await this.createNotification(
          userId,
          title,
          message,
          type,
          metadata
        );
        results.push(notification);
      } catch (error) {
        errors.push({ userId, error: error.message });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  // ============================
  // PREFERENCES
  // ============================

  /**
   * Get user notification preferences
   */
  async getPreferences(userId) {
    const cacheKey = `notifications:preferences:${userId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.db.executeQuery(
      "SELECT preferences FROM users WHERE id = $1",
      [userId]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError("User not found");
    }

    const preferences = result[0].preferences || {};

    // Set default preferences if not set
    const defaultPreferences = {
      email: true,
      push: true,
      webhook: false,
      categories: {
        welcome: true,
        verification: true,
        security: true,
        moderation: true,
        analytics: true,
        url_management: true,
        system: true,
      },
      digest: {
        enabled: false,
        frequency: "weekly",
        time: "09:00",
      },
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "07:00",
      },
    };

    // Merge with defaults
    const mergedPreferences = {
      ...defaultPreferences,
      ...preferences,
      categories: {
        ...defaultPreferences.categories,
        ...(preferences.categories || {}),
      },
      digest: {
        ...defaultPreferences.digest,
        ...(preferences.digest || {}),
      },
      quietHours: {
        ...defaultPreferences.quietHours,
        ...(preferences.quietHours || {}),
      },
    };

    // Cache for 1 hour
    await this.cache.set(cacheKey, mergedPreferences, 3600);

    return mergedPreferences;
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(userId, preferences) {
    // Get current preferences
    const currentPrefs = await this.getPreferences(userId);

    // Merge with updates
    const updatedPrefs = {
      ...currentPrefs,
      ...preferences,
      categories: {
        ...currentPrefs.categories,
        ...(preferences.categories || {}),
      },
      digest: {
        ...currentPrefs.digest,
        ...(preferences.digest || {}),
      },
      quietHours: {
        ...currentPrefs.quietHours,
        ...(preferences.quietHours || {}),
      },
    };

    const result = await this.db.executeQuery(
      `UPDATE users 
       SET preferences = $1, updated_at = NOW()
       WHERE id = $2 
       RETURNING preferences`,
      [JSON.stringify(updatedPrefs), userId]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError("User not found");
    }

    // Clear cache
    await this.cache.delete(`notifications:preferences:${userId}`);
    await this.clearNotificationCache(userId);

    return result[0].preferences;
  }

  // ============================
  // EMAIL NOTIFICATIONS
  // ============================

  /**
   * Send email notification with database template
   */
  async sendEmailNotification(
    userId,
    subject,
    body,
    templateName = null,
    variables = {}
  ) {
    // Get user email
    const user = await this.db.executeQuery(
      "SELECT email, full_name FROM users WHERE id = $1",
      [userId]
    );

    if (!user || user.length === 0) {
      throw new NotFoundError("User not found");
    }

    const userEmail = user[0].email;
    const userName = user[0].full_name || "User";

    let html = body;
    let text = body;
    let finalSubject = subject;

    // If template is specified, use it
    if (templateName) {
      const template = await this.getEmailTemplate(templateName);
      if (template) {
        // Prepare variables
        const templateVars = {
          ...variables,
          user_name: userName,
          user_email: userEmail,
          app_name: process.env.APP_NAME || "URL Shortener",
          app_url: process.env.APP_URL || "https://yourdomain.com",
        };

        finalSubject = notificationUtils.formatNotificationTemplate(
          template.subject,
          templateVars
        );
        html = notificationUtils.formatNotificationTemplate(
          template.html_content,
          templateVars
        );
        text = template.text_content
          ? notificationUtils.formatNotificationTemplate(
              template.text_content,
              templateVars
            )
          : html.replace(/<[^>]*>/g, "");
      }
    }

    // Send email
    try {
      const emailResult = await this.email.sendEmail(
        userEmail,
        finalSubject,
        html,
        { text, userId }
      );

      // Log email sent
      await this.db.executeQuery(
        `INSERT INTO audit_logs (user_id, action, details, created_at)
         VALUES ($1, 'email_sent', $2, NOW())`,
        [
          userId,
          JSON.stringify({ subject: finalSubject, template: templateName }),
        ]
      );

      return { success: true, messageId: emailResult.messageId };
    } catch (error) {
      console.error("Error sending email:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email using template with variables
   */
  async sendEmailWithTemplate(to, templateName, variables = {}) {
    const template = await this.getEmailTemplate(templateName);
    if (!template) {
      throw new NotFoundError(`Email template '${templateName}' not found`);
    }

    // Prepare variables with defaults
    const templateVars = {
      ...variables,
      app_name: process.env.APP_NAME || "URL Shortener",
      app_url: process.env.APP_URL || "https://yourdomain.com",
      current_year: new Date().getFullYear(),
    };

    const subject = notificationUtils.formatNotificationTemplate(
      template.subject,
      templateVars
    );
    const html = notificationUtils.formatNotificationTemplate(
      template.html_content,
      templateVars
    );
    const text = template.text_content
      ? notificationUtils.formatNotificationTemplate(
          template.text_content,
          templateVars
        )
      : html.replace(/<[^>]*>/g, "");

    try {
      const emailResult = await this.email.sendEmail(to, subject, html, {
        text,
      });
      return { success: true, messageId: emailResult.messageId };
    } catch (error) {
      console.error("Error sending email with template:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email to multiple recipients
   */
  async sendBulkEmailWithTemplate(recipients, templateName, variables = {}) {
    const results = [];
    const errors = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendEmailWithTemplate(
          recipient,
          templateName,
          variables
        );
        results.push({ email: recipient, ...result });
      } catch (error) {
        errors.push({ email: recipient, error: error.message });
      }
    }

    return {
      success: results.filter((r) => r.success).length,
      failed: errors.length,
      results,
      errors,
    };
  }

  // ============================
  // TEMPLATE MANAGEMENT
  // ============================

  /**
   * Get email template by name
   */
  async getEmailTemplate(name) {
    const cacheKey = `email-template:${name}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.db.executeQuery(
      "SELECT * FROM email_templates WHERE name = $1 AND is_active = TRUE",
      [name]
    );

    const template = result && result.length > 0 ? result[0] : null;

    if (template) {
      // Cache for 1 hour
      await this.cache.set(cacheKey, template, 3600);
    }

    return template;
  }

  /**
   * Get notification template by name
   */
  async getNotificationTemplate(name) {
    const cacheKey = `notification-template:${name}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.db.executeQuery(
      "SELECT * FROM notification_templates WHERE name = $1 AND is_active = TRUE",
      [name]
    );

    const template = result && result.length > 0 ? result[0] : null;

    if (template) {
      // Cache for 1 hour
      await this.cache.set(cacheKey, template, 3600);
    }

    return template;
  }

  /**
   * Get all email templates
   */
  async getEmailTemplates(filters = {}, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramCounter = 1;

    if (filters.name) {
      whereConditions.push(`name ILIKE $${paramCounter}`);
      params.push(`%${filters.name}%`);
      paramCounter++;
    }

    if (filters.category) {
      whereConditions.push(`category = $${paramCounter}`);
      params.push(filters.category);
      paramCounter++;
    }

    if (filters.isActive !== undefined) {
      whereConditions.push(`is_active = $${paramCounter}`);
      params.push(filters.isActive);
      paramCounter++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM email_templates 
      ${whereClause}
    `;
    const countResult = await this.db.executeQuery(countQuery, params);
    const total = parseInt(countResult[0].total);

    const query = `
      SELECT * FROM email_templates
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    params.push(limit, offset);
    const templates = await this.db.executeQuery(query, params);

    return {
      templates,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }

  /**
   * Get all notification templates
   */
  async getNotificationTemplates(filters = {}, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramCounter = 1;

    if (filters.name) {
      whereConditions.push(`name ILIKE $${paramCounter}`);
      params.push(`%${filters.name}%`);
      paramCounter++;
    }

    if (filters.category) {
      whereConditions.push(`category = $${paramCounter}`);
      params.push(filters.category);
      paramCounter++;
    }

    if (filters.isActive !== undefined) {
      whereConditions.push(`is_active = $${paramCounter}`);
      params.push(filters.isActive);
      paramCounter++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM notification_templates 
      ${whereClause}
    `;
    const countResult = await this.db.executeQuery(countQuery, params);
    const total = parseInt(countResult[0].total);

    const query = `
      SELECT * FROM notification_templates
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    params.push(limit, offset);
    const templates = await this.db.executeQuery(query, params);

    return {
      templates,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }

  /**
   * Create email template
   */
  async createEmailTemplate(data, adminId) {
    const {
      name,
      subject,
      htmlContent,
      textContent,
      variables,
      description,
      category,
      isActive,
    } = data;

    // Check if template exists
    const existing = await this.db.executeQuery(
      "SELECT id FROM email_templates WHERE name = $1",
      [name]
    );

    if (existing && existing.length > 0) {
      throw new ValidationError(`Email template '${name}' already exists`);
    }

    const result = await this.db.executeQuery(
      `INSERT INTO email_templates 
       (name, subject, html_content, text_content, variables, description, category, is_active, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [
        name,
        subject,
        htmlContent,
        textContent,
        JSON.stringify(variables),
        description,
        category,
        isActive,
        adminId,
      ]
    );

    // Clear cache
    await this.cache.delete(`email-template:${name}`);

    return result[0];
  }

  /**
   * Update email template
   */
  async updateEmailTemplate(name, data, adminId) {
    const {
      subject,
      htmlContent,
      textContent,
      variables,
      description,
      category,
      isActive,
    } = data;

    const result = await this.db.executeQuery(
      `UPDATE email_templates 
       SET subject = COALESCE($1, subject),
           html_content = COALESCE($2, html_content),
           text_content = COALESCE($3, text_content),
           variables = COALESCE($4, variables),
           description = COALESCE($5, description),
           category = COALESCE($6, category),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE name = $8
       RETURNING *`,
      [
        subject,
        htmlContent,
        textContent,
        JSON.stringify(variables),
        description,
        category,
        isActive,
        name,
      ]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError(`Email template '${name}' not found`);
    }

    // Clear cache
    await this.cache.delete(`email-template:${name}`);

    return result[0];
  }

  /**
   * Delete email template
   */
  async deleteEmailTemplate(name, adminId) {
    const result = await this.db.executeQuery(
      "DELETE FROM email_templates WHERE name = $1 RETURNING *",
      [name]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError(`Email template '${name}' not found`);
    }

    // Clear cache
    await this.cache.delete(`email-template:${name}`);

    return { success: true, deleted: result[0] };
  }

  /**
   * Create notification template
   */
  async createNotificationTemplate(data, adminId) {
    const {
      name,
      title,
      messageTemplate,
      type,
      variables,
      description,
      category,
      isActive,
    } = data;

    // Check if template exists
    const existing = await this.db.executeQuery(
      "SELECT id FROM notification_templates WHERE name = $1",
      [name]
    );

    if (existing && existing.length > 0) {
      throw new ValidationError(
        `Notification template '${name}' already exists`
      );
    }

    const result = await this.db.executeQuery(
      `INSERT INTO notification_templates 
       (name, title, message_template, type, variables, description, category, is_active, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [
        name,
        title,
        messageTemplate,
        type,
        JSON.stringify(variables),
        description,
        category,
        isActive,
        adminId,
      ]
    );

    // Clear cache
    await this.cache.delete(`notification-template:${name}`);

    return result[0];
  }

  /**
   * Update notification template
   */
  async updateNotificationTemplate(name, data, adminId) {
    const {
      title,
      messageTemplate,
      type,
      variables,
      description,
      category,
      isActive,
    } = data;

    const result = await this.db.executeQuery(
      `UPDATE notification_templates 
       SET title = COALESCE($1, title),
           message_template = COALESCE($2, message_template),
           type = COALESCE($3, type),
           variables = COALESCE($4, variables),
           description = COALESCE($5, description),
           category = COALESCE($6, category),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE name = $8
       RETURNING *`,
      [
        title,
        messageTemplate,
        type,
        JSON.stringify(variables),
        description,
        category,
        isActive,
        name,
      ]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError(`Notification template '${name}' not found`);
    }

    // Clear cache
    await this.cache.delete(`notification-template:${name}`);

    return result[0];
  }

  /**
   * Delete notification template
   */
  async deleteNotificationTemplate(name, adminId) {
    const result = await this.db.executeQuery(
      "DELETE FROM notification_templates WHERE name = $1 RETURNING *",
      [name]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError(`Notification template '${name}' not found`);
    }

    // Clear cache
    await this.cache.delete(`notification-template:${name}`);

    return { success: true, deleted: result[0] };
  }

  // ============================
  // WEBHOOK NOTIFICATIONS
  // ============================

  /**
   * Send webhook notification
   */
  async sendWebhookNotification(urlId, event, data) {
    // Get webhook configurations for this URL/user
    const webhooks = await this.db.executeQuery(
      `SELECT w.*, u.webhook_url 
       FROM webhooks w
       JOIN users u ON w.user_id = u.id
       WHERE w.is_active = TRUE 
         AND w.events LIKE $1`,
      [`%${event}%`]
    );

    if (!webhooks || webhooks.length === 0) {
      return { success: true, message: "No webhooks configured" };
    }

    const results = [];
    for (const webhook of webhooks) {
      try {
        const payload = {
          event,
          urlId,
          data,
          timestamp: new Date().toISOString(),
        };

        // Send webhook
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Secret": webhook.secret || "",
            "X-Event": event,
          },
          body: JSON.stringify(payload),
        });

        results.push({
          webhookId: webhook.id,
          success: response.ok,
          statusCode: response.status,
        });

        // Update last triggered
        await this.db.executeQuery(
          "UPDATE webhooks SET last_triggered_at = NOW() WHERE id = $1",
          [webhook.id]
        );

        if (!response.ok) {
          // Increment failure count
          await this.db.executeQuery(
            "UPDATE webhooks SET failure_count = failure_count + 1 WHERE id = $1",
            [webhook.id]
          );
        }
      } catch (error) {
        results.push({
          webhookId: webhook.id,
          success: false,
          error: error.message,
        });
      }
    }

    return { success: true, results };
  }

  // ============================
  // UTILITY METHODS
  // ============================

  /**
   * Clear notification cache for user
   */
  async clearNotificationCache(userId) {
    const patterns = [
      `notifications:${userId}:*`,
      `notifications:unread:${userId}`,
      `notifications:preferences:${userId}`,
    ];

    for (const pattern of patterns) {
      await this.cache.clear(pattern);
    }
  }

  /**
   * Get template variables from a template
   */
  async getTemplateVariables(templateType, templateName) {
    let template;
    if (templateType === "email") {
      template = await this.getEmailTemplate(templateName);
    } else {
      template = await this.getNotificationTemplate(templateName);
    }

    if (!template) {
      return [];
    }

    return template.variables || [];
  }

  /**
   * Validate template variables
   */
  validateTemplateVariables(template, variables) {
    const requiredVars = template.variables || [];
    const missingVars = [];

    for (const varName of requiredVars) {
      if (!variables[varName] && variables[varName] !== "") {
        missingVars.push(varName);
      }
    }

    return {
      valid: missingVars.length === 0,
      missingVars,
    };
  }
}

module.exports = NotificationService;
