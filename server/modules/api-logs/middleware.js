// src/modules/api-logs/middleware.js
const Joi = require("joi");
const ApiLogService = require("./service");
const apiLogUtils = require("./utils");
const { ValidationError } = require("../../utils/errors");

// Initialize service for logging
const logService = new ApiLogService();

const apiLogMiddleware = {
  /**
   * Log API Request
   * Captures and logs all API request details
   */
  logRequest: async (req, res, next) => {
    // Store start time for response time calculation
    const startTime = Date.now();

    // Capture original send function to intercept response
    const originalSend = res.send;
    let responseBody = null;

    res.send = function (data) {
      responseBody = data;
      return originalSend.call(this, data);
    };

    // Log after response is sent
    res.on("finish", async () => {
      try {
        const responseTime = Date.now() - startTime;

        // Get user info
        const userId = req.user ? req.user.id : null;
        const apiKey = req.headers["x-api-key"] || null;

        // Prepare log data
        const logData = {
          userId,
          apiKey,
          endpoint: req.originalUrl || req.url,
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers["user-agent"] || null,
          requestBody: req.body ? JSON.stringify(req.body) : null,
          responseBody: responseBody ? JSON.stringify(responseBody) : null,
        };

        // Anonymize sensitive data
        logData.requestBody = apiLogUtils.anonymizeSensitiveData(
          logData.requestBody
        );
        logData.responseBody = apiLogUtils.anonymizeSensitiveData(
          logData.responseBody
        );

        // Log asynchronously (don't await to avoid blocking)
        logService.logApiRequest(logData).catch((err) => {
          console.error("Failed to log API request:", err);
        });
      } catch (error) {
        console.error("Error in API logging middleware:", error);
      }
    });

    next();
  },

  /**
   * Validate log filters
   * Validates query parameters for log retrieval
   */
  validateLogFilters: (req, res, next) => {
    const schema = Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
      method: Joi.string()
        .valid("GET", "POST", "PUT", "DELETE", "PATCH")
        .optional(),
      statusCode: Joi.number().integer().min(100).max(599).optional(),
      endpoint: Joi.string().max(255).optional(),
      minResponseTime: Joi.number().integer().min(0).optional(),
      maxResponseTime: Joi.number().integer().min(0).optional(),
      search: Joi.string().max(100).optional(),
    });

    const { error, value } = schema.validate(req.query);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    // Parse and validate date range
    if (value.startDate) {
      value.startDate = new Date(value.startDate);
    }
    if (value.endDate) {
      value.endDate = new Date(value.endDate);
    }

    req.validatedFilters = value;
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
        .valid("createdAt", "responseTime", "statusCode")
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
   * Validate export format
   */
  validateExportFormat: (req, res, next) => {
    const schema = Joi.object({
      format: Joi.string().valid("csv", "json", "excel").default("json"),
    });

    const { error, value } = schema.validate(req.query);

    if (error) {
      return next(new ValidationError(error.details[0].message, 400));
    }

    req.exportFormat = value.format;
    next();
  },

  /**
   * Check log access permissions
   * Verifies user can access logs
   */
  checkLogAccess: (req, res, next) => {
    // Admin and moderators can access all logs
    if (req.user && ["admin", "moderator"].includes(req.user.role)) {
      return next();
    }

    // Regular users can only access their own logs
    req.logUserId = req.user ? req.user.id : null;
    next();
  },

  /**
   * Validate log ID
   */
  validateLogId: (req, res, next) => {
    const schema = Joi.object({
      id: Joi.string().uuid().required(),
    });

    const { error } = schema.validate(req.params);

    if (error) {
      return next(new ValidationError("Invalid log ID format", 400));
    }

    next();
  },
};

module.exports = apiLogMiddleware;
