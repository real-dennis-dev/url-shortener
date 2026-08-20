// src/modules/users/controller.js
const UserService = require("./service");
const { sendSuccess, sendError } = require("../../utils/response");

class UserController {
  constructor() {
    this.service = new UserService();
  }

  /**
   * Get user profile
   * GET /api/v1/users/profile
   */
  getProfile = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await this.service.getUserProfile(userId);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Update user profile
   * PUT /api/v1/users/profile
   */
  updateProfile = async (req, res) => {
    try {
      const userId = req.user.id;
      const updates = req.validatedData;
      const result = await this.service.updateUserProfile(userId, updates);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Regenerate API key
   * POST /api/v1/users/api-key
   */
  regenerateApiKey = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await this.service.regenerateApiKey(userId);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Change password
   * PUT /api/v1/users/password
   */
  changePassword = async (req, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.validatedData;
      const result = await this.service.changePassword(
        userId,
        currentPassword,
        newPassword
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get preferences
   * GET /api/v1/users/preferences
   */
  getPreferences = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await this.service.getUserPreferences(userId);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Update preferences
   * PUT /api/v1/users/preferences
   */
  updatePreferences = async (req, res) => {
    try {
      const userId = req.user.id;
      const { preferences } = req.validatedData;
      const result = await this.service.updateUserPreferences(
        userId,
        preferences
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Update user plan (Admin only)
   * PUT /api/v1/users/plan
   */
  updatePlan = async (req, res) => {
    try {
      const userId = req.user.id;
      const { plan } = req.validatedData;
      const result = await this.service.updateUserPlan(userId, plan);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get user stats
   * GET /api/v1/users/stats
   */
  getStats = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await this.service.getUserStats(userId);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Delete account
   * DELETE /api/v1/users/delete
   */
  deleteAccount = async (req, res) => {
    try {
      const userId = req.user.id;
      const { password } = req.validatedData;
      const result = await this.service.deleteUserAccount(userId, password);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get user activity (Admin only)
   * GET /api/v1/users/activity
   */
  getActivity = async (req, res) => {
    try {
      const userId = req.user.id;
      const { activityType, dateFrom, dateTo } = req.query;
      const filters = { activityType, dateFrom, dateTo };

      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) delete filters[key];
      });

      const result = await this.service.getUserActivity(
        userId,
        filters,
        req.pagination
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get all users (Admin only)
   * GET /api/v1/users
   */
  getAllUsers = async (req, res) => {
    try {
      const { role, plan, status, search } = req.query;
      const filters = { role, plan, status, search };

      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) delete filters[key];
      });

      const result = await this.service.getAllUsers(filters, req.pagination);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };
}

module.exports = UserController;
