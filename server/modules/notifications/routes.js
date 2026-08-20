// src/modules/notifications/routes.js
const express = require("express");
const router = express.Router();

const NotificationController = require("./controller");
const notificationMiddleware = require("./middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { validatePagination } = require("../../middleware/global.middleware");

const controller = new NotificationController();

// All routes require authentication
router.use(authenticate);

// ============================
// USER NOTIFICATIONS
// ============================

// Get notifications
router.get("/", validatePagination, controller.getNotifications);

// Mark notification as read
router.put(
  "/:id",
  notificationMiddleware.checkNotificationOwnership,
  controller.markAsRead
);

// Mark all as read
router.post("/read-all", controller.markAllAsRead);

// Get unread count
router.get("/unread", controller.getUnreadCount);

// Delete notification
router.delete(
  "/:id",
  notificationMiddleware.checkNotificationOwnership,
  controller.deleteNotification
);

// Create notification (admin only)
router.post(
  "/",
  notificationMiddleware.checkTemplateManagementPermissions,
  notificationMiddleware.validateNotification,
  controller.createNotification
);

// Send bulk notifications (admin only)
router.post(
  "/bulk",
  notificationMiddleware.checkTemplateManagementPermissions,
  controller.sendBulkNotifications
);

// ============================
// PREFERENCES
// ============================

// Get preferences
router.get("/preferences", controller.getPreferences);

// Update preferences
router.put(
  "/preferences",
  notificationMiddleware.validatePreferences,
  controller.updatePreferences
);

// ============================
// EMAIL NOTIFICATIONS
// ============================

// Send email notification
router.post(
  "/email",
  notificationMiddleware.checkTemplateManagementPermissions,
  notificationMiddleware.validateEmailNotification,
  controller.sendEmailNotification
);

// Send email with template
router.post(
  "/email/template",
  notificationMiddleware.checkTemplateManagementPermissions,
  controller.sendEmailWithTemplate
);

// Send bulk email with template (admin only)
router.post(
  "/email/bulk",
  notificationMiddleware.checkTemplateManagementPermissions,
  controller.sendBulkEmailWithTemplate
);

// ============================
// TEMPLATE MANAGEMENT
// ============================

// Email Templates
router.get(
  "/email-templates",
  notificationMiddleware.checkTemplateManagementPermissions,
  validatePagination,
  controller.getEmailTemplates
);

router.post(
  "/email-templates",
  notificationMiddleware.checkTemplateManagementPermissions,
  (req, res, next) => {
    // Set context for template validation
    req.isEmailTemplate = true;
    next();
  },
  notificationMiddleware.validateTemplate,
  controller.createEmailTemplate
);

router.put(
  "/email-templates/:name",
  notificationMiddleware.checkTemplateManagementPermissions,
  (req, res, next) => {
    req.isEmailTemplate = true;
    next();
  },
  notificationMiddleware.validateTemplate,
  controller.updateEmailTemplate
);

router.delete(
  "/email-templates/:name",
  notificationMiddleware.checkTemplateManagementPermissions,
  controller.deleteEmailTemplate
);

// Notification Templates
router.get(
  "/notification-templates",
  notificationMiddleware.checkTemplateManagementPermissions,
  validatePagination,
  controller.getNotificationTemplates
);

router.post(
  "/notification-templates",
  notificationMiddleware.checkTemplateManagementPermissions,
  (req, res, next) => {
    req.isNotificationTemplate = true;
    next();
  },
  notificationMiddleware.validateTemplate,
  controller.createNotificationTemplate
);

router.put(
  "/notification-templates/:name",
  notificationMiddleware.checkTemplateManagementPermissions,
  (req, res, next) => {
    req.isNotificationTemplate = true;
    next();
  },
  notificationMiddleware.validateTemplate,
  controller.updateNotificationTemplate
);

router.delete(
  "/notification-templates/:name",
  notificationMiddleware.checkTemplateManagementPermissions,
  controller.deleteNotificationTemplate
);

// ============================
// TEMPLATE PREVIEW
// ============================

router.post(
  "/templates/preview",
  notificationMiddleware.checkTemplateManagementPermissions,
  controller.previewTemplate
);

module.exports = router;
