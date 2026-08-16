// src/modules/moderation/middleware.js
const Joi = require("joi");
const { ValidationError } = require("../../utils/errors");

const moderationMiddleware = {
  /**
   * Check moderation permissions
   * Verifies user has moderator role or higher
   */
  checkModeratorPermissions: (req, res, next) => {
    const allowedRoles = ["moderator", "admin", "support"];

    if (!req.user || !req.user.role) {
      return next(new ValidationError("User not authenticated", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ValidationError(
          "Insufficient permissions. Moderator role required.",
          403
        )
      );
    }

    next();
  },

  /**
   * Validate report data
   * Validates report reason and description
   */
  validateReport: (req, res, next) => {
    const schema = Joi.object({
      urlId: Joi.string().uuid().required(),
      reason: Joi.string()
        .valid(
          "spam",
          "malware",
          "phishing",
          "harassment",
          "adult_content",
          "illegal_activity",
          "copyright",
          "other"
        )
        .required(),
      description: Joi.string().max(1000).allow(""),
      reporterEmail: Joi.string().email().optional(),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    req.validatedData = value;
    next();
  },

  /**
   * Validate moderation action
   * Validates moderation action type and reason
   */
  validateModerationAction: (req, res, next) => {
    const schema = Joi.object({
      action: Joi.string()
        .valid("block", "flag", "warn", "delete", "review")
        .required(),
      reason: Joi.string().max(500).required(),
      notes: Joi.string().max(1000).allow(""),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    req.validatedData = value;
    next();
  },

  /**
   * Check blacklist access
   * Verifies user can manage blacklist
   */
  checkBlacklistAccess: (req, res, next) => {
    const allowedRoles = ["moderator", "admin"];

    if (!req.user || !req.user.role) {
      return next(new ValidationError("User not authenticated", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ValidationError(
          "Insufficient permissions to manage blacklist.",
          403
        )
      );
    }

    next();
  },

  /**
   * Validate blacklist entry
   * Validates domain format
   */
  validateBlacklistEntry: (req, res, next) => {
    const schema = Joi.object({
      domain: Joi.string()
        .required()
        .pattern(
          /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})$/
        )
        .message("Invalid domain format"),
      reason: Joi.string().max(500).required(),
      expiresAt: Joi.date().iso().min("now").optional(),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    req.validatedData = value;
    next();
  },

  /**
   * Validate report status update
   */
  validateReportStatus: (req, res, next) => {
    const schema = Joi.object({
      status: Joi.string()
        .valid("pending", "investigating", "resolved", "dismissed")
        .required(),
      resolution: Joi.string().max(500).when("status", {
        is: "resolved",
        then: Joi.required(),
        otherwise: Joi.optional(),
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
   * Validate pagination parameters
   */
  validatePagination: (req, res, next) => {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sortBy: Joi.string()
        .valid("createdAt", "status", "reason")
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
};

module.exports = moderationMiddleware;
