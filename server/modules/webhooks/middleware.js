// src/modules/webhooks/middleware.js
const Joi = require("joi");
const { ValidationError } = require("../../utils/errors");

const webhookMiddleware = {
  /**
   * Validate webhook data
   * Validates webhook URL and events
   */
  validateWebhook: (req, res, next) => {
    const schema = Joi.object({
      url: Joi.string()
        .uri({ scheme: ["http", "https"] })
        .required()
        .max(2048)
        .messages({
          "string.uri": "URL must be a valid HTTP or HTTPS URL",
          "string.empty": "URL is required",
          "string.max": "URL must not exceed 2048 characters",
        }),
      events: Joi.array()
        .items(
          Joi.string().valid(
            "url.created",
            "url.updated",
            "url.deleted",
            "url.clicked",
            "url.expired",
            "url.flagged",
            "url.blocked",
            "user.registered",
            "user.updated",
            "user.deleted",
            "report.created",
            "report.resolved",
            "report.dismissed"
          )
        )
        .min(1)
        .required()
        .messages({
          "array.min": "At least one event must be selected",
          "array.empty": "Events are required",
        }),
      secret: Joi.string()
        .min(16)
        .max(64)
        .pattern(/^[a-zA-Z0-9!@#$%^&*()_+\-={}[\]:;"'<>,.?/~`]{16,64}$/)
        .optional()
        .default(null)
        .messages({
          "string.min": "Secret must be at least 16 characters",
          "string.max": "Secret must not exceed 64 characters",
          "string.pattern.base": "Secret contains invalid characters",
        }),
      isActive: Joi.boolean().default(true),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    req.validatedData = value;
    next();
  },

  /**
   * Check webhook ownership
   * Verifies user owns the webhook
   */
  checkWebhookOwnership: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Import service dynamically to avoid circular dependency
      const WebhookService = require("./service");
      const service = new WebhookService();

      const webhook = await service.getWebhookById(id);

      if (!webhook) {
        return next(new ValidationError("Webhook not found", 404));
      }

      if (webhook.user_id !== userId) {
        return next(
          new ValidationError(
            "You do not have permission to access this webhook",
            403
          )
        );
      }

      req.webhook = webhook;
      next();
    } catch (error) {
      next(error);
    }
  },

  /**
   * Validate webhook test data
   */
  validateWebhookTest: (req, res, next) => {
    const schema = Joi.object({
      event: Joi.string()
        .valid(
          "url.created",
          "url.updated",
          "url.deleted",
          "url.clicked",
          "url.expired",
          "url.flagged",
          "url.blocked"
        )
        .required()
        .messages({
          "string.empty": "Event is required",
          "any.only": "Invalid event type",
        }),
      customData: Joi.object().optional().default({}).messages({
        "object.base": "Custom data must be an object",
      }),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    req.validatedData = value;
    next();
  },

  /**
   * Validate webhook update data
   */
  validateWebhookUpdate: (req, res, next) => {
    const schema = Joi.object({
      url: Joi.string()
        .uri({ scheme: ["http", "https"] })
        .max(2048)
        .optional()
        .messages({
          "string.uri": "URL must be a valid HTTP or HTTPS URL",
          "string.max": "URL must not exceed 2048 characters",
        }),
      events: Joi.array()
        .items(
          Joi.string().valid(
            "url.created",
            "url.updated",
            "url.deleted",
            "url.clicked",
            "url.expired",
            "url.flagged",
            "url.blocked",
            "user.registered",
            "user.updated",
            "user.deleted",
            "report.created",
            "report.resolved",
            "report.dismissed"
          )
        )
        .min(1)
        .optional()
        .messages({
          "array.min": "At least one event must be selected",
        }),
      secret: Joi.string()
        .min(16)
        .max(64)
        .pattern(/^[a-zA-Z0-9!@#$%^&*()_+\-={}[\]:;"'<>,.?/~`]{16,64}$/)
        .optional()
        .allow(null)
        .messages({
          "string.min": "Secret must be at least 16 characters",
          "string.max": "Secret must not exceed 64 characters",
          "string.pattern.base": "Secret contains invalid characters",
        }),
      isActive: Joi.boolean().optional(),
    });

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
      limit: Joi.number().integer().min(1).max(50).default(10),
      sortBy: Joi.string()
        .valid("createdAt", "updatedAt", "name")
        .default("createdAt"),
      sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
    });

    const { error, value } = schema.validate(req.query);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    req.pagination = value;
    next();
  },

  /**
   * Rate limiter for webhook endpoints
   */
  webhookRateLimiter: (req, res, next) => {
    // This would be implemented using the rate limiter middleware
    // Limits: 10 webhook operations per minute per user
    next();
  },
};

module.exports = webhookMiddleware;
