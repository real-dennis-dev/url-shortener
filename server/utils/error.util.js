// src/utils/error.util.js
const logger = require("./logger.util");

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode || 500;
    this.code = code || "INTERNAL_ERROR";
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON response
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }

  /**
   * Log error
   */
  log() {
    const errorLevel = this.statusCode >= 500 ? "error" : "warn";
    logger[errorLevel](
      `API Error: ${this.code} (${this.statusCode}) - ${this.message}`,
      {
        stack: this.stack,
        details: this.details,
      }
    );
  }
}

/**
 * Common error codes
 */
const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  ACCOUNT_BANNED: "ACCOUNT_BANNED",

  // Authorization errors
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  RESOURCE_EXISTS: "RESOURCE_EXISTS",
  CONFLICT: "CONFLICT",

  // Business logic errors
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  URL_EXPIRED: "URL_EXPIRED",
  URL_BLOCKED: "URL_BLOCKED",
  PASSWORD_REQUIRED: "PASSWORD_REQUIRED",
  INVALID_PASSWORD: "INVALID_PASSWORD",

  // System errors
  DATABASE_ERROR: "DATABASE_ERROR",
  CACHE_ERROR: "CACHE_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

/**
 * Create common error instances
 */
const createError = {
  notFound: (resource, id) => {
    return new ApiError(
      404,
      ErrorCodes.NOT_FOUND,
      `${resource} with ID ${id} not found`
    );
  },

  unauthorized: (message = "Authentication required") => {
    return new ApiError(401, ErrorCodes.UNAUTHORIZED, message);
  },

  forbidden: (message = "Insufficient permissions") => {
    return new ApiError(403, ErrorCodes.FORBIDDEN, message);
  },

  validation: (message, details) => {
    return new ApiError(400, ErrorCodes.VALIDATION_ERROR, message, details);
  },

  conflict: (message) => {
    return new ApiError(409, ErrorCodes.CONFLICT, message);
  },

  quotaExceeded: (message) => {
    return new ApiError(429, ErrorCodes.QUOTA_EXCEEDED, message);
  },

  databaseError: (message) => {
    return new ApiError(500, ErrorCodes.DATABASE_ERROR, message);
  },

  serviceUnavailable: (message = "Service temporarily unavailable") => {
    return new ApiError(503, ErrorCodes.SERVICE_UNAVAILABLE, message);
  },
};

/**
 * Async error handler wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  ApiError,
  ErrorCodes,
  createError,
  asyncHandler,
};
