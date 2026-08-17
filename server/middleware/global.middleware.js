// src/middleware/global.middleware.js
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const helmet = require("helmet");
const { v4: uuidv4 } = require("uuid");
const userAgent = require("useragent");
const logger = require("../utils/logger.util");
const { ApiError } = require("../utils/error.util");

/**
 * Global Middleware Configuration
 * All middleware functions for the application
 */
const globalMiddleware = {
  /**
   * CORS Handler
   * Configures Cross-Origin Resource Sharing headers
   */
  corsHandler: (req, res, next) => {
    const corsOptions = {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",")
        : "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-API-Key",
        "X-Request-ID",
      ],
      exposedHeaders: ["X-Request-ID", "X-Response-Time"],
      credentials: true,
      maxAge: 86400, // 24 hours
    };

    return cors(corsOptions)(req, res, next);
  },

  /**
   * Request Logger
   * Logs all incoming requests with details
   */
  requestLogger: (req, res, next) => {
    const startTime = Date.now();

    // Log request
    logger.info("Incoming Request", {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: req.id,
    });

    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
      const responseTime = Date.now() - startTime;

      // Log response
      logger.info("Request Completed", {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        requestId: req.id,
      });

      return originalSend.call(this, data);
    };

    next();
  },

  /**
   * Error Handler
   * Handles and formats all errors
   */
  errorHandler: (err, req, res, next) => {
    // Log error
    logger.error("Error occurred", {
      error: err.message,
      stack: err.stack,
      method: req.method,
      url: req.url,
      requestId: req.id,
      ip: req.ip,
    });

    // Handle known errors
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          requestId: req.id,
        },
      });
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: err.details || err.message,
          requestId: req.id,
        },
      });
    }

    // Handle JWT errors
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired token",
          requestId: req.id,
        },
      });
    }

    // Handle database errors
    if (err.code && err.code.startsWith("23")) {
      return res.status(409).json({
        success: false,
        error: {
          code: "DUPLICATE_ERROR",
          message: "Duplicate entry found",
          details: err.detail,
          requestId: req.id,
        },
      });
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error";

    res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || "INTERNAL_ERROR",
        message: message,
        requestId: req.id,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
      },
    });
  },

  /**
   * Request Validation
   * Validates request against Joi schema
   */
  validateRequest: (schema) => {
    return (req, res, next) => {
      const options = {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
      };

      const joiSchema = schema.body || schema;

      const { error, value } = joiSchema.validate(req.body, options);

      if (error) {
        const details = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        }));

        return next(
          new ApiError(400, "VALIDATION_ERROR", "Validation failed", details)
        );
      }

      req.body = value;
      return next();
    };
  },

  /**
   * Query Validation
   * Validates query parameters against Joi schema
   */
  validateQuery: (schema) => {
    return (req, res, next) => {
      const options = {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
      };

      const joiSchema = schema.query || schema;

      const { error, value } = joiSchema.validate(req.query, options);

      if (error) {
        const details = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        }));

        return next(
          new ApiError(
            400,
            "VALIDATION_ERROR",
            "Invalid query parameters",
            details
          )
        );
      }

      // Important: see note below about req.query
      Object.assign(req.query, value);

      return next();
    };
  },

  /**
   * Params Validation
   * Validates URL parameters against Joi schema
   */
  validateParams: (schema) => {
    return (req, res, next) => {
      const options = {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
      };

      const joiSchema = schema.params || schema;

      const { error, value } = joiSchema.validate(req.params, options);

      if (error) {
        const details = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        }));

        return next(
          new ApiError(
            400,
            "VALIDATION_ERROR",
            "Invalid URL parameters",
            details
          )
        );
      }

      Object.assign(req.params, value);

      return next();
    };
  },

  /**
   * Compression Handler
   * Enables response compression
   */
  compressionHandler: (req, res, next) => {
    return compression({
      level: 6,
      threshold: 1024, // Only compress responses > 1KB
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
    })(req, res, next);
  },

  /**
   * Security Headers
   * Sets various security headers
   */
  securityHeaders: (req, res, next) => {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"],
        },
      },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: "deny" },
      xssFilter: true,
      noSniff: true,
      ieNoOpen: true,
    })(req, res, next);
  },

  /**
   * Request ID Generator
   * Generates unique ID for each request
   */
  requestIdGenerator: (req, res, next) => {
    req.id = uuidv4();
    res.setHeader("X-Request-ID", req.id);
    next();
  },

  /**
   * Response Time Tracker
   * Tracks and adds response time header
   */
  responseTimeTracker: (req, res, next) => {
    const start = process.hrtime();

    res.on("finish", () => {
      const diff = process.hrtime(start);
      const responseTime = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2);

      logger.info("Response completed", {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
      });
    });

    next();
  },
  /**
   * IP Address Extraction
   * Extracts client IP address from various sources
   */
  extractIpAddress: (req, res, next) => {
    // Check various headers for client IP
    const ip =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    // Remove port if present
    req.ip = ip
      ? ip
          .split(",")[0]
          .trim()
          .replace(/::ffff:/, "")
      : "127.0.0.1";
    next();
  },

  /**
   * User Agent Parsing
   * Parses user agent string and adds to request
   */
  parseUserAgent: (req, res, next) => {
    const uaString = req.headers["user-agent"] || "";
    const ua = userAgent.parse(uaString);

    req.userAgent = {
      raw: uaString,
      browser: ua.family,
      browserVersion: ua.major,
      os: ua.os.family,
      osVersion: ua.os.major,
      device: ua.device.family || "Unknown",
      isBot: ua.isBot || false,
      isMobile: ua.device.family === "Mobile" || false,
    };

    next();
  },

  /**
   * Request Size Limiter
   * Limits request body size
   */
  requestSizeLimiter: (limit = "10mb") => {
    return (req, res, next) => {
      const contentLength = req.headers["content-length"];

      if (contentLength) {
        const maxBytes = require("bytes")(limit);
        if (parseInt(contentLength) > maxBytes) {
          return next(
            new ApiError(
              413,
              "PAYLOAD_TOO_LARGE",
              `Request body exceeds ${limit} limit`
            )
          );
        }
      }

      next();
    };
  },

  /**
   * Rate Limiter
   * Implements rate limiting based on user or IP
   */
  rateLimiter: (options) => {
    const RateLimiter = require("express-rate-limit");
    const limiter = new RateLimiter({
      windowMs: options.windowMs || 60000,
      max: options.max || 100,
      keyGenerator: (req) => {
        return req.user?.id || req.ip;
      },
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests, please try again later.",
            retryAfter: Math.ceil(options.windowMs / 1000),
          },
        });
      },
      ...options,
    });

    return limiter;
  },
};

module.exports = {
  globalMiddleware,
  corsHandler: globalMiddleware.corsHandler,
  requestLogger: globalMiddleware.requestLogger,
  errorHandler: globalMiddleware.errorHandler,

  validateRequest: globalMiddleware.validateRequest,
  validateQuery: globalMiddleware.validateQuery,
  validateParams: globalMiddleware.validateParams,

  compressionHandler: globalMiddleware.compressionHandler,
  securityHeaders: globalMiddleware.securityHeaders,

  requestIdGenerator: globalMiddleware.requestIdGenerator,
  extractIpAddress: globalMiddleware.extractIpAddress,
  parseUserAgent: globalMiddleware.parseUserAgent,

  requestSizeLimiter: globalMiddleware.requestSizeLimiter,
  rateLimiter: globalMiddleware.rateLimiter,
};
