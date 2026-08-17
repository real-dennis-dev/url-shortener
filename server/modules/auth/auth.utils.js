// auth.utils.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const validator = require("validator");
const AUTH_CONSTANTS = require("./auth.types.js");
const jwtConfig = require("../../config/jwt.config.js");

const authUtils = {
  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  hashPassword: async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  },

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Password match result
   */
  verifyPassword: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  },

  /**
   * Generate JWT token
   * @param {Object} payload - Token payload
   * @param {string} expiresIn - Expiration time
   * @returns {string} JWT token
   */
  generateJWT: (payload, expiresIn) => {
    const secret =
      expiresIn === jwtConfig.accessTokenExpires
        ? jwtConfig.accessTokenSecret
        : jwtConfig.refreshTokenSecret;
    return jwt.sign(payload, secret, { expiresIn });
  },

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @param {string} type - Token type (access/refresh)
   * @returns {Object} Decoded token payload
   */
  verifyJWT: (token, type = "access") => {
    const secret =
      type === "access"
        ? jwtConfig.accessTokenSecret
        : jwtConfig.refreshTokenSecret;
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error(`Invalid ${type} token: ${error.message}`);
    }
  },

  /**
   * Generate random token
   * @param {number} length - Token length
   * @returns {string} Random token
   */
  generateRandomToken: (length = 32) => {
    return crypto.randomBytes(length).toString("hex");
  },

  /**
   * Generate OTP
   * @param {number} length - OTP length
   * @returns {string} OTP
   */
  generateOTP: (length = 6) => {
    return crypto
      .randomInt(Math.pow(10, length - 1), Math.pow(10, length) - 1)
      .toString();
  },

  /**
   * Validate email format
   * @param {string} email - Email address
   * @returns {boolean} Email validity
   */
  validateEmail: (email) => {
    return validator.isEmail(email);
  },

  /**
   * Check password strength
   * @param {string} password - Password to check
   * @returns {Object} Password strength analysis
   */
  checkPasswordStrength: (password) => {
    let score = 0;
    const feedback = [];

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push("Password should be at least 8 characters");

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("Include at least one uppercase letter");

    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("Include at least one lowercase letter");

    // Number check
    if (/\d/.test(password)) score += 1;
    else feedback.push("Include at least one number");

    // Special character check
    if (/[@$!%*?&]/.test(password)) score += 1;
    else feedback.push("Include at least one special character (@$!%*?&)");

    // Common patterns check
    const commonPatterns = [
      "password",
      "123456",
      "qwerty",
      "admin",
      "letmein",
      "welcome",
    ];
    if (
      commonPatterns.some((pattern) => password.toLowerCase().includes(pattern))
    ) {
      score = Math.max(0, score - 1);
      feedback.push("Avoid common password patterns");
    }

    // Determine strength
    let strength = "weak";
    if (score >= 5) strength = "strong";
    else if (score >= 3) strength = "medium";

    return {
      score,
      strength,
      feedback: feedback.length > 0 ? feedback : ["Password is strong"],
    };
  },

  /**
   * Generate refresh token
   * @returns {string} Refresh token
   */
  generateRefreshToken: () => {
    return crypto.randomBytes(40).toString("hex");
  },

  /**
   * Generate session token
   * @returns {string} Session token
   */
  generateSessionToken: () => {
    return crypto.randomBytes(32).toString("hex");
  },

  /**
   * Generate API key
   * @returns {string} API key
   */
  generateApiKey: () => {
    const prefix = "url_";
    const random = crypto.randomBytes(24).toString("hex");
    return prefix + random;
  },

  /**
   * Mask sensitive data
   * @param {string} data - Data to mask
   * @param {number} visibleChars - Visible characters
   * @returns {string} Masked data
   */
  maskData: (data, visibleChars = 4) => {
    if (!data) return "";
    if (data.length <= visibleChars * 2) return data;
    const start = data.slice(0, visibleChars);
    const end = data.slice(-visibleChars);
    const masked = "*".repeat(data.length - visibleChars * 2);
    return start + masked + end;
  },

  /**
   * Set authentication cookies
   * @param {Object} res - Express response object
   * @param {Object} tokens - Token objects
   */
  setAuthCookies: (res, tokens) => {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    };

    if (tokens.accessToken) {
      res.cookie(AUTH_CONSTANTS.COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, {
        ...cookieOptions,
        maxAge: AUTH_CONSTANTS.COOKIE_OPTIONS.ACCESS_TOKEN_MAX_AGE,
      });
    }

    if (tokens.refreshToken) {
      res.cookie(
        AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN,
        tokens.refreshToken,
        {
          ...cookieOptions,
          maxAge: AUTH_CONSTANTS.COOKIE_OPTIONS.REFRESH_TOKEN_MAX_AGE,
        }
      );
    }

    if (tokens.sessionToken) {
      res.cookie(
        AUTH_CONSTANTS.COOKIE_NAMES.SESSION_TOKEN,
        tokens.sessionToken,
        {
          ...cookieOptions,
          maxAge: AUTH_CONSTANTS.COOKIE_OPTIONS.SESSION_TOKEN_MAX_AGE,
        }
      );
    }
  },

  /**
   * Clear authentication cookies
   * @param {Object} res - Express response object
   */
  clearAuthCookies: (res) => {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    };

    res.clearCookie(AUTH_CONSTANTS.COOKIE_NAMES.ACCESS_TOKEN, cookieOptions);
    res.clearCookie(AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN, cookieOptions);
    res.clearCookie(AUTH_CONSTANTS.COOKIE_NAMES.SESSION_TOKEN, cookieOptions);
  },

  /**
   * Extract tokens from cookies
   * @param {Object} req - Express request object
   * @returns {Object} Token objects
   */
  extractTokensFromCookies: (req) => {
    const accessToken = req.cookies[AUTH_CONSTANTS.COOKIE_NAMES.ACCESS_TOKEN];
    const refreshToken = req.cookies[AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN];
    const sessionToken = req.cookies[AUTH_CONSTANTS.COOKIE_NAMES.SESSION_TOKEN];

    return { accessToken, refreshToken, sessionToken };
  },

  /**
   * Extract token from authorization header
   * @param {Object} req - Express request object
   * @returns {string|null} Bearer token
   */
  extractBearerToken: (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7);
  },

  /**
   * Check if token is expired
   * @param {Object} decodedToken - Decoded JWT token
   * @returns {boolean} Token expired status
   */
  isTokenExpired: (decodedToken) => {
    if (!decodedToken || !decodedToken.exp) return true;
    return Date.now() >= decodedToken.exp * 1000;
  },
};

module.exports = authUtils;
