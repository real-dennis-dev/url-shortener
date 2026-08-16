// src/modules/analytics/routes/analytics.routes.js
const express = require("express");
const router = express.Router();

// Controllers
const AnalyticsController = require("../controllers/analytics.controller");

// Middleware
const analyticsMiddleware = require("../middleware/analytics.middleware");
const authMiddleware = require("../../../middleware/auth.middleware");

// Apply authentication and rate limiting to all analytics routes
router.use(authMiddleware.authenticate);
router.use(analyticsMiddleware.analyticsLimiter);

/**
 * @swagger
 * /api/v1/analytics/dashboard:
 *   get:
 *     summary: Get analytics dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 */
router.get(
  "/dashboard",
  analyticsMiddleware.validateDateRange,
  AnalyticsController.getDashboard
);

/**
 * @swagger
 * /api/v1/analytics/urls/{urlId}:
 *   get:
 *     summary: Get URL analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: urlId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: deviceType
 *         schema:
 *           type: string
 *         description: Filter by device type
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country
 *       - in: query
 *         name: browser
 *         schema:
 *           type: string
 *         description: Filter by browser
 */
router.get(
  "/urls/:urlId",
  analyticsMiddleware.checkAnalyticsAccess,
  analyticsMiddleware.validateDateRange,
  AnalyticsController.getUrlAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/overview:
 *   get:
 *     summary: Get overview analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 */
router.get(
  "/overview",
  analyticsMiddleware.validateDateRange,
  AnalyticsController.getOverview
);

/**
 * @swagger
 * /api/v1/analytics/referrers:
 *   get:
 *     summary: Get top referrers
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: urlId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific URL
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of referrers to return
 */
router.get(
  "/referrers",
  analyticsMiddleware.checkAnalyticsAccess,
  analyticsMiddleware.validatePagination,
  AnalyticsController.getTopReferrers
);

/**
 * @swagger
 * /api/v1/analytics/devices:
 *   get:
 *     summary: Get device analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: urlId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 */
router.get(
  "/devices",
  analyticsMiddleware.checkAnalyticsAccess,
  analyticsMiddleware.validateDateRange,
  AnalyticsController.getDeviceAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/locations:
 *   get:
 *     summary: Get location analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: urlId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 */
router.get(
  "/locations",
  analyticsMiddleware.checkAnalyticsAccess,
  analyticsMiddleware.validateDateRange,
  AnalyticsController.getLocationAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/timeline:
 *   get:
 *     summary: Get timeline data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: urlId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 */
router.get(
  "/timeline",
  analyticsMiddleware.checkAnalyticsAccess,
  analyticsMiddleware.validateDateRange,
  analyticsMiddleware.validateInterval,
  AnalyticsController.getTimeline
);

/**
 * @swagger
 * /api/v1/analytics/export:
 *   get:
 *     summary: Export analytics data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: urlId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json, excel]
 *           default: csv
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 */
router.get(
  "/export",
  analyticsMiddleware.checkAnalyticsAccess,
  analyticsMiddleware.validateDateRange,
  analyticsMiddleware.validateExportFormat,
  AnalyticsController.exportAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/realtime:
 *   get:
 *     summary: Get real-time analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get("/realtime", AnalyticsController.getRealtime);

module.exports = router;
