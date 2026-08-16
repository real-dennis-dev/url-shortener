// src/modules/urls/validations/url.validation.js
const Joi = require("joi");

const urlSchemas = {
  // Create URL validation
  createUrl: Joi.object({
    original_url: Joi.string().uri().required().max(2048).messages({
      "string.uri": "Invalid URL format",
      "string.max": "URL exceeds maximum length of 2048 characters",
      "any.required": "Original URL is required",
    }),
    custom_code: Joi.string()
      .min(3)
      .max(20)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .optional()
      .messages({
        "string.pattern.base":
          "Custom code can only contain letters, numbers, underscore and hyphen",
        "string.min": "Custom code must be at least 3 characters",
        "string.max": "Custom code must be at most 20 characters",
      }),
    title: Joi.string().max(500).optional(),
    description: Joi.string().max(2000).optional(),
    tags: Joi.string().max(500).optional(),
    password: Joi.string().min(4).max(100).optional(),
    expires_at: Joi.date().greater("now").optional().messages({
      "date.greater": "Expiration date must be in the future",
    }),
    utm_source: Joi.string().max(100).optional(),
    utm_medium: Joi.string().max(100).optional(),
    utm_campaign: Joi.string().max(100).optional(),
    utm_term: Joi.string().max(100).optional(),
    utm_content: Joi.string().max(100).optional(),
    domain_redirect: Joi.string().uri().optional(),
  }),

  // Update URL validation
  updateUrl: Joi.object({
    title: Joi.string().max(500).optional(),
    description: Joi.string().max(2000).optional(),
    tags: Joi.string().max(500).optional(),
    is_active: Joi.boolean().optional(),
    status: Joi.string().valid("active", "inactive").optional(),
  }).min(1),

  // Get URLs query validation
  getUrls: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string()
      .valid("created_at", "click_count", "updated_at")
      .default("created_at"),
    order: Joi.string().valid("ASC", "DESC").default("DESC"),
    status: Joi.string().valid(
      "active",
      "inactive",
      "blocked",
      "flagged",
      "expired"
    ),
    search: Joi.string().max(100),
    tags: Joi.string().max(500),
    date_from: Joi.date(),
    date_to: Joi.date().min(Joi.ref("date_from")),
  }),

  // Set password validation
  setPassword: Joi.object({
    password: Joi.string().min(4).max(100).required().messages({
      "any.required": "Password is required",
      "string.min": "Password must be at least 4 characters",
    }),
  }),

  // Set expiration validation
  setExpiration: Joi.object({
    expires_at: Joi.date().greater("now").required().messages({
      "any.required": "Expiration date is required",
      "date.greater": "Expiration date must be in the future",
    }),
  }),

  // Bulk create validation
  bulkCreate: Joi.object({
    urls: Joi.array()
      .items(
        Joi.object({
          original_url: Joi.string().uri().required(),
          custom_code: Joi.string()
            .min(3)
            .max(20)
            .pattern(/^[a-zA-Z0-9_-]+$/)
            .optional(),
          title: Joi.string().max(500).optional(),
          tags: Joi.string().max(500).optional(),
        })
      )
      .min(1)
      .max(10000)
      .required()
      .messages({
        "array.min": "At least one URL is required",
        "array.max": "Maximum 10000 URLs allowed per bulk upload",
      }),
  }),

  // Validate short code (for URL params)
  shortCodeParam: Joi.object({
    shortCode: Joi.string()
      .min(3)
      .max(20)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .required(),
  }),

  // Validate URL ID param
  urlIdParam: Joi.object({
    id: Joi.string().uuid().required().messages({
      "string.uuid": "Invalid URL ID format",
    }),
  }),
};

module.exports = urlSchemas;
