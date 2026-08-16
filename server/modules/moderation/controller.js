// src/modules/moderation/controller.js
const ModerationService = require("./service");
const { sendSuccess, sendError } = require("../../utils/response");

class ModerationController {
  constructor() {
    this.service = new ModerationService();
  }

  /**
   * Moderate URL
   * POST /api/v1/moderation/urls/:urlId
   */
  moderateUrl = async (req, res) => {
    try {
      const { urlId } = req.params;
      const { action, reason, notes } = req.validatedData;
      const adminId = req.user.id;

      const result = await this.service.moderateUrl(
        urlId,
        adminId,
        action,
        reason,
        notes
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Create report
   * POST /api/v1/moderation/reports
   */
  createReport = async (req, res) => {
    try {
      const { urlId, reason, description, reporterEmail } = req.validatedData;
      const reportedBy = req.user ? req.user.id : null;

      const result = await this.service.createReport(
        urlId,
        reportedBy,
        reason,
        description,
        reporterEmail
      );
      sendSuccess(res, result, 201);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get reports
   * GET /api/v1/moderation/reports
   */
  getReports = async (req, res) => {
    try {
      const { status, reason, urlId, reportedBy, dateFrom, dateTo } = req.query;
      const filters = { status, reason, urlId, reportedBy, dateFrom, dateTo };

      // Remove undefined filters
      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) delete filters[key];
      });

      const result = await this.service.getReports(filters, req.pagination);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Update report
   * PUT /api/v1/moderation/reports/:id
   */
  updateReport = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, resolution } = req.validatedData;
      const adminId = req.user.id;

      const result = await this.service.updateReport(
        id,
        adminId,
        status,
        resolution
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get report details
   * GET /api/v1/moderation/reports/:id
   */
  getReportDetails = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.service.getReportDetails(id);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Add to blacklist
   * POST /api/v1/moderation/blacklist
   */
  addToBlacklist = async (req, res) => {
    try {
      const { domain, reason, expiresAt } = req.validatedData;
      const addedBy = req.user.id;

      const result = await this.service.addToBlacklist(
        domain,
        reason,
        addedBy,
        expiresAt
      );
      sendSuccess(res, result, 201);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Remove from blacklist
   * DELETE /api/v1/moderation/blacklist/:id
   */
  removeFromBlacklist = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.service.removeFromBlacklist(id);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get blacklist
   * GET /api/v1/moderation/blacklist
   */
  getBlacklist = async (req, res) => {
    try {
      const { domain, expiresAt } = req.query;
      const filters = { domain, expiresAt };

      // Remove undefined filters
      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) delete filters[key];
      });

      const result = await this.service.getBlacklist(filters, req.pagination);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get flagged URLs
   * GET /api/v1/moderation/flagged
   */
  getFlaggedUrls = async (req, res) => {
    try {
      const result = await this.service.getFlaggedUrls(req.pagination);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get moderation logs
   * GET /api/v1/moderation/logs/:urlId
   */
  getModerationLogs = async (req, res) => {
    try {
      const { urlId } = req.params;
      const result = await this.service.getModerationLogs(
        urlId,
        req.pagination
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Auto-moderate URL
   * POST /api/v1/moderation/auto
   */
  autoModerate = async (req, res) => {
    try {
      const { url, title, description } = req.body;
      const result = await this.service.autoModerateUrl(
        url,
        title,
        description
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };
}

module.exports = ModerationController;
