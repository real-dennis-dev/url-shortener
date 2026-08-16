// auth.controller.js
const AuthService = require("./auth.service.js");
const authUtils = require("./auth.utils.js");
const authMiddleware = require("./auth.middleware.js");

const authService = new AuthService();

class AuthController {
  /**
   * Register new user
   * @route POST /api/v1/auth/register
   */
  async register(req, res, next) {
    try {
      const { email, password, fullName, plan } = req.body;

      const result = await authService.register(
        email,
        password,
        fullName,
        plan,
        {
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        }
      );

      // Set authentication cookies
      authUtils.setAuthCookies(res, result.tokens);

      res.status(201).json({
        success: true,
        message: "Registration successful. Please verify your email.",
        data: {
          user: result.user,
          // Don't send tokens in response body since they're in cookies
          apiKey: result.user.apiKey,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * @route POST /api/v1/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password, rememberMe } = req.body;

      const result = await authService.login(email, password, {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        rememberMe,
      });

      // Set authentication cookies
      authUtils.setAuthCookies(res, result.tokens);

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
          apiKey: result.user.apiKey,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * @route POST /api/v1/auth/logout
   */
  async logout(req, res, next) {
    try {
      const refreshToken =
        req.cookies[AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN];

      await authService.logout(req.user.id, refreshToken);

      // Clear authentication cookies
      authUtils.clearAuthCookies(res);

      res.json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * @route POST /api/v1/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const refreshToken =
        req.cookies[AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN] ||
        req.body.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token required",
        });
      }

      const result = await authService.refreshToken(refreshToken);

      // Update cookies with new tokens
      authUtils.setAuthCookies(res, result.tokens);

      res.json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email
   * @route GET /api/v1/auth/verify-email/:token
   */
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;

      const result = await authService.verifyEmail(token);

      // Render success page or redirect
      res.json({
        success: true,
        message: result.message,
        data: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * @route POST /api/v1/auth/reset-password
   */
  async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;

      const result = await authService.requestPasswordReset(email);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   * @route POST /api/v1/auth/reset-password/:token
   */
  async resetPassword(req, res, next) {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;

      const result = await authService.resetPassword(token, newPassword);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * @route GET /api/v1/auth/me
   */
  async getCurrentUser(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.id);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            plan: user.plan,
            status: user.status,
            emailVerified: user.email_verified,
            apiKey: user.api_key,
            quotaLimit: user.quota_limit,
            totalClicks: user.total_clicks,
            lastLogin: user.last_login,
            createdAt: user.created_at,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * @route PUT /api/v1/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Validate current password
      const user = await authService.getUserById(req.user.id);
      const isValid = await authUtils.verifyPassword(
        currentPassword,
        user.password_hash
      );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Check new password strength
      const strengthCheck = authUtils.checkPasswordStrength(newPassword);
      if (strengthCheck.strength === "weak") {
        return res.status(400).json({
          success: false,
          message:
            "New password is too weak: " + strengthCheck.feedback.join(". "),
        });
      }

      // Update password
      const hashedPassword = await authUtils.hashPassword(newPassword);
      await databaseService.query(
        "UPDATE users SET password_hash = $1 WHERE id = $2",
        [hashedPassword, req.user.id]
      );

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Regenerate API key
   * @route POST /api/v1/auth/api-key/regenerate
   */
  async regenerateApiKey(req, res, next) {
    try {
      const result = await authService.regenerateApiKey(req.user.id);

      res.json({
        success: true,
        message: "API key regenerated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
