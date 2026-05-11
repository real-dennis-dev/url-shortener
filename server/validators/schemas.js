import Joi from "joi";

export const analyticsQuerySchema = Joi.object({
  period: Joi.string()
    .valid("all", "today", "week", "month")
    .default("all")
    .messages({
      "any.only": "Period must be one of: all, today, week, month",
    }),

  startDate: Joi.date().iso().optional().messages({
    "date.base": "startDate must be a valid date",
    "date.isoDate": "startDate must be in ISO format (YYYY-MM-DD)",
  }),

  endDate: Joi.date().iso().optional().messages({
    "date.base": "endDate must be a valid date",
    "date.isoDate": "endDate must be in ISO format (YYYY-MM-DD)",
  }),
}).custom((value, helpers) => {
  // Custom validation: if both dates are provided, startDate must be before or equal to endDate
  if (value.startDate && value.endDate) {
    if (new Date(value.startDate) > new Date(value.endDate)) {
      return helpers.message({
        custom: "startDate must be before or equal to endDate",
      });
    }
  }
  return value;
});
export const registerSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Full name is required",
    "string.min": "Full name must be at least 2 characters long",
    "string.max": "Full name cannot exceed 100 characters",
  }),

  email: Joi.string().trim().email({ tlds: false }).required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),

  username: Joi.string().trim().alphanum().min(3).max(30).required().messages({
    "string.empty": "Username is required",
    "string.alphanum": "Username can only contain letters and numbers",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username cannot exceed 30 characters",
  }),

  password: Joi.string().min(8).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters long",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: false }).required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),

  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: false }).required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string().min(8).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters long",
  }),
});
export const createUrlSchema = Joi.object({
  originalUrl: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .required()
    .max(2048)
    .messages({
      "string.uri": "Original URL must be a valid HTTP/HTTPS URL",
      "string.empty": "Original URL is required",
      "string.max": "URL exceeds maximum length of 2048 characters",
    }),
  customAlias: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .min(3)
    .max(20)
    .optional()
    .messages({
      "string.pattern.base":
        "Custom alias can only contain letters, numbers, underscores, and hyphens",
      "string.min": "Custom alias must be at least 3 characters",
      "string.max": "Custom alias cannot exceed 20 characters",
    }),
  expiresAt: Joi.date().iso().greater("now").optional().messages({
    "date.greater": "Expiration date must be in the future",
  }),
  password: Joi.string().min(4).max(100).optional(),
  title: Joi.string().max(200).optional(),
  description: Joi.string().max(500).optional(),
  tags: Joi.array().items(Joi.string().max(30)).max(10).optional(),
});

export const updateUrlSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  description: Joi.string().max(500).optional(),
  tags: Joi.array().items(Joi.string().max(30)).max(10).optional(),
});

export const bulkCreateSchema = Joi.object({
  urls: Joi.array()
    .items(
      Joi.object({
        originalUrl: Joi.string().uri().required(),
        customAlias: Joi.string()
          .pattern(/^[a-zA-Z0-9_-]+$/)
          .min(3)
          .max(20)
          .optional(),
        title: Joi.string().max(200).optional(),
        tags: Joi.string().optional(),
      })
    )
    .min(1)
    .max(100)
    .required(),
});

export const qrSchema = Joi.object({
  size: Joi.number().integer().min(100).max(2000).default(300).messages({
    "number.base": "Size must be a number",
    "number.min": "QR code size must be at least 100px",
    "number.max": "QR code size cannot exceed 2000px",
  }),

  margin: Joi.number().integer().min(0).max(10).default(2).messages({
    "number.base": "Margin must be a number",
    "number.min": "Margin cannot be negative",
    "number.max": "Margin cannot exceed 10",
  }),

  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .default("#000000")
    .messages({
      "string.pattern.base": "Color must be a valid hex code (e.g., #000000)",
    }),

  background: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .default("#FFFFFF")
    .messages({
      "string.pattern.base":
        "Background must be a valid hex code (e.g., #FFFFFF)",
    }),

  format: Joi.string().valid("png", "svg").default("png").messages({
    "any.only": "Format must be either 'png' or 'svg'",
  }),

  filename: Joi.string()
    .optional()
    .pattern(/^[a-zA-Z0-9_.-]+$/)
    .max(100)
    .messages({
      "string.pattern.base":
        "Filename can only contain letters, numbers, underscore, dot, and hyphen",
      "string.max": "Filename is too long (max 100 characters)",
    }),
});
export const bulkQRCodeSchema = Joi.object({
  shortCodes: Joi.array()
    .items(Joi.string().trim().min(1).max(20).required())
    .min(1)
    .max(20)
    .required()
    .messages({
      "array.base": "shortCodes must be an array",
      "array.min": "Please provide at least one short code",
      "array.max": "Maximum 20 QR codes per request",
    }),
});

export const styledQRCodeSchema = Joi.object({
  size: Joi.number().integer().min(100).max(2000).default(400),

  logo: Joi.string().uri().optional().messages({
    "string.uri": "Logo must be a valid URL",
  }),

  gradientStart: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional(),

  gradientEnd: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional(),

  pattern: Joi.string()
    .valid("dots", "rounded", "square", "extra-rounded")
    .optional(),
});
export const validateUrlSchema = Joi.object({
  url: Joi.string().uri().required().max(2048),
});

export const userUpdateSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).optional(),
  avatar_url: Joi.string().uri().optional(),
  preferences: Joi.object({
    theme: Joi.string().valid("light", "dark", "auto").optional(),
    notifications: Joi.boolean().optional(),
    language: Joi.string().length(2).optional(),
  }).optional(),
});

export const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string()
    .min(6)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    }),
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(100).optional(),
  sortBy: Joi.string()
    .valid("created_at", "click_count", "updated_at")
    .default("created_at"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

/* ====================== DASHBOARD SCHEMAS ====================== */

export const dashboardQuerySchema = Joi.object({
  type: Joi.string()
    .valid("clicks", "growth", "devices", "geography")
    .default("clicks")
    .messages({
      "any.only":
        "Chart type must be one of: clicks, growth, devices, geography",
    }),

  period: Joi.string().valid("7d", "30d", "90d").default("30d").messages({
    "any.only": "Period must be one of: 7d, 30d, 90d",
  }),
});

// Optional: Schema for future export route (if you add query params)
export const dashboardExportSchema = Joi.object({
  format: Joi.string().valid("json", "csv", "pdf").default("json").messages({
    "any.only": "Export format must be json, csv, or pdf",
  }),

  period: Joi.string().valid("7d", "30d", "90d", "all").default("30d"),
});

// ====================== URL Filtering ======================
export const adminUrlFilterSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100).allow("", null),
  status: Joi.string().valid("active", "inactive", "all").default("all"),
  userId: Joi.string().uuid().allow("", null),
  fromDate: Joi.string().isoDate().allow("", null),
  toDate: Joi.string().isoDate().allow("", null),
});

// ====================== Moderation ======================
export const moderationSchema = Joi.object({
  action: Joi.string()
    .valid("deactivate", "delete", "warn")
    .required()
    .messages({
      "any.only": "Action must be one of: deactivate, delete, warn",
    }),
  reason: Joi.string().trim().min(5).max(500).allow("", null),
});

// ====================== User Update ======================
export const adminUserUpdateSchema = Joi.object({
  plan: Joi.string().valid("free", "pro", "business", "enterprise"),
  role: Joi.string().valid("user", "moderator").allow(null), // prevent setting admin
  status: Joi.string().valid("suspend", "unsuspend", "active"),
  quota_limit: Joi.number().integer().min(0),
});

// ====================== Global Analytics ======================
export const adminAnalyticsSchema = Joi.object({
  period: Joi.string().valid("7d", "30d", "90d").default("30d"),
});

// ====================== Export Schema ======================
export const adminExportSchema = Joi.object({
  type: Joi.string()
    .valid("urls", "users", "analytics", "clicks")
    .default("urls"),
  format: Joi.string().valid("json", "csv").default("json"),
  fromDate: Joi.string().isoDate().allow("", null),
  toDate: Joi.string().isoDate().allow("", null),
});

// ====================== Abuse Report Resolve ======================
export const resolveAbuseReportSchema = Joi.object({
  resolution: Joi.string().trim().min(10).max(1000).required(),
  notes: Joi.string().trim().max(2000).allow("", null),
});

export const bulkArchiveSchema = Joi.object({
  shortCodes: Joi.array()
    .items(Joi.string().trim().required())
    .min(1)
    .max(50)
    .required(),
});

export const bulkDeleteSchema = Joi.object({
  shortCodes: Joi.array()
    .items(Joi.string().trim().required())
    .min(1)
    .max(30)
    .required(),
});

export const bulkTagsSchema = Joi.object({
  shortCodes: Joi.array()
    .items(Joi.string().trim().required())
    .min(1)
    .max(50)
    .required(),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10),
});
