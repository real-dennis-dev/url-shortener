// src/modules/system/controller.js
const SystemService = require("./service");
const { sendSuccess, sendError } = require("../../utils/response");

class SystemController {
  constructor() {
    this.service = new SystemService();
  }

  /**
   * Get system settings
   * GET /api/v1/system/settings
   */
  getSystemSettings = async (req, res) => {
    try {
      const keys = req.validatedQuery?.keys || null;
      const result = await this.service.getSystemSettings(keys);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Update system settings
   * PUT /api/v1/system/settings
   */
  updateSystemSettings = async (req, res) => {
    try {
      const { settings } = req.validatedData;
      const adminId = req.user.id;
      const result = await this.service.updateSystemSettings(settings, adminId);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Health check
   * GET /api/v1/system/health
   */
  healthCheck = async (req, res) => {
    try {
      const result = await this.service.healthCheck();
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get system status
   * GET /api/v1/system/status
   */
  getSystemStatus = async (req, res) => {
    try {
      const result = await this.service.getSystemStatus();
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Toggle maintenance mode
   * POST /api/v1/system/maintenance
   */
  toggleMaintenanceMode = async (req, res) => {
    try {
      const { enable, message } = req.validatedData;
      const adminId = req.user.id;
      const result = await this.service.toggleMaintenanceMode(
        adminId,
        enable,
        message
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get system metrics
   * GET /api/v1/system/metrics
   */
  getSystemMetrics = async (req, res) => {
    try {
      const result = await this.service.getSystemMetrics();
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Clear system cache
   * POST /api/v1/system/cache/clear
   */
  clearSystemCache = async (req, res) => {
    try {
      const result = await this.service.clearSystemCache();
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get system logs
   * GET /api/v1/system/logs
   */
  getSystemLogs = async (req, res) => {
    try {
      const { operation, userId, dateFrom, dateTo } = req.query;
      const filters = { operation, userId, dateFrom, dateTo };

      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) delete filters[key];
      });

      const result = await this.service.getSystemLogs(filters, req.pagination);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };
}

module.exports = SystemController;
