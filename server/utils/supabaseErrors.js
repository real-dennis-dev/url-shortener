// utils/supabaseErrors.js
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  InternalServerError,
  PaymentRequiredError,
  RequestTimeoutError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
} from "../errors/customErrors.js";

// Supabase Error Codes Mapping
export const SupabaseErrorCodes = {
  // Auth Errors
  AUTH_INVALID_CREDENTIALS: "invalid_credentials",
  AUTH_USER_NOT_FOUND: "user_not_found",
  AUTH_EMAIL_EXISTS: "email_exists",
  AUTH_WEAK_PASSWORD: "weak_password",
  AUTH_INVALID_EMAIL: "invalid_email",
  AUTH_TOO_MANY_REQUESTS: "too_many_requests",
  AUTH_SESSION_MISSING: "session_missing",
  AUTH_EXPIRED_TOKEN: "expired_token",
  AUTH_INVALID_REFRESH_TOKEN: "invalid_refresh_token",
  AUTH_REFRESH_TOKEN_EXPIRED: "refresh_token_expired",

  // PostgreSQL Errors
  PG_UNIQUE_VIOLATION: "23505",
  PG_FOREIGN_KEY_VIOLATION: "23503",
  PG_NOT_NULL_VIOLATION: "23502",
  PG_CHECK_VIOLATION: "23514",
  PG_INVALID_TEXT_REPRESENTATION: "22P02",
  PG_READ_ONLY_SQL: "25006",
  PG_CONNECTION_EXCEPTION: "08000",
  PG_CONNECTION_DOES_NOT_EXIST: "08003",
  PG_SQL_STATEMENT_NOT_YET_COMPLETE: "03000",
  PG_NUMERIC_VALUE_OUT_OF_RANGE: "22003",
  PG_DATETIME_FIELD_OVERFLOW: "22008",
  PG_DIVISION_BY_ZERO: "22012",
  PG_INSUFFICIENT_PRIVILEGE: "42501",
  PG_SYNTAX_ERROR: "42601",
  PG_UNDEFINED_COLUMN: "42703",
  PG_UNDEFINED_TABLE: "42P01",
  PG_UNDEFINED_FUNCTION: "42883",
  PG_UNDEFINED_OBJECT: "42704",

  // Supabase PGRST (PostgREST) Specific Errors
  SUPABASE_NOT_FOUND: "PGRST116", // JSON object requested, returns 0 rows
  SUPABASE_PARSE_ERROR: "PGRST103", // Parse error in query
  SUPABASE_RANGE_ERROR: "PGRST104", // Range error (invalid range header)
  SUPABASE_INVALID_FILTER: "PGRST105", // Invalid filter parameter
  SUPABASE_JSON_PARSE_ERROR: "PGRST106", // JSON parse error in body
  SUPABASE_MEDIA_TYPE_ERROR: "PGRST107", // Invalid media type
  SUPABASE_MULTIPART_ERROR: "PGRST108", // Multipart parse error
  SUPABASE_RATE_LIMIT: "PGRST109", // Rate limit exceeded
  SUPABASE_TIMEOUT: "PGRST110", // Request timeout
  SUPABASE_SERVER_ERROR: "PGRST111", // Server error
  SUPABASE_SCHEMA_CACHE_ERROR: "PGRST204", // Could not find column in schema cache
  SUPABASE_INVALID_JSON: "PGRST202", // Invalid JSON in request
  SUPABASE_FILTER_VIOLATION: "PGRST203", // Filter violation (RLS)
  SUPABASE_JWT_ERROR: "PGRST301", // JWT error
  SUPABASE_JWT_CLAIM_ERROR: "PGRST302", // JWT claim error
  SUPABASE_ROLE_CLAIM_ERROR: "PGRST303", // Role claim error
  SUPABASE_REQUEST_TOO_LARGE: "PGRST304", // Request too large
  SUPABASE_INVALID_SCHEMA: "PGRST305", // Invalid schema name
  SUPABASE_INVALID_TABLE: "PGRST306", // Invalid table name
  SUPABASE_GEOJSON_ERROR: "PGRST307", // GeoJSON error
  SUPABASE_UNSUPPORTED_MEDIA_TYPE: "PGRST308", // Unsupported media type for request
  SUPABASE_PLANNED_STATEMENT_ERROR: "PGRST309", // Planned statement error

  // Additional PGRST Auth Errors
  PGRST_JWT_AUDIENCE_CLAIM_ERROR: "PGRST301",
  PGRST_JWT_INVALID_SIGNATURE: "PGRST302",
  PGRST_JWT_MISSING_CLAIM: "PGRST303",

  // Storage Errors
  STORAGE_BUCKET_NOT_FOUND: "bucket_not_found",
  STORAGE_OBJECT_NOT_FOUND: "object_not_found",
  STORAGE_UNAUTHORIZED: "storage_unauthorized",
  STORAGE_UPLOAD_ERROR: "upload_error",
  STORAGE_DOWNLOAD_ERROR: "download_error",

  // Realtime Errors
  REALTIME_CONNECTION_ERROR: "realtime_connection_error",
  REALTIME_SUBSCRIPTION_ERROR: "realtime_subscription_error",
};

// Supabase Error Messages
export const SupabaseErrorMessageMap = {
  // Auth Errors
  [SupabaseErrorCodes.AUTH_INVALID_CREDENTIALS]: {
    status: 401,
    error: "Invalid Credentials",
    message: "Invalid email or password.",
  },
  [SupabaseErrorCodes.AUTH_USER_NOT_FOUND]: {
    status: 404,
    error: "User Not Found",
    message: "User not found.",
  },
  [SupabaseErrorCodes.AUTH_EMAIL_EXISTS]: {
    status: 409,
    error: "Email Already Exists",
    message: "This email is already registered.",
  },
  [SupabaseErrorCodes.AUTH_WEAK_PASSWORD]: {
    status: 400,
    error: "Weak Password",
    message: "Password is too weak. Please use a stronger password.",
  },
  [SupabaseErrorCodes.AUTH_INVALID_EMAIL]: {
    status: 400,
    error: "Invalid Email",
    message: "Please provide a valid email address.",
  },
  [SupabaseErrorCodes.AUTH_TOO_MANY_REQUESTS]: {
    status: 429,
    error: "Too Many Requests",
    message: "Too many requests. Please try again later.",
  },
  [SupabaseErrorCodes.AUTH_SESSION_MISSING]: {
    status: 401,
    error: "Session Missing",
    message: "No active session found.",
  },
  [SupabaseErrorCodes.AUTH_EXPIRED_TOKEN]: {
    status: 401,
    error: "Token Expired",
    message: "Your session has expired. Please log in again.",
  },
  [SupabaseErrorCodes.AUTH_INVALID_REFRESH_TOKEN]: {
    status: 401,
    error: "Invalid Refresh Token",
    message: "Invalid refresh token. Please log in again.",
  },
  [SupabaseErrorCodes.AUTH_REFRESH_TOKEN_EXPIRED]: {
    status: 401,
    error: "Refresh Token Expired",
    message: "Refresh token has expired. Please log in again.",
  },

  // PostgreSQL Errors
  [SupabaseErrorCodes.PG_UNIQUE_VIOLATION]: {
    status: 409,
    error: "Duplicate Entry",
    message: "This record already exists.",
  },
  [SupabaseErrorCodes.PG_FOREIGN_KEY_VIOLATION]: {
    status: 400,
    error: "Invalid Reference",
    message: "Referenced record does not exist.",
  },
  [SupabaseErrorCodes.PG_NOT_NULL_VIOLATION]: {
    status: 400,
    error: "Missing Required Field",
    message: "A required field is missing.",
  },
  [SupabaseErrorCodes.PG_CHECK_VIOLATION]: {
    status: 422,
    error: "Constraint Violation",
    message: "Data validation failed.",
  },
  [SupabaseErrorCodes.PG_INVALID_TEXT_REPRESENTATION]: {
    status: 400,
    error: "Invalid Data Format",
    message: "Invalid data format provided.",
  },
  [SupabaseErrorCodes.PG_NUMERIC_VALUE_OUT_OF_RANGE]: {
    status: 400,
    error: "Value Out of Range",
    message: "Numeric value is out of allowed range.",
  },
  [SupabaseErrorCodes.PG_DATETIME_FIELD_OVERFLOW]: {
    status: 400,
    error: "DateTime Overflow",
    message: "Date or time value is out of range.",
  },
  [SupabaseErrorCodes.PG_DIVISION_BY_ZERO]: {
    status: 400,
    error: "Division By Zero",
    message: "Cannot divide by zero.",
  },
  [SupabaseErrorCodes.PG_INSUFFICIENT_PRIVILEGE]: {
    status: 403,
    error: "Insufficient Privilege",
    message: "You don't have permission to perform this operation.",
  },
  [SupabaseErrorCodes.PG_SYNTAX_ERROR]: {
    status: 400,
    error: "SQL Syntax Error",
    message: "Invalid SQL syntax.",
  },
  [SupabaseErrorCodes.PG_UNDEFINED_COLUMN]: {
    status: 400,
    error: "Undefined Column",
    message: "The specified column does not exist in the table.",
  },
  [SupabaseErrorCodes.PG_UNDEFINED_TABLE]: {
    status: 404,
    error: "Undefined Table",
    message: "The specified table does not exist.",
  },
  [SupabaseErrorCodes.PG_UNDEFINED_FUNCTION]: {
    status: 400,
    error: "Undefined Function",
    message: "The specified function does not exist.",
  },
  [SupabaseErrorCodes.PG_UNDEFINED_OBJECT]: {
    status: 400,
    error: "Undefined Object",
    message: "The specified database object does not exist.",
  },

  // Supabase PGRST REST API Errors
  [SupabaseErrorCodes.SUPABASE_NOT_FOUND]: {
    status: 404,
    error: "Resource Not Found",
    message: "The requested resource was not found.",
  },
  [SupabaseErrorCodes.SUPABASE_PARSE_ERROR]: {
    status: 400,
    error: "Parse Error",
    message: "Invalid query syntax.",
  },
  [SupabaseErrorCodes.SUPABASE_RANGE_ERROR]: {
    status: 400,
    error: "Range Error",
    message: "Invalid range parameters in request.",
  },
  [SupabaseErrorCodes.SUPABASE_INVALID_FILTER]: {
    status: 400,
    error: "Invalid Filter",
    message: "Invalid filter parameter.",
  },
  [SupabaseErrorCodes.SUPABASE_JSON_PARSE_ERROR]: {
    status: 400,
    error: "JSON Parse Error",
    message: "Invalid JSON format in request body.",
  },
  [SupabaseErrorCodes.SUPABASE_MEDIA_TYPE_ERROR]: {
    status: 415,
    error: "Unsupported Media Type",
    message: "Content-Type header is invalid.",
  },
  [SupabaseErrorCodes.SUPABASE_MULTIPART_ERROR]: {
    status: 400,
    error: "Multipart Error",
    message: "Error parsing multipart request.",
  },
  [SupabaseErrorCodes.SUPABASE_RATE_LIMIT]: {
    status: 429,
    error: "Rate Limit Exceeded",
    message: "Rate limit exceeded. Please try again later.",
  },
  [SupabaseErrorCodes.SUPABASE_TIMEOUT]: {
    status: 504,
    error: "Gateway Timeout",
    message: "Request timed out. Please try again.",
  },
  [SupabaseErrorCodes.SUPABASE_SERVER_ERROR]: {
    status: 500,
    error: "Database Error",
    message: "An unexpected database error occurred.",
  },
  [SupabaseErrorCodes.SUPABASE_SCHEMA_CACHE_ERROR]: {
    status: 400,
    error: "Schema Cache Error",
    message: "The specified column does not exist in the table schema.",
  },
  [SupabaseErrorCodes.SUPABASE_INVALID_JSON]: {
    status: 400,
    error: "Invalid JSON",
    message: "The request body contains invalid JSON.",
  },
  [SupabaseErrorCodes.SUPABASE_FILTER_VIOLATION]: {
    status: 403,
    error: "Filter Violation",
    message: "The request violates row level security policies.",
  },
  [SupabaseErrorCodes.SUPABASE_JWT_ERROR]: {
    status: 401,
    error: "JWT Error",
    message: "Invalid authentication token.",
  },
  [SupabaseErrorCodes.SUPABASE_JWT_CLAIM_ERROR]: {
    status: 401,
    error: "JWT Claim Error",
    message: "Invalid or missing JWT claims.",
  },
  [SupabaseErrorCodes.SUPABASE_ROLE_CLAIM_ERROR]: {
    status: 403,
    error: "Role Claim Error",
    message: "Invalid role claim in authentication token.",
  },
  [SupabaseErrorCodes.SUPABASE_REQUEST_TOO_LARGE]: {
    status: 413,
    error: "Request Too Large",
    message: "The request exceeds the maximum allowed size.",
  },
  [SupabaseErrorCodes.SUPABASE_INVALID_SCHEMA]: {
    status: 400,
    error: "Invalid Schema",
    message: "The specified schema does not exist or is invalid.",
  },
  [SupabaseErrorCodes.SUPABASE_INVALID_TABLE]: {
    status: 404,
    error: "Invalid Table",
    message: "The specified table does not exist.",
  },
  [SupabaseErrorCodes.SUPABASE_GEOJSON_ERROR]: {
    status: 400,
    error: "GeoJSON Error",
    message: "Invalid GeoJSON format.",
  },
  [SupabaseErrorCodes.SUPABASE_UNSUPPORTED_MEDIA_TYPE]: {
    status: 415,
    error: "Unsupported Media Type",
    message: "Unsupported media type in request.",
  },
  [SupabaseErrorCodes.SUPABASE_PLANNED_STATEMENT_ERROR]: {
    status: 400,
    error: "Planned Statement Error",
    message: "Error in prepared statement.",
  },

  // Storage Errors
  [SupabaseErrorCodes.STORAGE_BUCKET_NOT_FOUND]: {
    status: 404,
    error: "Bucket Not Found",
    message: "The specified storage bucket does not exist.",
  },
  [SupabaseErrorCodes.STORAGE_OBJECT_NOT_FOUND]: {
    status: 404,
    error: "Object Not Found",
    message: "The requested storage object was not found.",
  },
  [SupabaseErrorCodes.STORAGE_UNAUTHORIZED]: {
    status: 401,
    error: "Storage Unauthorized",
    message: "Unauthorized access to storage bucket.",
  },
  [SupabaseErrorCodes.STORAGE_UPLOAD_ERROR]: {
    status: 500,
    error: "Upload Error",
    message: "Failed to upload file to storage.",
  },
  [SupabaseErrorCodes.STORAGE_DOWNLOAD_ERROR]: {
    status: 500,
    error: "Download Error",
    message: "Failed to download file from storage.",
  },

  // Realtime Errors
  [SupabaseErrorCodes.REALTIME_CONNECTION_ERROR]: {
    status: 500,
    error: "Realtime Connection Error",
    message: "Failed to establish realtime connection.",
  },
  [SupabaseErrorCodes.REALTIME_SUBSCRIPTION_ERROR]: {
    status: 500,
    error: "Subscription Error",
    message: "Failed to subscribe to realtime channel.",
  },
};

// Check if error is a Supabase error
export const isSupabaseError = (err) => {
  // Check for Supabase error structure
  if (!err) return false;

  // Check by error code
  if (err.code && Object.values(SupabaseErrorCodes).includes(err.code)) {
    return true;
  }

  // Check PGRST pattern (PGRSTxxx where xxx are numbers)
  if (
    err.code &&
    typeof err.code === "string" &&
    err.code.match(/^PGRST\d{3}$/)
  ) {
    return true;
  }

  // Check PostgreSQL error code pattern (5 digits)
  if (err.code && typeof err.code === "string" && err.code.match(/^\d{5}$/)) {
    return true;
  }

  // Check Supabase specific structure
  if (err.message?.includes("supabase") || err.message?.includes("Supabase")) {
    return true;
  }

  // Check for Supabase REST error structure
  if (
    err.statusCode === 400 ||
    err.statusCode === 401 ||
    err.statusCode === 403 ||
    err.statusCode === 404 ||
    err.statusCode === 409 ||
    err.statusCode === 429 ||
    err.statusCode === 500 ||
    err.statusCode === 504
  ) {
    if (
      err.message &&
      (err.message.includes("row-level security") ||
        err.message.includes("JWT") ||
        err.message.includes("auth") ||
        err.message.includes("schema cache") ||
        err.message.includes("column") ||
        err.message.includes("relation"))
    ) {
      return true;
    }
  }

  return false;
};

// Get Supabase error response
export const getSupabaseErrorResponse = (err) => {
  // Try to map by code first
  let mapped = SupabaseErrorMessageMap[err.code];

  // If not found, try to infer from message patterns
  if (!mapped) {
    if (
      err.message?.toLowerCase().includes("schema cache") ||
      err.message?.toLowerCase().includes("could not find the column")
    ) {
      mapped =
        SupabaseErrorMessageMap[SupabaseErrorCodes.SUPABASE_SCHEMA_CACHE_ERROR];
    } else if (
      err.message?.toLowerCase().includes("email") &&
      err.message?.toLowerCase().includes("already")
    ) {
      mapped = SupabaseErrorMessageMap[SupabaseErrorCodes.AUTH_EMAIL_EXISTS];
    } else if (err.message?.toLowerCase().includes("duplicate")) {
      mapped = SupabaseErrorMessageMap[SupabaseErrorCodes.PG_UNIQUE_VIOLATION];
    } else if (err.message?.toLowerCase().includes("foreign key")) {
      mapped =
        SupabaseErrorMessageMap[SupabaseErrorCodes.PG_FOREIGN_KEY_VIOLATION];
    } else if (err.message?.toLowerCase().includes("not null")) {
      mapped =
        SupabaseErrorMessageMap[SupabaseErrorCodes.PG_NOT_NULL_VIOLATION];
    } else if (err.message?.toLowerCase().includes("invalid credentials")) {
      mapped =
        SupabaseErrorMessageMap[SupabaseErrorCodes.AUTH_INVALID_CREDENTIALS];
    } else if (err.message?.toLowerCase().includes("not found")) {
      mapped = SupabaseErrorMessageMap[SupabaseErrorCodes.SUPABASE_NOT_FOUND];
    } else if (err.message?.toLowerCase().includes("rate limit")) {
      mapped = SupabaseErrorMessageMap[SupabaseErrorCodes.SUPABASE_RATE_LIMIT];
    } else if (err.message?.toLowerCase().includes("timeout")) {
      mapped = SupabaseErrorMessageMap[SupabaseErrorCodes.SUPABASE_TIMEOUT];
    } else if (err.message?.toLowerCase().includes("jwt")) {
      mapped = SupabaseErrorMessageMap[SupabaseErrorCodes.SUPABASE_JWT_ERROR];
    } else if (err.message?.toLowerCase().includes("row-level security")) {
      mapped =
        SupabaseErrorMessageMap[SupabaseErrorCodes.SUPABASE_FILTER_VIOLATION];
    } else if (
      err.message?.toLowerCase().includes("column") &&
      err.message?.toLowerCase().includes("exist")
    ) {
      mapped = SupabaseErrorMessageMap[SupabaseErrorCodes.PG_UNDEFINED_COLUMN];
    } else if (
      err.message?.toLowerCase().includes("relation") &&
      err.message?.toLowerCase().includes("exist")
    ) {
      mapped = SupabaseErrorMessageMap[SupabaseErrorCodes.PG_UNDEFINED_TABLE];
    }
  }

  if (mapped) {
    return {
      status: mapped.status,
      response: {
        success: false,
        error: mapped.error,
        message: mapped.message,
        code: err.code,
        ...(err.details && { details: err.details }),
        ...(err.hint && { hint: err.hint }),
        ...(process.env.NODE_ENV !== "production" && {
          raw_message: err.message,
          schema: err.schema,
          table: err.table,
          column: err.column,
        }),
      },
    };
  }

  // Default Supabase error fallback
  return {
    status: err.statusCode || err.status || 500,
    response: {
      success: false,
      error: "Database Error",
      details: err.details,
      message: err.message || "An error occurred with the database operation.",
      code: err.code || "unknown",
      ...(process.env.NODE_ENV !== "production" && { details: err.details }),
    },
  };
};

// Convert Supabase error to custom error class
export const convertSupabaseError = (err) => {
  // Auth errors
  if (err.code === SupabaseErrorCodes.AUTH_INVALID_CREDENTIALS) {
    return new UnauthorizedError("Invalid email or password.");
  }

  if (err.code === SupabaseErrorCodes.AUTH_USER_NOT_FOUND) {
    return new NotFoundError("User not found.");
  }

  if (err.code === SupabaseErrorCodes.AUTH_EMAIL_EXISTS) {
    return new ConflictError("Email already registered.");
  }

  if (err.code === SupabaseErrorCodes.AUTH_SESSION_MISSING) {
    return new UnauthorizedError("No active session found.");
  }

  if (err.code === SupabaseErrorCodes.AUTH_EXPIRED_TOKEN) {
    return new UnauthorizedError(
      "Your session has expired. Please log in again."
    );
  }

  if (err.code === SupabaseErrorCodes.AUTH_INVALID_REFRESH_TOKEN) {
    return new UnauthorizedError("Invalid refresh token. Please log in again.");
  }

  if (err.code === SupabaseErrorCodes.AUTH_REFRESH_TOKEN_EXPIRED) {
    return new UnauthorizedError("Refresh token expired. Please log in again.");
  }

  // JWT Errors
  if (
    err.code === SupabaseErrorCodes.SUPABASE_JWT_ERROR ||
    err.code === SupabaseErrorCodes.SUPABASE_JWT_CLAIM_ERROR
  ) {
    return new UnauthorizedError("Invalid or expired authentication token.");
  }

  // Role/Policy Errors
  if (
    err.code === SupabaseErrorCodes.SUPABASE_ROLE_CLAIM_ERROR ||
    err.code === SupabaseErrorCodes.SUPABASE_FILTER_VIOLATION
  ) {
    return new ForbiddenError(
      "You don't have permission to perform this operation."
    );
  }

  // Database errors
  if (err.code === SupabaseErrorCodes.PG_UNIQUE_VIOLATION) {
    // Try to extract which field caused the violation
    const field = err.details?.match(/\((.*?)\)/)?.[1] || "record";
    return new ConflictError(`${field} already exists.`);
  }

  if (err.code === SupabaseErrorCodes.PG_FOREIGN_KEY_VIOLATION) {
    return new BadRequestError("Invalid reference to non-existent resource.");
  }

  if (err.code === SupabaseErrorCodes.PG_NOT_NULL_VIOLATION) {
    const field = err.details?.match(/\((.*?)\)/)?.[1] || "field";
    return new BadRequestError(`${field} is required.`);
  }

  if (err.code === SupabaseErrorCodes.PG_INSUFFICIENT_PRIVILEGE) {
    return new ForbiddenError(
      "Insufficient privileges to perform this operation."
    );
  }

  if (err.code === SupabaseErrorCodes.PG_UNDEFINED_COLUMN) {
    const column =
      err.message?.match(/column "(.+?)" of relation/)?.[1] || "column";
    return new BadRequestError(
      `The column '${column}' does not exist in the table.`
    );
  }

  if (err.code === SupabaseErrorCodes.PG_UNDEFINED_TABLE) {
    const table =
      err.message?.match(/relation "(.+?)" does not exist/)?.[1] || "table";
    return new NotFoundError(`The table '${table}' does not exist.`);
  }

  // Supabase specific
  if (err.code === SupabaseErrorCodes.SUPABASE_NOT_FOUND) {
    return new NotFoundError("The requested resource was not found.");
  }

  if (err.code === SupabaseErrorCodes.SUPABASE_SCHEMA_CACHE_ERROR) {
    const columnMatch = err.message?.match(/column '(.+?)'/);
    const column = columnMatch ? columnMatch[1] : "specified column";
    return new BadRequestError(
      `The column '${column}' does not exist in the table schema. Please check your query.`
    );
  }

  if (err.code === SupabaseErrorCodes.SUPABASE_RATE_LIMIT) {
    const rateLimitError = new Error(
      "Too many requests. Please try again later."
    );
    rateLimitError.status = 429;
    rateLimitError.name = "RateLimitError";
    return rateLimitError;
  }

  if (err.code === SupabaseErrorCodes.SUPABASE_TIMEOUT) {
    return new RequestTimeoutError(
      "Database request timed out. Please try again."
    );
  }

  if (err.code === SupabaseErrorCodes.SUPABASE_INVALID_FILTER) {
    return new BadRequestError("Invalid filter parameter provided.");
  }

  if (err.code === SupabaseErrorCodes.SUPABASE_JSON_PARSE_ERROR) {
    return new BadRequestError("Invalid JSON format in request body.");
  }

  if (
    err.code === SupabaseErrorCodes.SUPABASE_MEDIA_TYPE_ERROR ||
    err.code === SupabaseErrorCodes.SUPABASE_UNSUPPORTED_MEDIA_TYPE
  ) {
    return new UnsupportedMediaTypeError("Unsupported media type in request.");
  }

  if (err.code === SupabaseErrorCodes.SUPABASE_REQUEST_TOO_LARGE) {
    return new PayloadTooLargeError("Request payload too large.");
  }

  // Storage errors
  if (err.code === SupabaseErrorCodes.STORAGE_BUCKET_NOT_FOUND) {
    return new NotFoundError("Storage bucket not found.");
  }

  if (err.code === SupabaseErrorCodes.STORAGE_OBJECT_NOT_FOUND) {
    return new NotFoundError("Storage object not found.");
  }

  if (err.code === SupabaseErrorCodes.STORAGE_UNAUTHORIZED) {
    return new UnauthorizedError("Unauthorized access to storage.");
  }

  // Default - keep original error but add helpful context
  if (!(err instanceof Error)) {
    const newErr = new Error(err.message || "Database error occurred");
    newErr.code = err.code;
    newErr.details = err.details;
    newErr.hint = err.hint;
    return newErr;
  }

  return err;
};

// Extract useful info from Supabase error for logging
export const extractSupabaseErrorInfo = (err) => {
  return {
    code: err.code,
    message: err.message,
    details: err.details,
    hint: err.hint,
    statusCode: err.statusCode || err.status,
    method: err.method,
    path: err.path,
    schema: err.schema,
    table: err.table,
    column: err.column,
    line: err.line,
    position: err.position,
  };
};
