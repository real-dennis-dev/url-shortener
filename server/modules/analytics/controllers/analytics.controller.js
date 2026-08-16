// src/modules/analytics/controllers/analytics.controller.js
const AnalyticsService = require("../services/analytics.service");
const { AppError } = require("../../../utils/error.utils");

class AnalyticsController {
  /**
   * Get analytics dashboard
   * GET /api/v1/analytics/dashboard
   */
  async getDashboard(req, res, next) {
    try {
      const userId = req.user.id;
      const dateRange = {
        startDate:
          req.query.startDate ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: req.query.endDate || new Date(),
      };

      const dashboardData = await AnalyticsService.getDashboardAnalytics(
        userId,
        dateRange
      );

      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get URL analytics
   * GET /api/v1/analytics/urls/:urlId
   */
  async getUrlAnalytics(req, res, next) {
    try {
      const { urlId } = req.params;
      const userId = req.user.id;
      const filters = {
        dateRange: {
          startDate:
            req.query.startDate ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: req.query.endDate || new Date(),
        },
        deviceType: req.query.deviceType,
        country: req.query.country,
        browser: req.query.browser,
      };

      const analytics = await AnalyticsService.getUrlAnalytics(
        urlId,
        userId,
        filters
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get overview analytics
   * GET /api/v1/analytics/overview
   */
  async getOverview(req, res, next) {
    try {
      const userId = req.user.id;
      const dateRange = {
        startDate:
          req.query.startDate ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: req.query.endDate || new Date(),
      };

      const overview = await AnalyticsService.getOverviewAnalytics(
        userId,
        dateRange
      );

      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get top referrers
   * GET /api/v1/analytics/referrers
   */
  async getTopReferrers(req, res, next) {
    try {
      const userId = req.user.id;
      const { urlId } = req.query;
      const limit = parseInt(req.query.limit) || 10;

      const referrers = await AnalyticsService.getTopReferrers(
        urlId,
        userId,
        limit
      );

      res.status(200).json({
        success: true,
        data: referrers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get device analytics
   * GET /api/v1/analytics/devices
   */
  async getDeviceAnalytics(req, res, next) {
    try {
      const userId = req.user.id;
      const { urlId } = req.query;
      const dateRange = {
        startDate:
          req.query.startDate ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: req.query.endDate || new Date(),
      };

      const devices = await AnalyticsService.getDeviceAnalytics(
        urlId,
        userId,
        dateRange
      );

      res.status(200).json({
        success: true,
        data: devices,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get location analytics
   * GET /api/v1/analytics/locations
   */
  async getLocationAnalytics(req, res, next) {
    try {
      const userId = req.user.id;
      const { urlId } = req.query;
      const dateRange = {
        startDate:
          req.query.startDate ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: req.query.endDate || new Date(),
      };

      const locations = await AnalyticsService.getLocationAnalytics(
        urlId,
        userId,
        dateRange
      );

      res.status(200).json({
        success: true,
        data: locations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get timeline data
   * GET /api/v1/analytics/timeline
   */
  async getTimeline(req, res, next) {
    try {
      const userId = req.user.id;
      const { urlId } = req.query;
      const interval = req.query.interval || "day"; // hour, day, week, month
      const dateRange = {
        startDate:
          req.query.startDate ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: req.query.endDate || new Date(),
      };

      const timeline = await AnalyticsService.getTimelineData(
        urlId,
        userId,
        dateRange,
        interval
      );

      res.status(200).json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export analytics
   * GET /api/v1/analytics/export
   */
  async exportAnalytics(req, res, next) {
    try {
      const userId = req.user.id;
      const { urlId } = req.query;
      const format = req.query.format || "csv"; // csv, json, excel
      const dateRange = {
        startDate:
          req.query.startDate ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: req.query.endDate || new Date(),
      };

      const { data, contentType, filename } =
        await AnalyticsService.exportAnalytics(
          urlId,
          userId,
          format,
          dateRange
        );

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get real-time analytics
   * GET /api/v1/analytics/realtime
   */
  async getRealtime(req, res, next) {
    try {
      const userId = req.user.id;

      const realtime = await AnalyticsService.getRealtimeAnalytics(userId);

      res.status(200).json({
        success: true,
        data: realtime,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
