// src/utils/response.util.js
const logger = require("./logger.util");

class ResponseUtil {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {Object} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   * @returns {Object} - JSON response
   */
  static success(res, data = null, message = "Success", statusCode = 200) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString(),
    };

    if (data) {
      response.data = data;
    }

    // Add pagination metadata if present
    if (data && data.pagination) {
      response.pagination = data.pagination;
      delete data.pagination;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {Error|ApiError} error - Error object
   * @param {number} statusCode - HTTP status code
   * @returns {Object} - JSON response
   */
  static error(res, error, statusCode = 500) {
    let response = {
      success: false,
      timestamp: new Date().toISOString(),
    };

    if (error.isOperational) {
      // API Error
      response = {
        ...response,
        error: {
          code: error.code,
          message: error.message,
          details: error.details || undefined,
        },
      };
      statusCode = error.statusCode || statusCode;
    } else if (error.name === "ValidationError") {
      // Validation Error
      response.error = {
        code: "VALIDATION_ERROR",
        message: error.message,
        details: error.details || undefined,
      };
      statusCode = 400;
    } else if (error.name === "JsonWebTokenError") {
      // JWT Error
      response.error = {
        code: "INVALID_TOKEN",
        message: "Invalid or expired token",
      };
      statusCode = 401;
    } else {
      // Unknown Error
      response.error = {
        code: "INTERNAL_ERROR",
        message:
          process.env.NODE_ENV === "production"
            ? "An internal server error occurred"
            : error.message,
      };

      // Add stack trace in development
      if (process.env.NODE_ENV !== "production") {
        response.error.stack = error.stack;
      }
    }

    // Log error
    logger.error("Response error:", {
      statusCode,
      error: response.error,
      stack: error.stack,
    });

    return res.status(statusCode).json(response);
  }

  /**
   * Send paginated response
   * @param {Object} res - Express response object
   * @param {Array} data - Response data
   * @param {Object} pagination - Pagination metadata
   * @param {string} message - Success message
   * @returns {Object} - JSON response
   */
  static paginated(res, data, pagination, message = "Success") {
    const response = {
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        total: pagination.total || data.length,
        pages:
          pagination.pages ||
          Math.ceil(
            (pagination.total || data.length) / (pagination.limit || 20)
          ),
      },
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(response);
  }

  /**
   * Send created response
   * @param {Object} res - Express response object
   * @param {Object} data - Created data
   * @param {string} message - Success message
   * @returns {Object} - JSON response
   */
  static created(res, data, message = "Resource created successfully") {
    return this.success(res, data, message, 201);
  }

  /**
   * Send accepted response
   * @param {Object} res - Express response object
   * @param {Object} data - Response data
   * @param {string} message - Success message
   * @returns {Object} - JSON response
   */
  static accepted(res, data, message = "Request accepted") {
    return this.success(res, data, message, 202);
  }

  /**
   * Send no content response
   * @param {Object} res - Express response object
   * @returns {Object} - Empty response
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Send validation error
   * @param {Object} res - Express response object
   * @param {Array} errors - Validation errors
   * @returns {Object} - JSON response
   */
  static validationError(res, errors) {
    return this.error(
      res,
      {
        name: "ValidationError",
        message: "Validation failed",
        details: errors,
        isOperational: true,
      },
      400
    );
  }

  /**
   * Send not found error
   * @param {Object} res - Express response object
   * @param {string} resource - Resource name
   * @param {string} identifier - Resource identifier
   * @returns {Object} - JSON response
   */
  static notFound(res, resource = "Resource", identifier = "") {
    const message = identifier
      ? `${resource} with ID ${identifier} not found`
      : `${resource} not found`;
    return this.error(
      res,
      {
        name: "NotFoundError",
        message,
        code: "NOT_FOUND",
        isOperational: true,
      },
      404
    );
  }

  /**
   * Send unauthorized error
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} - JSON response
   */
  static unauthorized(res, message = "Authentication required") {
    return this.error(
      res,
      {
        name: "UnauthorizedError",
        message,
        code: "UNAUTHORIZED",
        isOperational: true,
      },
      401
    );
  }

  /**
   * Send forbidden error
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} - JSON response
   */
  static forbidden(res, message = "Insufficient permissions") {
    return this.error(
      res,
      {
        name: "ForbiddenError",
        message,
        code: "FORBIDDEN",
        isOperational: true,
      },
      403
    );
  }

  /**
   * Send conflict error
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} - JSON response
   */
  static conflict(res, message = "Resource already exists") {
    return this.error(
      res,
      {
        name: "ConflictError",
        message,
        code: "CONFLICT",
        isOperational: true,
      },
      409
    );
  }

  /**
   * Send rate limit error
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} retryAfter - Seconds to wait
   * @returns {Object} - JSON response
   */
  static rateLimit(res, message = "Too many requests", retryAfter = 60) {
    res.set("Retry-After", retryAfter);
    return this.error(
      res,
      {
        name: "RateLimitError",
        message,
        code: "RATE_LIMIT_EXCEEDED",
        isOperational: true,
      },
      429
    );
  }

  /**
   * Send service unavailable error
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} - JSON response
   */
  static serviceUnavailable(res, message = "Service temporarily unavailable") {
    return this.error(
      res,
      {
        name: "ServiceUnavailableError",
        message,
        code: "SERVICE_UNAVAILABLE",
        isOperational: true,
      },
      503
    );
  }

  /**
   * Format file response
   * @param {Object} res - Express response object
   * @param {Buffer|Stream} file - File data
   * @param {string} filename - File name
   * @param {string} contentType - MIME type
   * @returns {Object} - File response
   */
  static file(res, file, filename, contentType) {
    res.set({
      "Content-Type": contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": file.length || undefined,
    });

    if (typeof file === "string" || Buffer.isBuffer(file)) {
      return res.send(file);
    }

    return file.pipe(res);
  }

  /**
   * Format CSV response
   * @param {Object} res - Express response object
   * @param {string} csvData - CSV data
   * @param {string} filename - File name
   * @returns {Object} - CSV response
   */
  static csv(res, csvData, filename = "export.csv") {
    res.set({
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });
    return res.send(csvData);
  }

  /**
   * Format JSON response
   * @param {Object} res - Express response object
   * @param {Object} data - Data to format
   * @param {string} filename - File name
   * @returns {Object} - JSON response
   */
  static jsonFile(res, data, filename = "export.json") {
    res.set({
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });
    return res.json(data);
  }
}

module.exports = ResponseUtil;
