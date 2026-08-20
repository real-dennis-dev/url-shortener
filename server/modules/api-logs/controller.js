// src/modules/api-logs/controller.js
const ApiLogService = require("./service");
const { sendSuccess, sendError, sendFile } = require("../../utils/response");

class ApiLogController {
  constructor() {
    this.service = new ApiLogService();
  }

  /**
   * Get API Logs
   * GET /api/v1/logs
   */
  getApiLogs = async (req, res) => {
    try {
      const userId =
        req.user.role === "admin" || req.user.role === "moderator"
          ? null
          : req.user.id;

      const result = await this.service.getApiLogs(
        userId,
        req.validatedFilters || {},
        req.pagination || {}
      );

      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get Log Details
   * GET /api/v1/logs/:id
   */
  getLogDetails = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await this.service.getLogDetails(id, userId);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get Log Statistics
   * GET /api/v1/logs/stats
   */
  getLogStats = async (req, res) => {
    try {
      const userId =
        req.user.role === "admin" || req.user.role === "moderator"
          ? null
          : req.user.id;

      const { startDate, endDate } = req.query;
      const dateRange = { startDate, endDate };

      const result = await this.service.getLogStats(userId, dateRange);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Export Logs
   * GET /api/v1/logs/export
   */
  exportLogs = async (req, res) => {
    try {
      const userId =
        req.user.role === "admin" || req.user.role === "moderator"
          ? null
          : req.user.id;

      const { format = "json" } = req.exportFormat || {};

      const result = await this.service.exportLogs(
        userId,
        req.validatedFilters || {},
        format
      );

      // Set appropriate content type
      let contentType = "application/json";
      let filename = `api-logs-${new Date().toISOString().split("T")[0]}`;

      switch (format) {
        case "csv":
          contentType = "text/csv";
          filename += ".csv";
          break;
        case "excel":
          contentType =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
          filename += ".xlsx";
          break;
        case "json":
        default:
          contentType = "application/json";
          filename += ".json";
          break;
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      // Send file
      if (format === "excel") {
        res.send(result.data);
      } else {
        res.send(result.data);
      }
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get User Log Summary
   * GET /api/v1/logs/summary
   */
  getUserLogSummary = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await this.service.getUserLogSummary(userId);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Clean Old Logs (Admin only)
   * DELETE /api/v1/logs/clean
   */
  cleanOldLogs = async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const result = await this.service.cleanOldLogs(parseInt(days));
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };
}

module.exports = ApiLogController;
