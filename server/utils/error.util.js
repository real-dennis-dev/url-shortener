const logger = require("./logger.util");

/**
 * Custom API Error
 *
 * Usage:
 *   throw new ApiError(400, "Invalid email");
 *   throw new ApiError(401, "Invalid credentials");
 *   throw new ApiError(409, "User already exists");
 *   throw new ApiError(500);
 */
class ApiError extends Error {
  constructor(statusCode = 500, message = null, details = null) {
    super(message || getDefaultMessage(statusCode));

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    // Stack exists on the server, but will NEVER be sent to the client.
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * JSON representation.
   *
   * Do NOT include stack here.
   */
  toJSON() {
    return {
      success: false,
      error: {
        statusCode: this.statusCode,
        message: this.message,
        ...(this.details !== null && {
          details: this.details,
        }),
        timestamp: this.timestamp,
      },
    };
  }

  /**
   * Log the complete error internally.
   */
  log() {
    const errorLevel = this.statusCode >= 500 ? "error" : "warn";

    logger[errorLevel](`API Error: ${this.statusCode} - ${this.message}`, {
      statusCode: this.statusCode,
      message: this.message,
      details: this.details,
      stack: this.stack,
    });
  }
}

/**
 * Default messages based purely on HTTP status.
 *
 * You don't need to specify a message when the generic message
 * is sufficient.
 */
function getDefaultMessage(statusCode) {
  const messages = {
    400: "Bad request",
    401: "Authentication required",
    403: "Forbidden",
    404: "Resource not found",
    405: "Method not allowed",
    408: "Request timeout",
    409: "Resource conflict",
    410: "Resource no longer available",
    413: "Request entity too large",
    415: "Unsupported media type",
    422: "Unprocessable entity",
    429: "Too many requests",
    500: "Internal server error",
    501: "Not implemented",
    502: "Bad gateway",
    503: "Service temporarily unavailable",
    504: "Gateway timeout",
  };

  return messages[statusCode] || "An unexpected error occurred";
}

/**
 * Async error handler wrapper
 */

module.exports = {
  ApiError,
};
