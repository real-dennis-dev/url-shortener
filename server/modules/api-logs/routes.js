// src/modules/api-logs/routes.js
const express = require("express");
const router = express.Router();

const ApiLogController = require("./controller");
const apiLogMiddleware = require("./middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/auth.middleware");

const controller = new ApiLogController();

// All routes require authentication
router.use(authenticate);

// ============================
// Log Retrieval Routes
// ============================

// Get API logs
router.get(
  "/",
  apiLogMiddleware.validateLogFilters,
  apiLogMiddleware.validatePagination,
  apiLogMiddleware.checkLogAccess,
  controller.getApiLogs
);

// Get log details
router.get("/:id", apiLogMiddleware.validateLogId, controller.getLogDetails);

// ============================
// Statistics Routes
// ============================

// Get log statistics
router.get(
  "/stats",
  apiLogMiddleware.validateLogFilters,
  apiLogMiddleware.checkLogAccess,
  controller.getLogStats
);

// Get user log summary
router.get("/summary", controller.getUserLogSummary);

// ============================
// Export Routes
// ============================

// Export logs
router.get(
  "/export",
  apiLogMiddleware.validateLogFilters,
  apiLogMiddleware.validateExportFormat,
  apiLogMiddleware.checkLogAccess,
  controller.exportLogs
);

// ============================
// Admin Routes
// ============================

// Clean old logs (admin only)
router.delete("/clean", authorize(["admin"]), controller.cleanOldLogs);

module.exports = router;
