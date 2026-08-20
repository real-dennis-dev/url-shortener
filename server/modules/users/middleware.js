// src/modules/users/middleware.js
const Joi = require("joi");
const { ValidationError } = require("../../utils/errors");

const userMiddleware = {
  /**
   * Validate profile update
   * Validates profile update data
   */
  validateProfileUpdate: (req, res, next) => {
    const schema = Joi.object({
      fullName: Joi.string().min(2).max(100).optional(),
      avatarUrl: Joi.string().uri().max(500).optional(),
      email: Joi.string().email().optional(),
      preferences: Joi.object({
        theme: Joi.string().valid("light", "dark", "system").optional(),
        notifications: Joi.boolean().optional(),
        language: Joi.string().length(2).optional(),
        timezone: Joi.string().optional(),
      }).optional(),
    }).min(1);

    const { error, value } = schema.validate(req.body);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    req.validatedData = value;
    next();
  },

  /**
   * Validate password change
   * Validates current and new passwords
   */
  validatePasswordChange: (req, res, next) => {
    const schema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string()
        .min(8)
        .max(100)
        .pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        )
        .message(
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        )
        .required(),
      confirmNewPassword: Joi.string()
        .valid(Joi.ref("newPassword"))
        .required()
        .messages({
          "any.only": "Passwords do not match",
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
   * Validate user ID
   * Validates user ID format
   */
  validateUserId: (req, res, next) => {
    const schema = Joi.object({
      id: Joi.number().integer().positive().required(),
    });

    const { error } = schema.validate(req.params);

    if (error) {
      return next(new ValidationError("Invalid user ID format", 400));
    }

    next();
  },

  /**
   * Check user access
   * Verifies user can access requested resource
   */
  checkUserAccess: (req, res, next) => {
    const userId = parseInt(req.params.id) || parseInt(req.body.userId);
    const requestingUserId = req.user.id;
    const userRole = req.user.role;

    // Admin can access any user
    if (userRole === "admin") {
      return next();
    }

    // Users can only access their own data
    if (userId && userId !== requestingUserId) {
      return next(
        new ValidationError("You can only access your own profile", 403)
      );
    }

    next();
  },

  /**
   * Validate plan update
   * Validates plan change request
   */
  validatePlanUpdate: (req, res, next) => {
    const schema = Joi.object({
      plan: Joi.string()
        .valid("free", "pro", "business", "enterprise")
        .required(),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    // Check if user can update their own plan (only admins or specific conditions)
    if (req.user.role !== "admin") {
      return next(
        new ValidationError("Only administrators can change user plans", 403)
      );
    }

    req.validatedData = value;
    next();
  },

  /**
   * Validate account deletion
   * Validates account deletion request
   */
  validateAccountDeletion: (req, res, next) => {
    const schema = Joi.object({
      confirm: Joi.boolean().valid(true).required().messages({
        "any.only": "You must confirm account deletion",
      }),
      password: Joi.string().required(),
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
        .valid("createdAt", "lastLogin", "totalClicks")
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
   * Validate preference update
   */
  validatePreferenceUpdate: (req, res, next) => {
    const schema = Joi.object({
      preferences: Joi.object({
        theme: Joi.string().valid("light", "dark", "system").optional(),
        notifications: Joi.boolean().optional(),
        language: Joi.string()
          .length(2)
          .valid("en", "es", "fr", "de", "ja", "zh")
          .optional(),
        timezone: Joi.string()
          .pattern(/^[A-Za-z_]+\/[A-Za-z_]+$/)
          .optional(),
        emailNotifications: Joi.boolean().optional(),
        pushNotifications: Joi.boolean().optional(),
        analyticsOptOut: Joi.boolean().optional(),
      })
        .required()
        .min(1),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    req.validatedData = value;
    next();
  },
};

module.exports = userMiddleware;
