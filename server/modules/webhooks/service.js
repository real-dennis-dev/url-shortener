// src/modules/webhooks/service.js
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const crypto = require("crypto");
const DatabaseService = require("../../services/database.service");
const CacheService = require("../../services/cache.service");
const QueueService = require("../../services/queue.service");
const webhookUtils = require("./utils");
const { NotFoundError, ValidationError } = require("../../utils/errors");

class WebhookService {
  constructor() {
    this.db = new DatabaseService();
    this.cache = new CacheService();
    this.queue = new QueueService();
  }

  /**
   * Get user webhooks
   */
  async getUserWebhooks(userId, pagination = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = pagination;
    const offset = (page - 1) * limit;

    // Try cache first
    const cacheKey = `webhooks:user:${userId}:${page}:${limit}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get total count
    const countResult = await this.db.executeQuery(
      "SELECT COUNT(*) as total FROM webhooks WHERE user_id = $1",
      [userId]
    );
    const total = parseInt(countResult[0].total);

    // Get webhooks with pagination
    const sortColumn =
      sortBy === "createdAt"
        ? "created_at"
        : sortBy === "updatedAt"
        ? "updated_at"
        : sortBy;

    const query = `
      SELECT * FROM webhooks 
      WHERE user_id = $1
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $2 OFFSET $3
    `;

    const webhooks = await this.db.executeQuery(query, [userId, limit, offset]);

    const result = {
      webhooks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };

    // Cache for 5 minutes
    await this.cache.set(cacheKey, result, 300);

    return result;
  }

  /**
   * Get webhook by ID
   */
  async getWebhookById(webhookId) {
    // Try cache first
    const cacheKey = `webhook:${webhookId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.db.executeQuery(
      "SELECT * FROM webhooks WHERE id = $1",
      [webhookId]
    );

    if (!result || result.length === 0) {
      return null;
    }

    const webhook = result[0];
    await this.cache.set(cacheKey, webhook, 300);

    return webhook;
  }

  /**
   * Create webhook
   */
  async createWebhook(userId, url, events, secret = null) {
    // Validate if user has reached webhook limit
    const countResult = await this.db.executeQuery(
      "SELECT COUNT(*) as count FROM webhooks WHERE user_id = $1",
      [userId]
    );
    const webhookCount = parseInt(countResult[0].count);

    // Check user's plan for webhook limits
    const userResult = await this.db.executeQuery(
      "SELECT plan FROM users WHERE id = $1",
      [userId]
    );

    const plan = userResult[0]?.plan || "free";
    const maxWebhooks = this.getMaxWebhooksForPlan(plan);

    if (webhookCount >= maxWebhooks) {
      throw new ValidationError(
        `You have reached the maximum number of webhooks for your plan (${maxWebhooks})`,
        403
      );
    }

    // Generate secret if not provided
    if (!secret) {
      secret = crypto.randomBytes(32).toString("hex");
    }

    // Create webhook
    const id = uuidv4();
    const eventsString = JSON.stringify(events);

    const result = await this.db.executeQuery(
      `INSERT INTO webhooks (id, user_id, url, events, secret, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [id, userId, url, eventsString, secret, true]
    );

    const webhook = result[0];

    // Clear cache
    await this.cache.delete(`webhooks:user:${userId}`);

    // Test the webhook
    await this.testWebhookConnection(webhook.id);

    // Log webhook creation
    await this.logWebhookEvent(webhook.id, "created", {
      userId,
      url,
      events,
    });

    return webhook;
  }

  /**
   * Update webhook
   */
  async updateWebhook(webhookId, userId, updates) {
    // Get existing webhook
    const webhook = await this.getWebhookById(webhookId);
    if (!webhook) {
      throw new NotFoundError("Webhook not found");
    }

    if (webhook.user_id !== userId) {
      throw new ValidationError(
        "You do not have permission to update this webhook",
        403
      );
    }

    // Build update query
    const updateFields = [];
    const params = [];
    let paramCounter = 1;

    if (updates.url !== undefined) {
      updateFields.push(`url = $${paramCounter}`);
      params.push(updates.url);
      paramCounter++;
    }

    if (updates.events !== undefined) {
      updateFields.push(`events = $${paramCounter}`);
      params.push(JSON.stringify(updates.events));
      paramCounter++;
    }

    if (updates.secret !== undefined) {
      updateFields.push(`secret = $${paramCounter}`);
      params.push(updates.secret);
      paramCounter++;
    }

    if (updates.isActive !== undefined) {
      updateFields.push(`is_active = $${paramCounter}`);
      params.push(updates.isActive);
      paramCounter++;
    }

    if (updateFields.length === 0) {
      throw new ValidationError("No valid fields to update", 400);
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(webhookId);

    const query = `
      UPDATE webhooks 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await this.db.executeQuery(query, params);
    const updatedWebhook = result[0];

    // Clear cache
    await this.cache.delete(`webhook:${webhookId}`);
    await this.cache.delete(`webhooks:user:${userId}`);

    // Log update
    await this.logWebhookEvent(webhookId, "updated", {
      userId,
      updates,
    });

    return updatedWebhook;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId, userId) {
    const webhook = await this.getWebhookById(webhookId);
    if (!webhook) {
      throw new NotFoundError("Webhook not found");
    }

    if (webhook.user_id !== userId) {
      throw new ValidationError(
        "You do not have permission to delete this webhook",
        403
      );
    }

    await this.db.executeQuery(
      "DELETE FROM webhooks WHERE id = $1 RETURNING id",
      [webhookId]
    );

    // Clear cache
    await this.cache.delete(`webhook:${webhookId}`);
    await this.cache.delete(`webhooks:user:${userId}`);

    // Log deletion
    await this.logWebhookEvent(webhookId, "deleted", {
      userId,
      url: webhook.url,
    });

    return { success: true, id: webhookId };
  }

  /**
   * Test webhook
   */
  async testWebhook(webhookId, userId, testData = null) {
    const webhook = await this.getWebhookById(webhookId);
    if (!webhook) {
      throw new NotFoundError("Webhook not found");
    }

    if (webhook.user_id !== userId) {
      throw new ValidationError(
        "You do not have permission to test this webhook",
        403
      );
    }

    // Generate test payload
    const event = testData?.event || "url.created";
    const customData = testData?.customData || {};

    const payload = webhookUtils.formatWebhookPayload(event, {
      id: `test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      test: true,
      ...customData,
      webhook_id: webhookId,
      user_id: userId,
    });

    // Send test request
    const startTime = Date.now();
    let response;
    let success = false;
    let error = null;

    try {
      response = await this.sendWebhookRequest(
        webhook.url,
        payload,
        webhook.secret
      );
      success = true;
    } catch (err) {
      error = err.message;
      response = err.response;
    }

    const responseTime = Date.now() - startTime;

    // Log test result
    await this.logWebhookEvent(webhookId, "test", {
      userId,
      success,
      responseTime,
      statusCode: response?.status || 0,
      error,
    });

    return {
      success,
      responseTime,
      statusCode: response?.status || 0,
      response: response?.data || null,
      error,
      payload,
    };
  }

  /**
   * Test webhook connection (internal)
   */
  async testWebhookConnection(webhookId) {
    const webhook = await this.getWebhookById(webhookId);
    if (!webhook) {
      return;
    }

    const testPayload = {
      event: "webhook.test",
      timestamp: new Date().toISOString(),
      data: {
        message: "Webhook connection test",
        webhook_id: webhookId,
      },
    };

    try {
      await this.sendWebhookRequest(
        webhook.url,
        testPayload,
        webhook.secret,
        5000 // 5 second timeout for test
      );
      // Update webhook status if successful
      await this.db.executeQuery(
        "UPDATE webhooks SET failure_count = 0, updated_at = NOW() WHERE id = $1",
        [webhookId]
      );
    } catch (error) {
      // Just log the error, don't throw
      console.error(
        `Webhook connection test failed for ${webhookId}:`,
        error.message
      );
    }
  }

  /**
   * Trigger webhook
   */
  async triggerWebhook(event, data, userId = null) {
    // Build query to find matching webhooks
    let query = `
      SELECT * FROM webhooks 
      WHERE is_active = true 
      AND events IS NOT NULL
    `;

    const params = [];

    if (userId) {
      query += " AND user_id = $1";
      params.push(userId);
    }

    const webhooks = await this.db.executeQuery(query, params);

    // Filter webhooks that have the event
    const matchingWebhooks = webhooks.filter((w) => {
      try {
        const events =
          typeof w.events === "string" ? JSON.parse(w.events) : w.events;
        return events && events.includes(event);
      } catch {
        return false;
      }
    });

    if (matchingWebhooks.length === 0) {
      return { triggered: 0, webhooks: [] };
    }

    // Queue webhook delivery for each matching webhook
    const results = [];
    for (const webhook of matchingWebhooks) {
      try {
        const jobId = await this.queue.addJob(
          "webhook-delivery",
          {
            webhookId: webhook.id,
            url: webhook.url,
            secret: webhook.secret,
            event,
            data,
          },
          {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 1000,
            },
          }
        );

        results.push({
          webhookId: webhook.id,
          jobId,
          status: "queued",
        });

        // Log trigger
        await this.logWebhookEvent(webhook.id, "triggered", {
          event,
          dataKeys: Object.keys(data),
        });
      } catch (error) {
        console.error(`Failed to queue webhook ${webhook.id}:`, error);
        results.push({
          webhookId: webhook.id,
          status: "failed",
          error: error.message,
        });

        // Increment failure count
        await this.db.executeQuery(
          "UPDATE webhooks SET failure_count = failure_count + 1 WHERE id = $1",
          [webhook.id]
        );
      }
    }

    return {
      triggered: results.length,
      webhooks: results,
    };
  }

  /**
   * Send webhook request
   */
  async sendWebhookRequest(url, payload, secret, timeout = 10000) {
    // Generate signature if secret is provided
    const headers = {
      "Content-Type": "application/json",
      "User-Agent": "URL-Shortener-Webhook/1.0",
    };

    if (secret) {
      const signature = webhookUtils.generateSignature(payload, secret);
      headers["X-Webhook-Signature"] = signature;
    }

    // Send request with timeout and retry
    try {
      const response = await axios.post(url, payload, {
        headers,
        timeout,
        maxRedirects: 5,
        validateStatus: (status) => status < 400, // Don't throw on 4xx/5xx
      });

      return response;
    } catch (error) {
      if (error.response) {
        // Server responded with error
        return error.response;
      } else if (error.request) {
        // No response received
        throw new Error(`No response from webhook server: ${error.message}`);
      } else {
        // Request setup error
        throw new Error(`Failed to send webhook: ${error.message}`);
      }
    }
  }

  /**
   * Handle webhook failure
   */
  async handleWebhookFailure(webhookId) {
    const webhook = await this.getWebhookById(webhookId);
    if (!webhook) {
      return;
    }

    // Increment failure count
    await this.db.executeQuery(
      "UPDATE webhooks SET failure_count = failure_count + 1, updated_at = NOW() WHERE id = $1",
      [webhookId]
    );

    // If failure count exceeds threshold, deactivate webhook
    if (webhook.failure_count >= 10) {
      await this.db.executeQuery(
        "UPDATE webhooks SET is_active = false, updated_at = NOW() WHERE id = $1",
        [webhookId]
      );

      // Log deactivation
      await this.logWebhookEvent(webhookId, "deactivated", {
        reason: "Excessive failures",
        failureCount: webhook.failure_count + 1,
      });
    }

    // Clear cache
    await this.cache.delete(`webhook:${webhookId}`);
  }

  /**
   * Get webhook events
   */
  async getWebhookEvents(webhookId, userId, pagination = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = pagination;
    const offset = (page - 1) * limit;

    // Verify ownership
    const webhook = await this.getWebhookById(webhookId);
    if (!webhook) {
      throw new NotFoundError("Webhook not found");
    }

    if (webhook.user_id !== userId) {
      throw new ValidationError(
        "You do not have permission to view these logs",
        403
      );
    }

    // Get events from logs
    const sortColumn = sortBy === "createdAt" ? "created_at" : sortBy;
    const query = `
      SELECT * FROM webhook_events 
      WHERE webhook_id = $1
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $2 OFFSET $3
    `;

    const events = await this.db.executeQuery(query, [
      webhookId,
      limit,
      offset,
    ]);

    // Get total count
    const countResult = await this.db.executeQuery(
      "SELECT COUNT(*) as total FROM webhook_events WHERE webhook_id = $1",
      [webhookId]
    );
    const total = parseInt(countResult[0].total);

    return {
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }

  /**
   * Log webhook event
   */
  async logWebhookEvent(webhookId, event, metadata = {}) {
    await this.db.executeQuery(
      `INSERT INTO webhook_events (id, webhook_id, event, metadata, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [uuidv4(), webhookId, event, JSON.stringify(metadata)]
    );
  }

  /**
   * Get max webhooks for plan
   */
  getMaxWebhooksForPlan(plan) {
    const limits = {
      free: 3,
      pro: 10,
      business: 25,
      enterprise: 100,
    };
    return limits[plan] || 3;
  }

  /**
   * Process webhook delivery (called by queue worker)
   */
  async processWebhookDelivery(jobData) {
    const { webhookId, url, secret, event, data } = jobData;

    // Get webhook to ensure it's still active
    const webhook = await this.getWebhookById(webhookId);
    if (!webhook || !webhook.is_active) {
      return { status: "skipped", reason: "Webhook inactive or deleted" };
    }

    // Format payload
    const payload = webhookUtils.formatWebhookPayload(event, {
      ...data,
      webhook_id: webhookId,
      delivered_at: new Date().toISOString(),
    });

    try {
      const response = await this.sendWebhookRequest(url, payload, secret);

      // Log success
      await this.logWebhookEvent(webhookId, "delivered", {
        statusCode: response.status,
        responseTime: response.headers["x-response-time"] || "unknown",
      });

      // Reset failure count
      await this.db.executeQuery(
        "UPDATE webhooks SET failure_count = 0, last_triggered_at = NOW(), updated_at = NOW() WHERE id = $1",
        [webhookId]
      );

      return {
        status: "success",
        statusCode: response.status,
        response: response.data,
      };
    } catch (error) {
      // Log failure
      await this.logWebhookEvent(webhookId, "failed", {
        error: error.message,
        statusCode: error.response?.status || 0,
      });

      // Handle failure (increment count, possibly deactivate)
      await this.handleWebhookFailure(webhookId);

      throw error; // Re-throw for retry
    }
  }
}

module.exports = WebhookService;
