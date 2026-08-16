// src/config/jwt.config.js
const dotenv = require("dotenv");
dotenv.config();

/**
 * JWT Configuration
 * Secrets and expiration times for access & refresh tokens
 */
const jwtConfig = {
  // Access token
  accessTokenSecret:
    process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_SECRET ||
    "your-super-secret-access-key-change-in-production",
  accessTokenExpires: process.env.JWT_ACCESS_EXPIRES || "15m", // e.g. 15m, 1h

  // Refresh token
  refreshTokenSecret:
    process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_SECRET ||
    "your-super-secret-refresh-key-change-in-production",
  refreshTokenExpires: process.env.JWT_REFRESH_EXPIRES || "7d", // e.g. 7d, 30d

  // Optional extras (if you use them elsewhere)
  issuer: process.env.JWT_ISSUER || "your-app-name",
  audience: process.env.JWT_AUDIENCE || "your-app-users",
};

// Fail fast in production if secrets are missing/weak
if (process.env.NODE_ENV === "production") {
  if (
    !process.env.JWT_ACCESS_SECRET ||
    !process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_ACCESS_SECRET.length < 32 ||
    process.env.JWT_REFRESH_SECRET.length < 32
  ) {
    throw new Error(
      "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set and at least 32 characters in production"
    );
  }
}

module.exports = jwtConfig;
