// src/modules/webhooks/utils.js
const crypto = require("crypto");

const webhookUtils = {
  /**
   * Generate webhook signature
   */
  generateSignature: (payload, secret) => {
    // Convert payload to string if it's an object
    const payloadStr =
      typeof payload === "string" ? payload : JSON.stringify(payload);

    // Create HMAC SHA256 signature
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payloadStr);
    return hmac.digest("hex");
  },

  /**
   * Validate webhook signature
   */
  validateSignature: (payload, signature, secret) => {
    if (!signature || !secret) {
      return false;
    }

    const expectedSignature = webhookUtils.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  },

  /**
   * Format webhook payload
   */
  formatWebhookPayload: (event, data = {}) => {
    const timestamp = new Date().toISOString();

    return {
      event,
      timestamp,
      data: {
        ...data,
        received_at: timestamp,
      },
      // Include metadata
      metadata: {
        source: "url-shortener",
        version: "1.0.0",
        event_id: crypto.randomBytes(16).toString("hex"),
      },
    };
  },

  /**
   * Retry webhook with exponential backoff
   */
  retryWithBackoff: async (fn, maxRetries = 3) => {
    let lastError;
    let delay = 1000; // Start with 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff with jitter
        const jitter = Math.random() * 200;
        const waitTime = Math.min(delay + jitter, 30000); // Max 30 seconds

        console.log(`Retry ${attempt}/${maxRetries} after ${waitTime}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));

        delay *= 2; // Double the delay for next attempt
      }
    }

    throw lastError;
  },

  /**
   * Validate webhook URL
   */
  validateWebhookUrl: (url) => {
    try {
      const parsed = new URL(url);

      // Must use http or https
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { valid: false, error: "URL must use HTTP or HTTPS protocol" };
      }

      // Block localhost and private IPs for security
      const hostname = parsed.hostname;
      const privateIPs = [
        "localhost",
        "127.0.0.1",
        "::1",
        "10.0.0.0",
        "172.16.0.0",
        "192.168.0.0",
      ];

      if (privateIPs.some((ip) => hostname.startsWith(ip))) {
        return {
          valid: false,
          error: "Localhost and private IPs are not allowed",
        };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: "Invalid URL format" };
    }
  },

  /**
   * Parse events from string or array
   */
  parseEvents: (events) => {
    if (typeof events === "string") {
      try {
        return JSON.parse(events);
      } catch {
        return events.split(",").map((e) => e.trim());
      }
    }
    return events || [];
  },

  /**
   * Check if webhook matches event
   */
  matchesEvent: (webhookEvents, event) => {
    const events = webhookUtils.parseEvents(webhookEvents);
    return events.includes(event) || events.includes("*");
  },

  /**
   * Generate random webhook secret
   */
  generateSecret: (length = 32) => {
    return crypto.randomBytes(length).toString("hex");
  },

  /**
   * Sanitize webhook data for logging
   */
  sanitizeForLogging: (data) => {
    if (!data) return null;

    const sanitized = { ...data };
    const sensitiveKeys = [
      "secret",
      "password",
      "token",
      "apiKey",
      "authorization",
    ];

    for (const key of sensitiveKeys) {
      if (sanitized[key] !== undefined) {
        sanitized[key] = "[REDACTED]";
      }
    }

    return sanitized;
  },

  /**
   * Get webhook status based on failure count
   */
  getWebhookStatus: (isActive, failureCount) => {
    if (!isActive) {
      return "inactive";
    }
    if (failureCount >= 10) {
      return "deactivated";
    }
    if (failureCount >= 5) {
      return "degraded";
    }
    return "active";
  },

  /**
   * Format webhook response
   */
  formatWebhookResponse: (webhook) => {
    return {
      id: webhook.id,
      url: webhook.url,
      events: webhookUtils.parseEvents(webhook.events),
      isActive: webhook.is_active,
      status: webhookUtils.getWebhookStatus(
        webhook.is_active,
        webhook.failure_count
      ),
      failureCount: webhook.failure_count,
      lastTriggeredAt: webhook.last_triggered_at,
      createdAt: webhook.created_at,
      updatedAt: webhook.updated_at,
    };
  },
};

module.exports = webhookUtils;
