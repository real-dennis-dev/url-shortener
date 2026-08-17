// auth.service.js
const { AUTH_CONSTANTS } = require("./auth.types.js");
const authUtils = require("./auth.utils.js");
const DatabaseService = require("../../services/database.service.js");
const CacheService = require("../../services/cache.service.js");
const EmailService = require("../../services/email.service.js");
const SessionService = require("./session.service.js");
const jwtConfig = require("../../config/jwt.config.js");

const databaseService = new DatabaseService();
const cacheService = new CacheService();
const emailService = new EmailService();
const sessionService = new SessionService();

class AuthService {
  /**
   * Register new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} fullName - User full name
   * @param {string} plan - User plan
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Registration result
   */
  async register(email, password, fullName, plan = "free", options = {}) {
    try {
      // Validate email
      if (!authUtils.validateEmail(email)) {
        throw new Error("Invalid email format");
      }

      // Check if user exists
      const existingUser = await databaseService.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error("User already exists with this email");
      }

      // Check password strength
      const strengthCheck = authUtils.checkPasswordStrength(password);
      if (strengthCheck.strength === "weak") {
        throw new Error(
          "Password is too weak: " + strengthCheck.feedback.join(". ")
        );
      }

      // Hash password
      const hashedPassword = await authUtils.hashPassword(password);

      // Generate verification token
      const verificationToken = authUtils.generateRandomToken(32);
      const verificationExpires = new Date();
      verificationExpires.setHours(verificationExpires.getHours() + 24);

      // Generate API key
      const apiKey = authUtils.generateApiKey();

      // Create user
      const result = await databaseService.query(
        `INSERT INTO users 
         (email, password_hash, full_name, plan, api_key, 
          email_verification_token, email_verification_expires)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, full_name, plan, role, email_verified, api_key, created_at`,
        [
          email,
          hashedPassword,
          fullName,
          plan,
          apiKey,
          verificationToken,
          verificationExpires,
        ]
      );

      const user = result.rows[0];

      // Send verification email
      // await emailService.sendVerificationEmail(
      //   user.id,
      //   user.email,
      //   verificationToken
      // );

      // Generate tokens
      const tokens = await this.generateTokens(user.id);

      // Create session
      const session = await sessionService.createSession(
        user.id,
        options.ip,
        options.userAgent,
        options.rememberMe
      );

      // Cache user data
      // await cacheService.set(
      //   `user:${user.id}`,
      //   user,
      //   3600 // 1 hour
      // );

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          plan: user.plan,
          role: user.role,
          status: user.status,
          emailVerified: user.email_verified,
          apiKey: user.api_key,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          sessionToken: session.session_token,
        },
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} options - Login options
   * @returns {Promise<Object>} Login result
   */
  async login(email, password, options = {}) {
    try {
      // Get user
      const userResult = await databaseService.query(
        `SELECT id, email, password_hash, full_name, role, plan, status, 
                email_verified, api_key, login_attempts
         FROM users WHERE email = $1`,
        [email]
      );

      if (userResult.rows.length === 0) {
        // Generic message for security
        throw new Error("Invalid credentials");
      }

      const user = userResult.rows[0];

      // Check if account is locked (too many failed attempts)
      if (user.login_attempts >= 5) {
        throw new Error(
          "Account locked due to too many failed attempts. Please reset your password."
        );
      }

      // Verify password
      const isPasswordValid = await authUtils.verifyPassword(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        // Increment login attempts
        await databaseService.query(
          "UPDATE users SET login_attempts = login_attempts + 1 WHERE id = $1",
          [user.id]
        );
        throw new Error("Invalid credentials");
      }

      // Check account status
      if (user.status !== AUTH_CONSTANTS.STATUS.ACTIVE) {
        throw new Error(`Account is ${user.status}. Please contact support.`);
      }

      // Reset login attempts and update last login
      await databaseService.query(
        `UPDATE users 
         SET login_attempts = 0, 
             last_login = NOW(), 
             is_online = true,
             updated_at = NOW()
         WHERE id = $1`,
        [user.id]
      );

      // Generate tokens
      const tokens = await this.generateTokens(user.id);

      // Create session
      const session = await sessionService.createSession(
        user.id,
        options.ip,
        options.userAgent,
        options.rememberMe
      );

      // Cache user data
      // await cacheService.set(
      //   `user:${user.id}`,
      //   user,
      //   3600 // 1 hour
      // );

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          plan: user.plan,
          status: user.status,
          emailVerified: user.email_verified,
          apiKey: user.api_key,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          sessionToken: session.session_token,
        },
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Generate tokens
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Tokens
   */
  async generateTokens(userId) {
    try {
      const payload = { id: userId };

      const accessToken = authUtils.generateJWT(
        payload,
        jwtConfig.accessTokenExpires
      );

      const refreshToken = authUtils.generateRefreshToken();

      // Store refresh token in database
      await databaseService.query(
        `INSERT INTO user_tokens (user_id, refresh_token, expires_at, created_at)
         VALUES ($1, $2, NOW() + INTERVAL '7 days', NOW())`,
        [userId, refreshToken]
      );

      return { accessToken, refreshToken };
    } catch (error) {
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  /**
   * Refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      // Check if refresh token exists and is valid
      const tokenResult = await databaseService.query(
        `SELECT user_id, expires_at, revoked
         FROM user_tokens 
         WHERE refresh_token = $1 AND revoked = false`,
        [refreshToken]
      );

      if (tokenResult.rows.length === 0) {
        throw new Error("Invalid refresh token");
      }

      const tokenData = tokenResult.rows[0];

      // Check if token is expired
      if (new Date(tokenData.expires_at) < new Date()) {
        await databaseService.query(
          "UPDATE user_tokens SET revoked = true WHERE refresh_token = $1",
          [refreshToken]
        );
        throw new Error("Refresh token has expired");
      }

      // Revoke old token
      await databaseService.query(
        "UPDATE user_tokens SET revoked = true WHERE refresh_token = $1",
        [refreshToken]
      );

      // Generate new tokens
      const tokens = await this.generateTokens(tokenData.user_id);

      // Get user info
      const user = await this.getUserById(tokenData.user_id);

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          plan: user.plan,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Verify email
   * @param {string} token - Verification token
   * @returns {Promise<Object>} Verification result
   */
  async verifyEmail(token) {
    try {
      const result = await databaseService.query(
        `UPDATE users 
         SET email_verified = true, 
             email_verification_token = NULL,
             status = $1,
             updated_at = NOW()
         WHERE email_verification_token = $2 
         AND email_verification_expires > NOW()
         RETURNING id, email`,
        [AUTH_CONSTANTS.STATUS.ACTIVE, token]
      );

      if (result.rows.length === 0) {
        throw new Error("Invalid or expired verification token");
      }

      // Send welcome email
      await emailService.sendWelcomeEmail(
        result.rows[0].email,
        result.rows[0].full_name || "User"
      );

      return {
        success: true,
        message: "Email verified successfully",
        user: result.rows[0],
      };
    } catch (error) {
      throw new Error(`Email verification failed: ${error.message}`);
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Password reset request result
   */
  async requestPasswordReset(email) {
    try {
      // Check if user exists
      const userResult = await databaseService.query(
        "SELECT id, email FROM users WHERE email = $1",
        [email]
      );

      if (userResult.rows.length === 0) {
        // Don't reveal if user exists for security
        return {
          success: true,
          message:
            "If an account exists with this email, a reset link has been sent.",
        };
      }

      const user = userResult.rows[0];

      // Generate reset token
      const resetToken = authUtils.generateRandomToken(32);
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1);

      // Save reset token
      await databaseService.query(
        `UPDATE users 
         SET reset_password_token = $1, 
             reset_password_expires = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [resetToken, resetExpires, user.id]
      );

      // Send reset email
      await emailService.sendPasswordResetEmail(user.email, resetToken);

      return {
        success: true,
        message:
          "If an account exists with this email, a reset link has been sent.",
      };
    } catch (error) {
      throw new Error(`Password reset request failed: ${error.message}`);
    }
  }

  /**
   * Reset password
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Password reset result
   */
  async resetPassword(token, newPassword) {
    try {
      // Check password strength
      const strengthCheck = authUtils.checkPasswordStrength(newPassword);
      if (strengthCheck.strength === "weak") {
        throw new Error(
          "Password is too weak: " + strengthCheck.feedback.join(". ")
        );
      }

      // Hash new password
      const hashedPassword = await authUtils.hashPassword(newPassword);

      // Update password
      const result = await databaseService.query(
        `UPDATE users 
         SET password_hash = $1, 
             reset_password_token = NULL,
             reset_password_expires = NULL,
             login_attempts = 0,
             updated_at = NOW()
         WHERE reset_password_token = $2 
         AND reset_password_expires > NOW()
         RETURNING id, email`,
        [hashedPassword, token]
      );

      if (result.rows.length === 0) {
        throw new Error("Invalid or expired reset token");
      }

      // Revoke all sessions and tokens
      await databaseService.query(
        "UPDATE user_tokens SET revoked = true WHERE user_id = $1",
        [result.rows[0].id]
      );

      return {
        success: true,
        message: "Password reset successfully",
        userId: result.rows[0].id,
      };
    } catch (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  /**
   * Logout user
   * @param {number} userId - User ID
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} Logout result
   */
  async logout(userId, refreshToken) {
    try {
      // Revoke refresh token
      if (refreshToken) {
        await databaseService.query(
          "UPDATE user_tokens SET revoked = true WHERE refresh_token = $1",
          [refreshToken]
        );
      }

      // Revoke all sessions for user
      await databaseService.query(
        "UPDATE user_sessions SET is_active = false WHERE user_id = $1",
        [userId]
      );

      // Update user status
      await databaseService.query(
        "UPDATE users SET is_online = false, last_logout = NOW() WHERE id = $1",
        [userId]
      );

      // Clear cache
      await cacheService.delete(`user:${userId}`);

      return {
        success: true,
        message: "Logged out successfully",
      };
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId) {
    try {
      // Try cache first
      const cachedUser = await cacheService.get(`user:${userId}`);
      if (cachedUser) {
        return cachedUser;
      }

      const result = await databaseService.query(
        `SELECT id, email, full_name, role, plan, status, 
                email_verified, api_key, quota_limit, total_clicks,
                last_login, created_at, updated_at
         FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      // Cache user
      await cacheService.set(`user:${userId}`, result.rows[0], 3600);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Get user failed: ${error.message}`);
    }
  }

  /**
   * Validate API key
   * @param {string} apiKey - API key
   * @returns {Promise<Object>} User object
   */
  async validateApiKey(apiKey) {
    try {
      const result = await databaseService.query(
        `SELECT id, email, full_name, role, plan, status, api_key
         FROM users 
         WHERE api_key = $1 AND status = $2`,
        [apiKey, AUTH_CONSTANTS.STATUS.ACTIVE]
      );

      if (result.rows.length === 0) {
        return null;
      }

      // Update API usage
      await databaseService.query(
        "UPDATE users SET updated_at = NOW() WHERE id = $1",
        [result.rows[0].id]
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(`API key validation failed: ${error.message}`);
    }
  }

  /**
   * Log API usage
   * @param {string} apiKey - API key
   * @param {Object} req - Request object
   * @returns {Promise<void>}
   */
  async logApiUsage(apiKey, req) {
    try {
      await databaseService.query(
        `INSERT INTO api_logs 
         (api_key, endpoint, method, ip_address, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          apiKey,
          req.path,
          req.method,
          req.ip || req.connection.remoteAddress,
          req.headers["user-agent"],
        ]
      );
    } catch (error) {
      // Log error but don't fail the request
      console.error("Failed to log API usage:", error);
    }
  }

  /**
   * Regenerate API key
   * @param {number} userId - User ID
   * @returns {Promise<Object>} New API key
   */
  async regenerateApiKey(userId) {
    try {
      const newApiKey = authUtils.generateApiKey();

      await databaseService.query(
        `UPDATE users 
         SET api_key = $1, 
             api_key_last_regenerated = NOW(),
             updated_at = NOW()
         WHERE id = $2
         RETURNING api_key`,
        [newApiKey, userId]
      );

      return {
        apiKey: newApiKey,
      };
    } catch (error) {
      throw new Error(`API key regeneration failed: ${error.message}`);
    }
  }
}

module.exports = AuthService;
