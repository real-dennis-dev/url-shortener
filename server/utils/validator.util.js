// src/utils/validator.util.js
const Joi = require("joi");
const validator = require("validator");
const { ApiError, ErrorCodes } = require("./error.util");

class ValidatorUtil {
  /**
   * Validate request against schema
   * @param {Object} data - Data to validate
   * @param {Joi.Schema} schema - Joi schema
   * @param {Object} options - Validation options
   * @returns {Object} - Validated data
   */
  static validate(data, schema, options = {}) {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
      ...options,
    };

    const { error, value } = schema.validate(data, validationOptions);

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      throw new ApiError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        "Validation failed",
        details
      );
    }

    return value;
  }

  /**
   * Common validation schemas
   */
  static schemas = {
    // User schemas
    email: Joi.string().email().required().max(255),
    password: Joi.string()
      .min(8)
      .max(100)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      )
      .messages({
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      }),
    name: Joi.string().min(2).max(100),
    phone: Joi.string().pattern(/^[0-9+\-() ]{10,15}$/),

    // URL schemas
    url: Joi.string().uri().required(),
    shortCode: Joi.string().pattern(/^[a-zA-Z0-9_-]{3,20}$/),
    tags: Joi.string().max(255),

    // Pagination schemas
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid("asc", "desc").default("desc"),

    // Date schemas
    dateRange: Joi.object({
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().min(Joi.ref("startDate")).required(),
    }),

    // Analytics schemas
    analyticsFilters: Joi.object({
      deviceType: Joi.string().valid("desktop", "mobile", "tablet"),
      browser: Joi.string(),
      country: Joi.string().length(2),
      referrer: Joi.string(),
    }),

    // Bulk upload schemas
    bulkUpload: Joi.object({
      urls: Joi.array()
        .items(
          Joi.object({
            url: Joi.string().uri().required(),
            title: Joi.string().max(500),
            tags: Joi.string().max(255),
          })
        )
        .min(1)
        .max(10000)
        .required(),
    }),

    // Notification schemas
    notification: Joi.object({
      title: Joi.string().max(255).required(),
      message: Joi.string().required(),
      type: Joi.string().valid("info", "success", "warning", "error"),
      channel: Joi.string().valid("email", "webhook", "push"),
    }),

    // Webhook schemas
    webhook: Joi.object({
      url: Joi.string().uri().required(),
      events: Joi.string().required(),
      secret: Joi.string().min(16).max(255),
    }),
  };

  /**
   * Helper validation functions
   */
  static helpers = {
    /**
     * Validate email
     */
    isEmail: (email) => {
      return validator.isEmail(email);
    },

    /**
     * Validate URL
     */
    isURL: (url, options = {}) => {
      return validator.isURL(url, {
        require_protocol: true,
        protocols: ["http", "https"],
        ...options,
      });
    },

    /**
     * Validate phone number
     */
    isPhone: (phone) => {
      return validator.isMobilePhone(phone);
    },

    /**
     * Validate UUID
     */
    isUUID: (uuid) => {
      return validator.isUUID(uuid);
    },

    /**
     * Validate short code
     */
    isShortCode: (code) => {
      return /^[a-zA-Z0-9_-]{3,20}$/.test(code);
    },

    /**
     * Validate password strength
     */
    isStrongPassword: (password) => {
      const strength = SecurityUtil.checkPasswordStrength(password);
      return strength.isStrong;
    },

    /**
     * Validate date
     */
    isDate: (date) => {
      return validator.isDate(date);
    },

    /**
     * Validate IP address
     */
    isIP: (ip) => {
      return validator.isIP(ip);
    },

    /**
     * Validate domain
     */
    isDomain: (domain) => {
      return validator.isFQDN(domain);
    },

    /**
     * Validate hex color
     */
    isHexColor: (color) => {
      return validator.isHexColor(color);
    },

    /**
     * Validate JSON
     */
    isJSON: (json) => {
      try {
        JSON.parse(json);
        return true;
      } catch {
        return false;
      }
    },
  };

  /**
   * Sanitize input
   */
  static sanitize = {
    /**
     * Sanitize email
     */
    email: (email) => {
      return validator.normalizeEmail(email);
    },

    /**
     * Sanitize URL
     */
    url: (url) => {
      return validator.trim(url);
    },

    /**
     * Sanitize HTML
     */
    html: (html) => {
      return validator.escape(html);
    },

    /**
     * Sanitize string
     */
    string: (str) => {
      return validator.trim(validator.escape(str));
    },

    /**
     * Sanitize phone
     */
    phone: (phone) => {
      return validator.trim(phone);
    },

    /**
     * Sanitize numeric
     */
    numeric: (num) => {
      return validator.toFloat(num);
    },

    /**
     * Sanitize boolean
     */
    boolean: (bool) => {
      return validator.toBoolean(bool);
    },
  };
}

module.exports = ValidatorUtil;
