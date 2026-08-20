// src/modules/webhooks/controller.js
const WebhookService = require("./service");
const { sendSuccess, sendError } = require("../../utils/response");

class WebhookController {
  constructor() {
    this.service = new WebhookService();
  }

  /**
   * Get webhooks
   * GET /api/v1/webhooks
   */
  getWebhooks = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await this.service.getUserWebhooks(userId, req.pagination);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Create webhook
   * POST /api/v1/webhooks
   */
  createWebhook = async (req, res) => {
    try {
      const userId = req.user.id;
      const { url, events, secret, isActive } = req.validatedData;

      const result = await this.service.createWebhook(
        userId,
        url,
        events,
        secret
      );

      sendSuccess(res, result, 201);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Update webhook
   * PUT /api/v1/webhooks/:id
   */
  updateWebhook = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.validatedData;

      const result = await this.service.updateWebhook(id, userId, updates);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Delete webhook
   * DELETE /api/v1/webhooks/:id
   */
  deleteWebhook = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await this.service.deleteWebhook(id, userId);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Test webhook
   * POST /api/v1/webhooks/:id/test
   */
  testWebhook = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const testData = req.validatedData;

      const result = await this.service.testWebhook(id, userId, testData);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Get webhook events
   * GET /api/v1/webhooks/:id/events
   */
  getWebhookEvents = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await this.service.getWebhookEvents(
        id,
        userId,
        req.pagination
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, error);
    }
  };
}

module.exports = WebhookController;
