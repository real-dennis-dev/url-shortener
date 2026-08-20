// src/modules/notifications/middleware.js
const Joi = require("joi");
const { ValidationError } = require("../../utils/errors");

const notificationMiddleware = {
  /**
   * Validate notification request
   */
  validateNotification: (req, res, next) => {
    const schema = Joi.object({
      title: Joi.string().min(1).max(255).required(),
      message: Joi.string().min(1).max(5000).required(),
      type: Joi.string()
        .valid("info", "success", "warning", "error")
        .default("info"),
      channel: Joi.string().valid("email", "webhook", "push").default("email"),
      metadata: Joi.object().optional(),
      userId: Joi.number().integer().optional(), // For admin sending to specific user
      templateName: Joi.string().optional(), // Use template instead of custom message
      variables: Joi.object().optional(), // Variables for template
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    req.validatedData = value;
    next();
  },

  /**
   * Check notification ownership
   */
  checkNotificationOwnership: async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    // Admins can access any notification
    if (role === "admin") {
      return next();
    }

    // Check if user owns the notification
    const db = new (require("../../services/database.service"))();
    const result = await db.executeQuery(
      "SELECT user_id FROM notifications WHERE id = $1",
      [id]
    );

    if (!result || result.length === 0) {
      return next(new ValidationError("Notification not found", 404));
    }

    if (result[0].user_id !== userId) {
      return next(
        new ValidationError(
          "You do not have permission to access this notification",
          403
        )
      );
    }

    next();
  },

  /**
   * Validate preferences update
   */
  validatePreferences: (req, res, next) => {
    const schema = Joi.object({
      email: Joi.boolean().default(true),
      push: Joi.boolean().default(true),
      webhook: Joi.boolean().default(false),
      categories: Joi.object({
        welcome: Joi.boolean().default(true),
        verification: Joi.boolean().default(true),
        security: Joi.boolean().default(true),
        moderation: Joi.boolean().default(true),
        analytics: Joi.boolean().default(true),
        url_management: Joi.boolean().default(true),
        system: Joi.boolean().default(true),
      }).default(),
      digest: Joi.object({
        enabled: Joi.boolean().default(false),
        frequency: Joi.string()
          .valid("daily", "weekly", "monthly")
          .default("weekly"),
        day: Joi.string()
          .valid(
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday"
          )
          .optional(),
        time: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .default("09:00"),
      }).default(),
      quietHours: Joi.object({
        enabled: Joi.boolean().default(false),
        start: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .default("22:00"),
        end: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .default("07:00"),
      }).default(),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    req.validatedData = value;
    next();
  },

  /**
   * Validate email notification
   */
  validateEmailNotification: (req, res, next) => {
    const schema = Joi.object({
      to: Joi.string().email().required(),
      subject: Joi.string().min(1).max(255).required(),
      html: Joi.string().min(1).optional(),
      text: Joi.string().optional(),
      templateName: Joi.string().optional(),
      variables: Joi.object().optional(),
      attachments: Joi.array()
        .items(
          Joi.object({
            filename: Joi.string().required(),
            content: Joi.alternatives().try(Joi.string(), Joi.binary()),
            path: Joi.string(),
            contentType: Joi.string(),
          })
        )
        .optional(),
    }).xor("html", "templateName");

    const { error, value } = schema.validate(req.body);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    req.validatedData = value;
    next();
  },

  /**
   * Validate pagination
   */
  validatePagination: (req, res, next) => {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sortBy: Joi.string()
        .valid("createdAt", "type", "isRead")
        .default("createdAt"),
      sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
      isRead: Joi.boolean().optional(),
      type: Joi.string()
        .valid("info", "success", "warning", "error")
        .optional(),
      dateFrom: Joi.date().iso().optional(),
      dateTo: Joi.date().iso().optional(),
    });

    const { error, value } = schema.validate(req.query);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    req.pagination = value;
    next();
  },

  /**
   * Validate template creation/update
   */
  validateTemplate: (req, res, next) => {
    const schema = Joi.object({
      name: Joi.string().min(1).max(100).required(),
      subject: Joi.string().min(1).max(255).when("$isEmailTemplate", {
        is: true,
        then: Joi.required(),
      }),
      htmlContent: Joi.string().min(1).when("$isEmailTemplate", {
        is: true,
        then: Joi.required(),
      }),
      messageTemplate: Joi.string().min(1).when("$isNotificationTemplate", {
        is: true,
        then: Joi.required(),
      }),
      title: Joi.string().min(1).max(255).when("$isNotificationTemplate", {
        is: true,
        then: Joi.required(),
      }),
      type: Joi.string()
        .valid("info", "success", "warning", "error")
        .default("info"),
      textContent: Joi.string().optional(),
      variables: Joi.array().items(Joi.string()).default([]),
      description: Joi.string().max(500).optional(),
      category: Joi.string().max(50).default("general"),
      isActive: Joi.boolean().default(true),
    });

    const isEmailTemplate = req.path.includes("/email-templates");
    const isNotificationTemplate = req.path.includes("/notification-templates");

    const context = {
      isEmailTemplate,
      isNotificationTemplate,
    };

    const { error, value } = schema.validate(req.body, { context });

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    req.validatedData = value;
    next();
  },

  /**
   * Check template management permissions
   */
  checkTemplateManagementPermissions: (req, res, next) => {
    const allowedRoles = ["admin", "moderator"];

    if (!req.user || !req.user.role) {
      return next(new ValidationError("User not authenticated", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ValidationError(
          "Insufficient permissions to manage templates.",
          403
        )
      );
    }

    next();
  },
};

module.exports = notificationMiddleware;
