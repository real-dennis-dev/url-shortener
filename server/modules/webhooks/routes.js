// src/modules/webhooks/routes.js
const express = require("express");
const router = express.Router();

const WebhookController = require("./controller");
const webhookMiddleware = require("./middleware");
const { authenticate } = require("../../middleware/auth.middleware");

const controller = new WebhookController();

// All routes require authentication
router.use(authenticate);

// ============================
// Webhook CRUD Routes
// ============================

// Get all webhooks
router.get("/", webhookMiddleware.validatePagination, controller.getWebhooks);

// Create webhook
router.post("/", webhookMiddleware.validateWebhook, controller.createWebhook);

// Update webhook
router.put(
  "/:id",
  webhookMiddleware.checkWebhookOwnership,
  webhookMiddleware.validateWebhookUpdate,
  controller.updateWebhook
);

// Delete webhook
router.delete(
  "/:id",
  webhookMiddleware.checkWebhookOwnership,
  controller.deleteWebhook
);

// ============================
// Webhook Test Routes
// ============================

// Test webhook
router.post(
  "/:id/test",
  webhookMiddleware.checkWebhookOwnership,
  webhookMiddleware.validateWebhookTest,
  controller.testWebhook
);

// Get webhook events
router.get(
  "/:id/events",
  webhookMiddleware.checkWebhookOwnership,
  webhookMiddleware.validatePagination,
  controller.getWebhookEvents
);

module.exports = router;
