// errorHandler.js - refactored
import { handlePostgreError } from "../utils/helpers.js";
import { errorLogger, createRequestContextLogger } from "../utils/logger.js";

// Error type classifiers
const ErrorClassifier = {
  isPostgreError: (err) =>
    err.code && typeof err.code === "string" && err.code.length === 5,

  isJwtError: (err) =>
    ["JsonWebTokenError", "TokenExpiredError"].includes(err.name),

  isMulterError: (err) => err.name === "MulterError",

  isJoiError: (err) => err.isJoi === true,

  isRateLimitError: (err) =>
    err.status === 429 ||
    err.code === "ERR_TOO_MANY_REQUESTS" ||
    err.name === "RateLimitError" || // newer versions
    (err.message && err.message.toLowerCase().includes("too many requests")),
  isOperationalError: (err) => err.isOperational === true || err.statusCode,
};

// Handle specific error types

const handleRateLimitError = (err) => {
  // express-rate-limit already attaches the message you defined
  const rateLimitMessage = err.message || {
    success: false,
    error: "Too Many Requests",
    message: "Please slow down and try again later.",
  };

  return {
    status: 429,
    response:
      typeof rateLimitMessage === "object"
        ? rateLimitMessage
        : {
            success: false,
            error: "Too Many Requests",
            message: rateLimitMessage,
          },
  };
};

const handlePostgreErrorResponse = (err) => {
  const { status, message } = handlePostgreError(err);
  return {
    status,
    response: {
      success: false,
      error: "Database Error",
      message,
    },
  };
};

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
    },
  };
};

const handleMulterError = (err) => {
  const messages = {
    LIMIT_FILE_SIZE: "File size exceeds allowed limit",
    LIMIT_UNEXPECTED_FILE: "Unexpected field in upload",
  };

  return {
    status: 400,
    response: {
      success: false,
      error: "Upload Error",
      message: messages[err.code] || "File upload error",
    },
  };
};

const handleJoiError = (err) => {
  const details = err.details
    ? err.details.map((d) => d.message)
    : err.errors?.map((e) => e.message) || [err.message];

  return {
    status: 400,
    response: {
      success: false,
      error: "Validation Error",
      details,
    },
  };
};

const errorHandler = (err, req, res, next) => {
  // Create contextual logger for this request
  const requestLogger = createRequestContextLogger(req, req.requestId);

  // Determine error response based on type
  let errorResponse;
  let logLevel = "error";
  let logMetadata = {};

  // Order matters - more specific checks first
  if (ErrorClassifier.isPostgreError(err)) {
    errorResponse = handlePostgreErrorResponse(err);
    logMetadata = {
      code: err.code,
      constraint: err.constraint,
      table: err.table,
    };
  } else if (ErrorClassifier.isJwtError(err)) {
    errorResponse = handleJwtError(err);
    logLevel = "warn";
  } else if (ErrorClassifier.isMulterError(err)) {
    errorResponse = handleMulterError(err);
    logLevel = "warn";
  } else if (ErrorClassifier.isJoiError(err)) {
    errorResponse = handleJoiError(err);
    logLevel = "warn";
  } else if (ErrorClassifier.isRateLimitError(err)) {
    errorResponse = {
      status: 429,
      response: {
        success: false,
        error: "Too Many Requests",
        message: "Please slow down and try again later.",
      },
    };
    logLevel = "warn";
  } else if (ErrorClassifier.isOperationalError(err)) {
    // Custom AppErrors
    errorResponse = {
      status: err.statusCode,
      response: {
        success: false,
        error: err.name?.replace(/Error$/, "") || "Error",
        message: err.message,
      },
    };
    logLevel = "warn";
  } else {
    // Unknown/unexpected errors
    errorResponse = {
      status: 500,
      response: {
        success: false,
        error: "Server Error",
        message:
          process.env.NODE_ENV === "production"
            ? "Something went wrong. Please try again later."
            : err.message,
      },
    };
    logLevel = "error";
    logMetadata = {
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      ...logMetadata,
    };
  }

  // Log with appropriate level
  const logFn = requestLogger[logLevel] || requestLogger.error;
  logFn(`${err.name || "Error"}: ${err.message}`, {
    name: err.name,
    statusCode: errorResponse.status,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    ...logMetadata,
  });

  // Send response
  res.status(errorResponse.status).json(errorResponse.response);
};

export default errorHandler;
