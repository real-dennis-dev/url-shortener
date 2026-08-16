// auth.types.js
/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} email - User email
 * @property {string} full_name - User full name
 * @property {string} role - User role
 * @property {string} plan - User plan
 * @property {string} status - User status
 * @property {boolean} email_verified - Email verification status
 */

/**
 * @typedef {Object} Tokens
 * @property {string} accessToken - JWT access token
 * @property {string} refreshToken - JWT refresh token
 * @property {string} sessionToken - Session token
 */

/**
 * @typedef {Object} Session
 * @property {string} id - Session ID
 * @property {number} user_id - User ID
 * @property {string} session_token - Session token
 * @property {string} user_agent - User agent
 * @property {string} ip_address - IP address
 * @property {string} location - Location
 * @property {boolean} is_active - Is session active
 * @property {Date} expires_at - Expiration time
 * @property {Date} last_activity - Last activity time
 * @property {Date} created_at - Creation time
 */

const AUTH_CONSTANTS = {
  TOKEN_TYPES: {
    ACCESS: "access",
    REFRESH: "refresh",
    SESSION: "session",
  },
  COOKIE_NAMES: {
    ACCESS_TOKEN: "access_token",
    REFRESH_TOKEN: "refresh_token",
    SESSION_TOKEN: "session_token",
  },
  COOKIE_OPTIONS: {
    HTTP_ONLY: true,
    SECURE: process.env.NODE_ENV === "production",
    SAME_SITE: "strict",
    ACCESS_TOKEN_MAX_AGE: 15 * 60 * 1000, // 15 minutes
    REFRESH_TOKEN_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
    SESSION_TOKEN_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  },
  ROLES: {
    USER: "user",
    ADMIN: "admin",
    MODERATOR: "moderator",
    SUPPORT: "support",
  },
  PLANS: {
    FREE: "free",
    PRO: "pro",
    BUSINESS: "business",
    ENTERPRISE: "enterprise",
  },
  STATUS: {
    ACTIVE: "active",
    SUSPENDED: "suspended",
    BANNED: "banned",
    PENDING_VERIFICATION: "pending_verification",
  },
};

module.exports = AUTH_CONSTANTS;
