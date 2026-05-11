/**
 * Base application error
 * All custom errors extend this class
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 – Bad Request
 */
class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, 400);
  }
}

/**
 * 401 – Unauthorized
 */
class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

/**
 * 402 – Payment Required
 */
class PaymentRequiredError extends AppError {
  constructor(message = "Payment required") {
    super(message, 402);
  }
}

/**
 * 403 – Forbidden
 */
class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

/**
 * 404 – Not Found
 */
class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

/**
 * 408 – Request Timeout
 */
class RequestTimeoutError extends AppError {
  constructor(message = "Request timeout") {
    super(message, 408);
  }
}

/**
 * 409 – Conflict
 */
class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

/**
 * 413 – Payload Too Large
 */
class PayloadTooLargeError extends AppError {
  constructor(message = "Payload too large") {
    super(message, 413);
  }
}

/**
 * 415 – Unsupported Media Type
 */
class UnsupportedMediaTypeError extends AppError {
  constructor(message = "Unsupported media type") {
    super(message, 415);
  }
}

/**
 * 422 – Unprocessable Entity
 */
class UnprocessableEntityError extends AppError {
  constructor(message = "Unprocessable entity") {
    super(message, 422);
  }
}

/**
 * 500 – Internal Server Error
 */
class InternalServerError extends AppError {
  constructor(message = "Internal server error") {
    super(message, 500);
  }
}

export {
  InternalServerError,
  UnprocessableEntityError,
  UnsupportedMediaTypeError,
  PayloadTooLargeError,
  RequestTimeoutError,
  PaymentRequiredError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  BadRequestError,
};
