// src/modules/system/routes.js
const express = require("express");
const router = express.Router();

const SystemController = require("./controller");
const systemMiddleware = require("./middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { validatePagination } = require("../../middleware/global.middleware");

const controller = new SystemController();

// ============================
// Public Routes
// ============================

// Health check (public)
router.get(
  "/health",
  systemMiddleware.checkHealthAccess,
  controller.healthCheck
);

// System status (public)
router.get("/status", controller.getSystemStatus);

// ============================
// Protected Routes
// ============================

// All routes below require authentication
router.use(authenticate);
router.use(systemMiddleware.checkMaintenanceMode);

// ============================
// Settings Routes
// ============================

// Get system settings (admin only)
router.get(
  "/settings",
  systemMiddleware.checkAdminPermissions,
  systemMiddleware.validateSettingsKeys,
  controller.getSystemSettings
);

// Update system settings (admin only)
router.put(
  "/settings",
  systemMiddleware.checkAdminPermissions,
  systemMiddleware.validateSystemSettings,
  controller.updateSystemSettings
);

// ============================
// Maintenance Routes
// ============================

// Toggle maintenance mode (admin only)
router.post(
  "/maintenance",
  systemMiddleware.checkAdminPermissions,
  systemMiddleware.validateMaintenanceToggle,
  controller.toggleMaintenanceMode
);

// ============================
// Cache Routes
// ============================

// Clear system cache (admin only)
router.post(
  "/cache/clear",
  systemMiddleware.checkAdminPermissions,
  controller.clearSystemCache
);

// ============================
// Metrics Routes
// ============================

// Get system metrics (admin only)
router.get(
  "/metrics",
  systemMiddleware.checkAdminPermissions,
  controller.getSystemMetrics
);

// ============================
// Logs Routes
// ============================

// Get system logs (admin only)
router.get(
  "/logs",
  systemMiddleware.checkAdminPermissions,
  validatePagination,
  controller.getSystemLogs
);

module.exports = router;
