// routes/analytics.routes.js
import express from "express";
import { AnalyticsController } from "../controllers/analytics.js";
import { RedirectController } from "../controllers/redirect.js";
import { auth } from "../middleware/auth.js";
import { validateQuery } from "../middleware/validation.js";
import { analyticsQuerySchema } from "../validators/schemas.js";

const router = express.Router();

// All analytics routes require authentication
router.use(auth);

// Get comprehensive statistics
router.get(
  "/:shortCode/statistics",
  validateQuery(analyticsQuerySchema),
  AnalyticsController.getClickStatistics
);

// Get geographic distribution
router.get(
  "/:shortCode/geography",
  validateQuery(analyticsQuerySchema),
  AnalyticsController.getGeographicDistribution
);

// Get device/browser breakdown
router.get("/:shortCode/devices", AnalyticsController.getDeviceBreakdown);

// Get top performing links (user-wide)
router.get(
  "/top-performing",
  validateQuery(analyticsQuerySchema),
  AnalyticsController.getTopPerformingLinks
);

// Get URL analytics with timeline
router.get(
  "/:shortCode/analytics",
  validateQuery(analyticsQuerySchema),
  RedirectController.getUrlAnalytics
);

// Export analytics data
router.get("/:shortCode/export", AnalyticsController.exportAnalytics);

// Get real-time analytics
router.get("/:shortCode/realtime", AnalyticsController.getRealtimeAnalytics);

// Compare two URLs
router.post("/compare", AnalyticsController.compareUrls);

export default router;
