// src/modules/system/middleware.js
const Joi = require("joi");
const { ValidationError } = require("../../utils/errors");
const CacheService = require("../../services/cache.service");

const systemMiddleware = {
  /**
   * Check maintenance mode
   * Blocks requests if system is in maintenance mode
   */
  checkMaintenanceMode: async (req, res, next) => {
    try {
      const cache = new CacheService();

      // Check cache first for performance
      let maintenanceMode = await cache.get("system:maintenance");

      if (maintenanceMode === null) {
        // If not in cache, check database
        const DatabaseService = require("../../services/database.service");
        const db = new DatabaseService();

        const result = await db.executeQuery(
          `SELECT value FROM system_settings WHERE key = 'maintenance_mode'`
        );

        maintenanceMode =
          result && result.length > 0 ? result[0].value === "true" : false;

        // Cache for 60 seconds
        await cache.set("system:maintenance", maintenanceMode, 60);
      }

      // If in maintenance mode, check if request is from admin
      if (maintenanceMode) {
        const isAdmin = req.user && req.user.role === "admin";
        const isHealthCheck = req.path === "/health";
        const isStatusCheck = req.path === "/status";

        // Allow health and status checks during maintenance
        if (isHealthCheck || isStatusCheck) {
          return next();
        }

        // Allow admin access during maintenance
        if (isAdmin) {
          return next();
        }

        // Block all other requests
        return next(
          new ValidationError(
            "System is currently under maintenance. Please try again later.",
            503
          )
        );
      }

      next();
    } catch (error) {
      // If there's an error checking maintenance mode, continue
      // to avoid blocking all requests
      console.error("Error checking maintenance mode:", error);
      next();
    }
  },

  /**
   * Check admin permissions
   * Verifies user has admin role
   */
  checkAdminPermissions: (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new ValidationError("User not authenticated", 401));
    }

    if (req.user.role !== "admin") {
      return next(
        new ValidationError("Admin privileges required for this operation", 403)
      );
    }

    next();
  },

  /**
   * Validate system settings update
   */
  validateSystemSettings: (req, res, next) => {
    const schema = Joi.object({
      settings: Joi.object({
        max_url_length: Joi.number().integer().min(100).max(10000).optional(),
        allowed_domains: Joi.array().items(Joi.string()).optional(),
        rate_limits: Joi.object({
          anonymous: Joi.number().integer().min(1).max(100).optional(),
          authenticated: Joi.number().integer().min(1).max(10000).optional(),
          premium: Joi.number().integer().min(1).max(100000).optional(),
        }).optional(),
        qr_settings: Joi.object({
          default_size: Joi.number().integer().min(100).max(1000).optional(),
          allowed_formats: Joi.array()
            .items(Joi.string().valid("png", "svg", "jpg"))
            .optional(),
        }).optional(),
        maintenance_mode: Joi.boolean().optional(),
        short_code_length: Joi.number().integer().min(3).max(10).optional(),
        max_short_code_length: Joi.number().integer().min(5).max(30).optional(),
        click_cache_duration: Joi.number()
          .integer()
          .min(60)
          .max(86400)
          .optional(),
        bulk_upload_max_rows: Joi.number()
          .integer()
          .min(100)
          .max(100000)
          .optional(),
        api_rate_limit: Joi.number().integer().min(10).max(10000).optional(),
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

  /**
   * Validate settings keys for retrieval
   */
  validateSettingsKeys: (req, res, next) => {
    const schema = Joi.object({
      keys: Joi.array().items(Joi.string()).min(1).optional(),
    });

    const { error, value } = schema.validate(req.query);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    req.validatedQuery = value;
    next();
  },

  /**
   * Rate limiting for system endpoints
   */
  systemRateLimiter: (req, res, next) => {
    // System endpoints have stricter rate limits
    const rateLimitConfig = {
      windowMs: 60000, // 1 minute
      max: 30, // 30 requests per minute
    };

    // Use the global rate limiter with custom config
    const { rateLimiter } = require("../../middleware/global.middleware");
    const limiter = rateLimiter(rateLimitConfig.windowMs, rateLimitConfig.max);
    limiter(req, res, next);
  },

  /**
   * Validate maintenance mode toggle
   */
  validateMaintenanceToggle: (req, res, next) => {
    const schema = Joi.object({
      enable: Joi.boolean().required(),
      message: Joi.string().max(500).optional(),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    req.validatedData = value;
    next();
  },

  /**
   * Check system health access
   */
  checkHealthAccess: (req, res, next) => {
    // Health checks are public
    // Additional security measures can be added here if needed
    next();
  },

  /**
   * Log system operations
   */
  logSystemOperation: (req, res, next) => {
    const startTime = Date.now();

    // Add response listener to log after completion
    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const logData = {
        userId: req.user ? req.user.id : null,
        operation: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date().toISOString(),
      };

      // Log to file or database asynchronously
      console.log("[System Operation]", JSON.stringify(logData));

      // Optionally, queue for persistence
      try {
        const QueueService = require("../../services/queue.service");
        const queue = new QueueService();
        queue.addJob("system-logs", logData);
      } catch (error) {
        // Silently fail if queue is not available
      }
    });

    next();
  },
};

module.exports = systemMiddleware;
