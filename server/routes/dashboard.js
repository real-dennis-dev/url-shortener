import express from "express";
import { DashboardController } from "../controllers/dashboard.js";
import { auth } from "../middleware/auth.js";
import { validateQuery } from "../middleware/validation.js";
import {
  dashboardQuerySchema,
  dashboardExportSchema,
} from "../validators/schemas.js";

const router = express.Router();

// All dashboard routes require authentication
router.use(auth);

// Get overview dashboard data
router.get("/overview", DashboardController.getOverview);

// Get real-time statistics
router.get("/realtime", DashboardController.getRealtimeStats);

// Get chart data for visualizations
router.get(
  "/charts",
  validateQuery(dashboardQuerySchema),
  DashboardController.getChartData
);

// Get recent activity feed
router.get("/activity", DashboardController.getRecentActivity);

// Get detailed performance metrics
router.get("/performance", DashboardController.getPerformanceMetrics);

// Export dashboard report
router.get(
  "/export",
  validateQuery(dashboardExportSchema),
  DashboardController.exportDashboardReport
);

export default router;
