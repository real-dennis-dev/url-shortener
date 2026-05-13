/**
 * Base application error
 * All custom errors extend this class
 */
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 – Bad Request
 */
class BadRequestError extends AppError {
  constructor(message = "Bad request", code = "BAD_REQUEST") {
    super(message, 400, code);
  }
}

/**
 * 401 – Unauthorized
 */
class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

/**
 * 402 – Payment Required
 */
class PaymentRequiredError extends AppError {
  constructor(message = "Payment required", code = "PAYMENT_REQUIRED") {
    super(message, 402, code);
  }
}

/**
 * 403 – Forbidden
 */
class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code = "FORBIDDEN") {
    super(message, 403, code);
  }
}

/**
 * 404 – Not Found
 */
class NotFoundError extends AppError {
  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

/**
 * 408 – Request Timeout
 */
class RequestTimeoutError extends AppError {
  constructor(message = "Request timeout", code = "REQUEST_TIMEOUT") {
    super(message, 408, code);
  }
}

/**
 * 409 – Conflict
 */
class ConflictError extends AppError {
  constructor(message = "Conflict", code = "CONFLICT") {
    super(message, 409, code);
  }
}

/**
 * 413 – Payload Too Large
 */
class PayloadTooLargeError extends AppError {
  constructor(message = "Payload too large", code = "PAYLOAD_TOO_LARGE") {
    super(message, 413, code);
  }
}

/**
 * 415 – Unsupported Media Type
 */
class UnsupportedMediaTypeError extends AppError {
  constructor(
    message = "Unsupported media type",
    code = "UNSUPPORTED_MEDIA_TYPE"
  ) {
    super(message, 415, code);
  }
}

/**
 * 422 – Unprocessable Entity
 */
class UnprocessableEntityError extends AppError {
  constructor(message = "Unprocessable entity", code = "UNPROCESSABLE_ENTITY") {
    super(message, 422, code);
  }
}

/**
 * 429 – Too Many Requests
 */
class RateLimitError extends AppError {
  constructor(
    message = "Too many requests",
    retryAfter = 60,
    code = "RATE_LIMIT_EXCEEDED"
  ) {
    super(message, 429, code);
    this.retryAfter = retryAfter;
  }
}

/**
 * 500 – Internal Server Error
 */
class InternalServerError extends AppError {
  constructor(
    message = "Internal server error",
    code = "INTERNAL_SERVER_ERROR"
  ) {
    super(message, 500, code);
  }
}

/**
 * 503 – Service Unavailable
 */
class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable", code = "SERVICE_UNAVAILABLE") {
    super(message, 503, code);
  }
}

// Supabase / Database specific errors
class SupabaseError extends AppError {
  constructor(message, statusCode = 500, code = "SUPABASE_ERROR") {
    super(message, statusCode, code);
  }
}

class DatabaseError extends AppError {
  constructor(message = "Database operation failed", code = "DATABASE_ERROR") {
    super(message, 500, code);
  }
}

class DuplicateEntryError extends ConflictError {
  constructor(field, value) {
    super(`${field} '${value}' already exists.`, "DUPLICATE_ENTRY");
    this.field = field;
    this.value = value;
  }
}

class InvalidCredentialsError extends UnauthorizedError {
  constructor(message = "Invalid email or password") {
    super(message, "INVALID_CREDENTIALS");
  }
}

class EmailNotVerifiedError extends UnauthorizedError {
  constructor(message = "Please verify your email address before logging in") {
    super(message, "EMAIL_NOT_VERIFIED");
  }
}

// ========================
// EXPORTS (All in one place)
// ========================
export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  PaymentRequiredError,
  ForbiddenError,
  NotFoundError,
  RequestTimeoutError,
  ConflictError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  UnprocessableEntityError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  SupabaseError,
  DatabaseError,
  DuplicateEntryError,
  InvalidCredentialsError,
  EmailNotVerifiedError,
};
