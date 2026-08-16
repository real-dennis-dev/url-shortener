// src/modules/analytics/middleware/analytics.middleware.js
const { AppError } = require("../../../utils/error.utils");
const {
  validateDateRange: validateDateRangeUtil,
} = require("../utils/analytics.utils");
const DatabaseService = require("../../../services/database.service");

class AnalyticsMiddleware {
  /**
   * Validate date range
   * Validates startDate and endDate parameters
   */
  validateDateRange(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      // Parse dates if provided
      let parsedStartDate = startDate ? new Date(startDate) : null;
      let parsedEndDate = endDate ? new Date(endDate) : null;

      // Validate date range
      const validation = validateDateRangeUtil(parsedStartDate, parsedEndDate);

      if (!validation.valid) {
        throw new AppError(validation.error, 400);
      }

      // Set validated dates on request
      req.validatedDateRange = {
        startDate: validation.startDate,
        endDate: validation.endDate,
      };

      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check analytics access
   * Verifies user can access analytics for specific URL
   */
  async checkAnalyticsAccess(req, res, next) {
    try {
      const userId = req.user.id;
      const urlId = req.params.urlId || req.query.urlId;

      // If no URL ID provided, check general analytics access
      if (!urlId) {
        return next();
      }

      // Check if user owns the URL or is admin/moderator
      const query = `
        SELECT user_id, status 
        FROM public.urls 
        WHERE id = $1
      `;

      const result = await DatabaseService.executeWithRetry({
        text: query,
        values: [urlId],
      });

      if (result.rows.length === 0) {
        throw new AppError("URL not found", 404);
      }

      const url = result.rows[0];

      // Allow access if user owns the URL or has admin/moderator role
      if (
        url.user_id !== userId &&
        !["admin", "moderator"].includes(req.user.role)
      ) {
        throw new AppError(
          "You do not have access to this URL's analytics",
          403
        );
      }

      req.urlData = url;
      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rate limiting for analytics
   * Limits analytics requests per user
   */
  async analyticsLimiter(req, res, next) {
    try {
      const userId = req.user.id;
      const userPlan = req.user.plan || "free";

      // Define rate limits based on plan
      const limits = {
        free: { windowMs: 60000, max: 30 }, // 30 requests per minute
        pro: { windowMs: 60000, max: 100 }, // 100 requests per minute
        business: { windowMs: 60000, max: 300 }, // 300 requests per minute
        enterprise: { windowMs: 60000, max: 1000 }, // 1000 requests per minute
      };

      const limit = limits[userPlan] || limits.free;

      // Check rate limit using cache service
      const cacheKey = `analytics_rate_limit:${userId}`;
      const currentCount = (await CacheService.get(cacheKey)) || 0;

      if (currentCount >= limit.max) {
        throw new AppError("Rate limit exceeded. Please try again later.", 429);
      }

      // Increment count
      await CacheService.set(cacheKey, currentCount + 1, limit.windowMs / 1000);

      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate pagination
   * Validates page and limit parameters
   */
  validatePagination(req, res, next) {
    try {
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 20;

      // Validate and sanitize
      if (page < 1) page = 1;
      if (limit < 1) limit = 1;
      if (limit > 100) limit = 100;

      req.validatedPagination = {
        page,
        limit,
        offset: (page - 1) * limit,
      };

      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate export format
   */
  validateExportFormat(req, res, next) {
    try {
      const format = req.query.format || "csv";
      const allowedFormats = ["csv", "json", "excel"];

      if (!allowedFormats.includes(format)) {
        throw new AppError(
          "Invalid export format. Allowed: csv, json, excel",
          400
        );
      }

      req.validatedFormat = format;
      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate interval
   */
  validateInterval(req, res, next) {
    try {
      const interval = req.query.interval || "day";
      const allowedIntervals = ["hour", "day", "week", "month"];

      if (!allowedIntervals.includes(interval)) {
        throw new AppError(
          "Invalid interval. Allowed: hour, day, week, month",
          400
        );
      }

      req.validatedInterval = interval;
      next();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsMiddleware();
