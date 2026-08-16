// src/modules/moderation/routes.js
const express = require("express");
const router = express.Router();

const ModerationController = require("./controller");
const moderationMiddleware = require("./middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { validatePagination } = require("../../middleware/global.middleware");

const controller = new ModerationController();

// All routes require authentication
router.use(authenticate);

// ============================
// Moderation Routes
// ============================

// Moderate URL (moderator+ only)
router.post(
  "/urls/:urlId",
  moderationMiddleware.checkModeratorPermissions,
  moderationMiddleware.validateModerationAction,
  controller.moderateUrl
);

// ============================
// Report Routes
// ============================

// Create report (public, optional auth)
router.post(
  "/reports",
  moderationMiddleware.validateReport,
  controller.createReport
);

// Get reports (moderator+ only)
router.get(
  "/reports",
  moderationMiddleware.checkModeratorPermissions,
  validatePagination,
  controller.getReports
);

// Update report (moderator+ only)
router.put(
  "/reports/:id",
  moderationMiddleware.checkModeratorPermissions,
  moderationMiddleware.validateReportStatus,
  controller.updateReport
);

// Get report details (moderator+ only)
router.get(
  "/reports/:id",
  moderationMiddleware.checkModeratorPermissions,
  controller.getReportDetails
);

// ============================
// Blacklist Routes
// ============================

// Get blacklist (moderator+ only)
router.get(
  "/blacklist",
  moderationMiddleware.checkBlacklistAccess,
  validatePagination,
  controller.getBlacklist
);

// Add to blacklist (moderator+ only)
router.post(
  "/blacklist",
  moderationMiddleware.checkBlacklistAccess,
  moderationMiddleware.validateBlacklistEntry,
  controller.addToBlacklist
);

// Remove from blacklist (moderator+ only)
router.delete(
  "/blacklist/:id",
  moderationMiddleware.checkBlacklistAccess,
  controller.removeFromBlacklist
);

// ============================
// Flagged URLs Routes
// ============================

// Get flagged URLs (moderator+ only)
router.get(
  "/flagged",
  moderationMiddleware.checkModeratorPermissions,
  validatePagination,
  controller.getFlaggedUrls
);

// ============================
// Moderation Logs Routes
// ============================

// Get moderation logs (moderator+ only)
router.get(
  "/logs/:urlId",
  moderationMiddleware.checkModeratorPermissions,
  validatePagination,
  controller.getModerationLogs
);

// ============================
// Auto-moderation Routes
// ============================

// Auto-moderate URL (internal use)
router.post(
  "/auto",
  moderationMiddleware.checkModeratorPermissions,
  controller.autoModerate
);

module.exports = router;
