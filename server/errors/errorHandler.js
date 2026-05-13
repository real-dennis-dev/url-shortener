// errors/errorHandler.js - Fixed version with safe method calls
import { errorLogger, createRequestContextLogger } from "../utils/logger.js";
import {
  isSupabaseError,
  getSupabaseErrorResponse,
  convertSupabaseError,
  extractSupabaseErrorInfo,
  SupabaseErrorCodes,
} from "../utils/supabaseErrors.js";

// Error type classifiers
const ErrorClassifier = {
  isSupabaseError: isSupabaseError,

  isJwtError: (err) =>
    err.name === "JsonWebTokenError" ||
    err.name === "TokenExpiredError" ||
    err.message?.includes("JWT"),

  isMulterError: (err) => err.name === "MulterError",

  isJoiError: (err) => err.isJoi === true,

  isRateLimitError: (err) =>
    err.status === 429 ||
    err.code === "ERR_TOO_MANY_REQUESTS" ||
    err.name === "RateLimitError" ||
    (err.message && err.message.toLowerCase().includes("too many requests")),

  isOperationalError: (err) => err.isOperational === true || err.statusCode,

  isValidationError: (err) =>
    err.name === "ValidationError" || err.name === "BadRequestError",

  isConflictError: (err) => err.name === "ConflictError",

  isNotFoundError: (err) => err.name === "NotFoundError",

  isUnauthorizedError: (err) =>
    err.name === "UnauthorizedError" || err.name === "ForbiddenError",
};

// Safe logger method caller
const safeLog = (logger, method, message, data) => {
  if (logger && typeof logger[method] === "function") {
    try {
      logger[method](message, data);
    } catch (logError) {
      console.error("Logging failed:", logError);
    }
  } else if (method === "error" || method === "warn") {
    // Fallback to console for critical logs
    console[method === "security" ? "warn" : method](message, data);
  }
};

// Handle JWT errors
const handleJwtError = (err) => {
  const isExpired = err.name === "TokenExpiredError";
  return {
    status: 401,
    response: {
      success: false,
      error: "Authentication Error",
      message: isExpired
        ? "Session expired. Please log in again."
        : "Invalid token. Please log in again.",
      code: isExpired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
    },
  };
};

// Handle Multer (file upload) errors
const handleMulterError = (err) => {
  const messages = {
    LIMIT_FILE_SIZE: {
      message: "File size exceeds allowed limit",
      error: "File Too Large",
    },
    LIMIT_UNEXPECTED_FILE: {
      message: "Unexpected field in upload",
      error: "Unexpected File",
    },
    LIMIT_FILE_COUNT: {
      message: "Too many files uploaded",
      error: "Too Many Files",
    },
    LIMIT_PART_COUNT: {
      message: "Too many parts in the request",
      error: "Too Many Parts",
    },
  };

  const errorInfo = messages[err.code] || {
    message: "File upload error",
    error: "Upload Error",
  };

  return {
    status: 400,
    response: {
      success: false,
      error: errorInfo.error,
      message: errorInfo.message,
      code: err.code,
    },
  };
};

// Handle Joi validation errors
const handleJoiError = (err) => {
  const details = err.details
    ? err.details.map((d) => d.message)
    : err.errors?.map((e) => e.message) || [err.message];

  const fields = {};
  if (err.details) {
    err.details.forEach((detail) => {
      const field = detail.path.join(".");
      if (!fields[field]) {
        fields[field] = [];
      }
      fields[field].push(detail.message);
    });
  }

  return {
    status: 400,
    response: {
      success: false,
      error: "Validation Error",
      message: "Validation failed for one or more fields.",
      details,
      fields: Object.keys(fields).length > 0 ? fields : undefined,
    },
  };
};

// Handle rate limit errors
const handleRateLimitError = (err) => {
  return {
    status: 429,
    response: {
      success: false,
      error: "Too Many Requests",
      message: err.message || "Please slow down and try again later.",
      retryAfter: err.retryAfter || 60,
    },
  };
};

// Handle custom application errors
const handleOperationalError = (err) => {
  const isServerError = err.statusCode >= 500;

  return {
    status: err.statusCode || err.status || 500,
    response: {
      success: false,
      error: err.name?.replace(/Error$/, "") || "Error",
      message: err.message,
      ...(err.code && { code: err.code }),
      ...(err.details && { details: err.details }),
    },
    isServerError,
  };
};

// Handle Supabase errors with comprehensive logging
const handleSupabaseError = (err, req, logger) => {
  const errorInfo = extractSupabaseErrorInfo(err);
  const supabaseResponse = getSupabaseErrorResponse(err);
  const isServerError = supabaseResponse.status >= 500;

  const logLevel = isServerError ? "error" : "warn";

  const logMetadata = {
    errorType: "SUPABASE_ERROR",
    originalCode: errorInfo.code,
    originalMessage: errorInfo.message,
    details: errorInfo.details,
    hint: errorInfo.hint,
    statusCode: supabaseResponse.status,
    ...(errorInfo.schema && { schema: errorInfo.schema }),
    ...(errorInfo.table && { table: errorInfo.table }),
    ...(errorInfo.column && { column: errorInfo.column }),
    requestDetails: {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
      requestId: req.requestId,
      userAgent: req.get("user-agent"),
    },
  };

  // Safe logging
  if (logger && typeof logger[logLevel] === "function") {
    logger[logLevel](
      `Supabase Error [${errorInfo.code}]: ${errorInfo.message}`,
      logMetadata
    );
  } else {
    console[isServerError ? "error" : "warn"](
      `Supabase Error: ${errorInfo.message}`,
      logMetadata
    );
  }

  // Additional logging for specific error types (using safe methods)
  if (errorInfo.code === SupabaseErrorCodes.PG_UNIQUE_VIOLATION) {
    safeLog(logger, "business", "Database unique constraint violation", {
      constraint: errorInfo.details,
      table: errorInfo.table,
      ...logMetadata.requestDetails,
    });
  }

  if (errorInfo.code === SupabaseErrorCodes.SUPABASE_JWT_ERROR) {
    safeLog(logger, "security", "JWT authentication error", {
      reason: errorInfo.message,
      ...logMetadata.requestDetails,
    });
  }

  if (errorInfo.code === SupabaseErrorCodes.SUPABASE_FILTER_VIOLATION) {
    safeLog(logger, "security", "RLS policy violation", {
      details: errorInfo.details,
      ...logMetadata.requestDetails,
    });
  }

  if (errorInfo.code === SupabaseErrorCodes.SUPABASE_RATE_LIMIT) {
    safeLog(
      logger,
      "warn",
      "Rate limit exceeded on Supabase",
      logMetadata.requestDetails
    );
  }

  if (isServerError) {
    errorLogger.error("Supabase server error", {
      errorInfo,
      requestDetails: logMetadata.requestDetails,
      responseStatus: supabaseResponse.status,
    });
  }

  return {
    status: supabaseResponse.status,
    response: supabaseResponse.response,
    isServerError,
  };
};

// Handle unknown/unexpected errors
const handleUnknownError = (err, req, logger) => {
  const isProduction = process.env.NODE_ENV === "production";

  if (logger && typeof logger.error === "function") {
    logger.error("Unknown error occurred", {
      errorName: err.name,
      errorMessage: err.message,
      stack: !isProduction ? err.stack : undefined,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
      requestId: req.requestId,
    });
  }

  errorLogger.error("Unknown server error", {
    errorName: err.name,
    errorMessage: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  return {
    status: 500,
    response: {
      success: false,
      error: "Server Error",
      message: isProduction
        ? "Something went wrong. Please try again later."
        : err.message,
      ...(!isProduction && { stack: err.stack, name: err.name }),
    },
    isServerError: true,
  };
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  // Create contextual logger for this request
  const requestLogger = createRequestContextLogger(req);

  // Store original error for logging before any modification
  const originalError = { ...err };

  // Convert Supabase errors to custom errors first
  let processedError = err;
  let isSupabase = false;

  if (ErrorClassifier.isSupabaseError(err)) {
    processedError = convertSupabaseError(err);
    isSupabase = true;
  }

  // Determine error response based on type
  let errorResponse;
  let logLevel = "error";

  // Order matters - more specific checks first
  if (isSupabase) {
    errorResponse = handleSupabaseError(err, req, requestLogger);
    logLevel = errorResponse.isServerError ? "error" : "warn";
  } else if (ErrorClassifier.isJwtError(processedError)) {
    errorResponse = handleJwtError(processedError);
    logLevel = "warn";
    safeLog(requestLogger, "security", "JWT validation failed", {
      error: processedError.message,
      errorName: processedError.name,
    });
  } else if (ErrorClassifier.isMulterError(processedError)) {
    errorResponse = handleMulterError(processedError);
    logLevel = "warn";
    safeLog(requestLogger, "request", "File upload error", {
      code: processedError.code,
      message: processedError.message,
    });
  } else if (ErrorClassifier.isJoiError(processedError)) {
    errorResponse = handleJoiError(processedError);
    logLevel = "warn";
    safeLog(requestLogger, "request", "Validation error", {
      details: errorResponse.response.details,
      fields: errorResponse.response.fields,
    });
  } else if (ErrorClassifier.isRateLimitError(processedError)) {
    errorResponse = handleRateLimitError(processedError);
    logLevel = "warn";
    safeLog(requestLogger, "security", "Rate limit exceeded", {
      ip: req.ip,
      userId: req.user?.id,
    });
  } else if (ErrorClassifier.isOperationalError(processedError)) {
    errorResponse = handleOperationalError(processedError);
    logLevel = errorResponse.isServerError ? "error" : "warn";

    safeLog(
      requestLogger,
      logLevel,
      `Operational error: ${processedError.message}`,
      {
        errorName: processedError.name,
        statusCode: errorResponse.status,
        code: processedError.code,
        details: processedError.details,
      }
    );
  } else {
    errorResponse = handleUnknownError(processedError, req, requestLogger);
    logLevel = "error";
  }

  // Always log the error with appropriate level
  const logMessage = `${processedError.name || "Error"}: ${
    processedError.message
  }`;
  const logMeta = {
    errorName: processedError.name,
    statusCode: errorResponse.status,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    requestId: req.requestId,
    userAgent: req.get("user-agent"),
    isSupabaseError: isSupabase,
    originalErrorCode: originalError.code,
    originalErrorMessage: originalError.message,
    ...(processedError.details && { details: processedError.details }),
    ...(processedError.hint && { hint: processedError.hint }),
  };

  // Safe logging
  if (requestLogger && typeof requestLogger[logLevel] === "function") {
    requestLogger[logLevel](logMessage, logMeta);
  } else {
    // Fallback to console
    console[logLevel === "error" ? "error" : "warn"](logMessage, logMeta);
  }

  // Additional logging for server errors
  if (errorResponse.status >= 500) {
    errorLogger.error("Server error detected", {
      statusCode: errorResponse.status,
      path: req.originalUrl,
      method: req.method,
      errorName: processedError.name,
      errorMessage: processedError.message,
      isSupabaseError: isSupabase,
      userId: req.user?.id,
      requestId: req.requestId,
      originalError: {
        code: originalError.code,
        message: originalError.message,
        details: originalError.details,
        hint: originalError.hint,
      },
    });
  }

  // Log 4xx errors for analytics (skip common expected errors)
  if (errorResponse.status >= 400 && errorResponse.status < 500) {
    if (![401, 404].includes(errorResponse.status)) {
      safeLog(requestLogger, "request", "Client error", {
        statusCode: errorResponse.status,
        error: errorResponse.response.error,
        path: req.originalUrl,
        method: req.method,
      });
    }
  }

  // Don't send stack traces in production
  if (process.env.NODE_ENV === "production") {
    delete errorResponse.response.stack;
    delete errorResponse.response.details;
    delete errorResponse.response.hint;
    delete errorResponse.response.raw_message;
    delete errorResponse.response.schema;
    delete errorResponse.response.table;
    delete errorResponse.response.column;
  }

  // Add request ID to response for tracking
  errorResponse.response.requestId = req.requestId;
  errorResponse.response.timestamp = new Date().toISOString();

  // Send response
  res.status(errorResponse.status).json(errorResponse.response);
};

// Not found handler
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.status = 404;
  error.name = "NotFoundError";
  next(error);
};

// Graceful error handler for uncaught exceptions
export const handleUncaughtException = (err, origin) => {
  console.error("Uncaught Exception:", err);
  errorLogger.error("Uncaught Exception", {
    error: err.message,
    stack: err.stack,
    origin,
    timestamp: new Date().toISOString(),
  });

  if (isSupabaseError(err)) {
    const errorInfo = extractSupabaseErrorInfo(err);
    errorLogger.error("Supabase uncaught exception details", errorInfo);
  }

  process.exit(1);
};

// Graceful handler for unhandled rejections
export const handleUnhandledRejection = (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  errorLogger.error("Unhandled Rejection", {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise?.toString(),
    timestamp: new Date().toISOString(),
  });

  if (isSupabaseError(reason)) {
    const errorInfo = extractSupabaseErrorInfo(reason);
    errorLogger.error("Supabase unhandled rejection details", errorInfo);
  }
};

export default errorHandler;
