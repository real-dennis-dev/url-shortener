// services/auth.service.js
import { api } from "./api.js";

const AuthService = {
  /**
   * Register a new user
   * @param {Object} data - Registration data
   * @param {string} data.email - User email
   * @param {string} data.password - User password
   * @param {string} data.fullName - User full name
   * @param {string} [data.plan] - Subscription plan (free, pro, business, enterprise)
   */
  register: async (data) => {
    return api.post("/auth/register", data);
  },

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} [deviceInfo] - Device information for session tracking
   */
  login: async (email, password, deviceInfo = null) => {
    return api.post("/auth/login", {
      email,
      password,
      ...(deviceInfo && { deviceInfo }),
    });
  },

  /**
   * Logout user
   */
  logout: async () => {
    return api.post("/auth/logout");
  },

  /**
   * Refresh access token
   * @param {string} [refreshToken] - Refresh token (optional)
   */
  refresh: async (refreshToken = null) => {
    const body = refreshToken ? { refreshToken } : {};
    return api.post("/auth/refresh", body);
  },

  /**
   * Verify email address
   * @param {string} token - Email verification token
   */
  verifyEmail: async (token) => {
    return api.get(`/auth/verify-email/${token}`);
  },

  /**
   * Request password reset
   * @param {string} email - User email
   */
  requestPasswordReset: async (email) => {
    return api.post("/auth/reset-password", { email });
  },

  /**
   * Reset password
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @param {string} confirmPassword - Confirm new password
   */
  resetPassword: async (token, newPassword, confirmPassword) => {
    return api.post(`/auth/reset-password/${token}`, {
      newPassword,
      confirmPassword,
    });
  },

  /**
   * Get current user
   */
  me: async () => {
    return api.get("/auth/me");
  },

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @param {string} confirmPassword - Confirm new password
   */
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    return api.put("/auth/change-password", {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  },

  /**
   * Regenerate API key
   */
  regenerateApiKey: async () => {
    return api.post("/auth/api-key/regenerate");
  },

  /**
   * Get all user sessions
   */
  getSessions: async () => {
    return api.get("/auth/sessions");
  },

  /**
   * Get session statistics
   */
  getSessionStats: async () => {
    return api.get("/auth/sessions/stats");
  },

  /**
   * Get current session details
   */
  getCurrentSession: async () => {
    return api.get("/auth/sessions/current");
  },

  /**
   * Revoke a specific session
   * @param {string} sessionToken - Session token to revoke
   */
  revokeSession: async (sessionToken) => {
    return api.delete(`/auth/sessions/${sessionToken}`);
  },

  /**
   * Revoke all sessions except current
   */
  revokeAllSessions: async () => {
    return api.delete("/auth/sessions/all");
  },
};

export default AuthService;
