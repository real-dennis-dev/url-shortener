// src/utils/security.util.js
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { ApiError, ErrorCodes } = require("./error.util");

class SecurityUtil {
  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @param {number} rounds - Salt rounds
   * @returns {Promise<string>} - Hashed password
   */
  static async hashPassword(password, rounds = 10) {
    if (!password) {
      throw new ApiError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        "Password is required"
      );
    }
    return await bcrypt.hash(password, rounds);
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} - Password match
   */
  static async verifyPassword(password, hash) {
    if (!password || !hash) {
      return false;
    }
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate random token
   * @param {number} length - Token length in bytes
   * @param {string} encoding - Encoding type (hex, base64, etc.)
   * @returns {string} - Random token
   */
  static generateToken(length = 32, encoding = "hex") {
    return crypto.randomBytes(length).toString(encoding);
  }

  /**
   * Generate secure random string
   * @param {number} length - String length
   * @param {string} charset - Character set to use
   * @returns {string} - Random string
   */
  static generateSecureString(length = 32, charset = "alphanumeric") {
    const charsets = {
      alphanumeric:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      numeric: "0123456789",
      alphabetic: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      hex: "0123456789abcdef",
    };

    const chars = charsets[charset] || charsets.alphanumeric;
    const randomBytes = crypto.randomBytes(length);
    let result = "";

    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }

    return result;
  }

  /**
   * Generate API key
   * @returns {string} - API key
   */
  static generateApiKey() {
    const prefix = "sk_";
    const random = crypto.randomBytes(24).toString("base64url");
    return `${prefix}${random}`;
  }

  /**
   * Hash API key for storage
   * @param {string} apiKey - Plain API key
   * @returns {string} - Hashed API key
   */
  static hashApiKey(apiKey) {
    return crypto.createHash("sha256").update(apiKey).digest("hex");
  }

  /**
   * Validate email
   * @param {string} email - Email to validate
   * @returns {boolean} - Is valid email
   */
  static validateEmail(email) {
    return validator.isEmail(email);
  }

  /**
   * Validate URL
   * @param {string} url - URL to validate
   * @param {Object} options - Validation options
   * @returns {boolean} - Is valid URL
   */
  static validateUrl(url, options = {}) {
    return validator.isURL(url, {
      require_protocol: true,
      require_valid_protocol: true,
      protocols: ["http", "https"],
      ...options,
    });
  }

  /**
   * Sanitize input
   * @param {string} input - Input to sanitize
   * @param {string} type - Input type
   * @returns {string} - Sanitized input
   */
  static sanitizeInput(input, type = "string") {
    if (!input) return input;

    switch (type) {
      case "email":
        return validator.normalizeEmail(input);
      case "url":
        return validator.trim(input);
      case "html":
        return validator.escape(input);
      case "string":
      default:
        return validator.trim(validator.escape(input));
    }
  }

  /**
   * Encrypt data
   * @param {string} data - Data to encrypt
   * @param {string} key - Encryption key
   * @returns {string} - Encrypted data
   */
  static encrypt(data, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(key, "hex"),
      iv
    );
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return JSON.stringify({
      iv: iv.toString("hex"),
      data: encrypted,
      tag: authTag,
    });
  }

  /**
   * Decrypt data
   * @param {string} encryptedData - Encrypted data
   * @param {string} key - Encryption key
   * @returns {string} - Decrypted data
   */
  static decrypt(encryptedData, key) {
    const { iv, data, tag } = JSON.parse(encryptedData);
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(key, "hex"),
      Buffer.from(iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(tag, "hex"));
    let decrypted = decipher.update(data, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  /**
   * Generate CSRF token
   * @returns {string} - CSRF token
   */
  static generateCsrfToken() {
    return this.generateToken(32, "base64");
  }

  /**
   * Mask sensitive data
   * @param {string} data - Data to mask
   * @param {number} visibleStart - Visible characters at start
   * @param {number} visibleEnd - Visible characters at end
   * @param {string} maskChar - Mask character
   * @returns {string} - Masked data
   */
  static maskData(data, visibleStart = 4, visibleEnd = 4, maskChar = "*") {
    if (!data) return data;
    if (data.length <= visibleStart + visibleEnd) {
      return maskChar.repeat(data.length);
    }
    const start = data.slice(0, visibleStart);
    const end = data.slice(-visibleEnd);
    const middle = maskChar.repeat(data.length - visibleStart - visibleEnd);
    return `${start}${middle}${end}`;
  }

  /**
   * Check password strength
   * @param {string} password - Password to check
   * @returns {Object} - Strength assessment
   */
  static checkPasswordStrength(password) {
    let score = 0;
    const feedback = [];
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLong = password.length >= minLength;

    if (isLong) score += 1;
    else
      feedback.push(`Password should be at least ${minLength} characters long`);

    if (hasUpperCase) score += 1;
    else feedback.push("Include at least one uppercase letter");

    if (hasLowerCase) score += 1;
    else feedback.push("Include at least one lowercase letter");

    if (hasNumbers) score += 1;
    else feedback.push("Include at least one number");

    if (hasSpecial) score += 1;
    else feedback.push("Include at least one special character");

    const strength = {
      score,
      maxScore: 5,
      percentage: (score / 5) * 100,
      feedback: feedback,
      isStrong: score >= 4,
    };

    return strength;
  }

  /**
   * Generate OTP
   * @param {number} length - OTP length
   * @param {string} type - OTP type (numeric, alphanumeric)
   * @returns {string} - OTP
   */
  static generateOTP(length = 6, type = "numeric") {
    const chars =
      type === "numeric"
        ? "0123456789"
        : "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let otp = "";
    for (let i = 0; i < length; i++) {
      otp += chars[crypto.randomInt(0, chars.length)];
    }
    return otp;
  }

  /**
   * Verify JWT signature
   * @param {string} token - JWT token
   * @param {string} secret - Secret key
   * @returns {boolean} - Signature valid
   */
  static verifyJwtSignature(token, secret) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return false;

      const signature = crypto
        .createHmac("sha256", secret)
        .update(`${parts[0]}.${parts[1]}`)
        .digest("base64url");

      return signature === parts[2];
    } catch {
      return false;
    }
  }
}

module.exports = SecurityUtil;
