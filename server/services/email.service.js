// src/services/email.service.js
const dotenv = require("dotenv");
dotenv.config();
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const path = require("path");
const fs = require("fs").promises;
const logger = require("../utils/logger.util");
const { ApiError } = require("../utils/error.util");

class EmailService {
  constructor() {
    this.transporter = null;
    this.emailAvailable = false;

    this.fromEmail = process.env.EMAIL_FROM;
    this.fromName = process.env.EMAIL_FROM_NAME || "URL Shortener";

    this.templateDir =
      process.env.EMAIL_TEMPLATE_DIR ||
      path.join(__dirname, "../templates/email");

    this.baseUrl = process.env.BASE_URL;

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        pool: true,
        maxConnections: 5,
        rateLimit: 10,
      });

      // Verify connection without making email availability
      // a requirement for starting the server.
      this.transporter.verify((error) => {
        if (error) {
          this.emailAvailable = false;

          logger.warn(
            `Email service unavailable: ${error.message}. Server will continue without email functionality.`
          );

          return;
        }

        this.emailAvailable = true;
        logger.info("Email service connected successfully");
      });
    } catch (error) {
      this.emailAvailable = false;

      logger.warn(
        `Failed to initialize email service: ${error.message}. Server will continue without email functionality.`
      );
    }
  }

  /**
   * Send email
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - HTML content
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Send result
   */
  async sendEmail(to, subject, html, options = {}) {
    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        html,
        ...options,
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info(`Email sent to ${to}`, { messageId: info.messageId });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw new ApiError(500, "EMAIL_SEND_FAILED", "Failed to send email");
    }
  }

  /**
   * Send email with template
   * @param {string} to - Recipient email
   * @param {string} template - Template name
   * @param {Object} data - Template data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Send result
   */
  async sendTemplateEmail(to, template, data, options = {}) {
    try {
      const html = await this.renderTemplate(template, data);
      const subject = this.getTemplateSubject(template, data);

      return this.sendEmail(to, subject, html, options);
    } catch (error) {
      logger.error(`Failed to send template email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Render email template
   * @param {string} template - Template name
   * @param {Object} data - Template data
   * @returns {Promise<string>} - Rendered HTML
   */
  async renderTemplate(template, data) {
    try {
      const templatePath = path.join(this.templateDir, `${template}.html`);
      const templateContent = await fs.readFile(templatePath, "utf-8");
      const compiled = handlebars.compile(templateContent);

      // Add common data
      const context = {
        ...data,
        baseUrl: this.baseUrl,
        year: new Date().getFullYear(),
      };

      return compiled(context);
    } catch (error) {
      logger.error(`Failed to render template ${template}:`, error);
      throw new ApiError(
        500,
        "TEMPLATE_RENDER_FAILED",
        "Failed to render email template"
      );
    }
  }

  /**
   * Get template subject
   * @param {string} template - Template name
   * @param {Object} data - Template data
   * @returns {string} - Email subject
   */
  getTemplateSubject(template, data) {
    const subjects = {
      verification: `Verify your email address - ${this.fromName}`,
      "password-reset": `Reset your password - ${this.fromName}`,
      welcome: `Welcome to ${this.fromName}!`,
      notification: data.subject || `Notification from ${this.fromName}`,
      "bulk-upload-complete": `Bulk upload completed - ${this.fromName}`,
      "url-expiring": `URL expiring soon - ${this.fromName}`,
      "plan-upgrade": `Plan upgrade successful - ${this.fromName}`,
      "security-alert": `Security alert - ${this.fromName}`,
    };

    return subjects[template] || `Message from ${this.fromName}`;
  }

  /**
   * Send verification email
   * @param {string} email - User email
   * @param {string} token - Verification token
   * @param {string} name - User name
   * @returns {Promise<Object>} - Send result
   */
  async sendVerificationEmail(email, token, name = "") {
    const data = {
      name: name || "User",
      verificationLink: `${this.baseUrl}/auth/verify-email/${token}`,
      token,
    };

    return this.sendTemplateEmail(email, "verification", data);
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @param {string} token - Reset token
   * @returns {Promise<Object>} - Send result
   */
  async sendPasswordResetEmail(email, token) {
    const data = {
      resetLink: `${this.baseUrl}/auth/reset-password/${token}`,
      token,
    };

    return this.sendTemplateEmail(email, "password-reset", data);
  }

  /**
   * Send welcome email
   * @param {string} email - User email
   * @param {string} name - User name
   * @returns {Promise<Object>} - Send result
   */
  async sendWelcomeEmail(email, name) {
    const data = {
      name: name || "User",
      loginLink: `${this.baseUrl}/login`,
      documentationLink: `${this.baseUrl}/docs`,
    };

    return this.sendTemplateEmail(email, "welcome", data);
  }

  /**
   * Send notification email
   * @param {string} email - User email
   * @param {string} subject - Notification subject
   * @param {string} content - Notification content
   * @param {string} type - Notification type
   * @returns {Promise<Object>} - Send result
   */
  async sendNotificationEmail(email, subject, content, type = "info") {
    const data = {
      subject,
      content,
      type,
      actionLink: `${this.baseUrl}/notifications`,
    };

    return this.sendTemplateEmail(email, "notification", data);
  }

  /**
   * Send bulk email
   * @param {Array} recipients - Array of recipient objects
   * @param {string} subject - Email subject
   * @param {string} html - HTML content
   * @returns {Promise<Object>} - Send result
   */
  async sendBulkEmail(recipients, subject, html) {
    try {
      const results = {
        success: [],
        failed: [],
      };

      // Process in batches to avoid rate limits
      const batchSize = 50;
      const batches = this._chunkArray(recipients, batchSize);

      for (const batch of batches) {
        const promises = batch.map((recipient) => {
          return this.sendEmail(recipient.email, subject, html)
            .then((result) => {
              results.success.push(recipient.email);
              return result;
            })
            .catch((error) => {
              results.failed.push({
                email: recipient.email,
                error: error.message,
              });
              return null;
            });
        });

        await Promise.all(promises);
      }

      return results;
    } catch (error) {
      logger.error("Bulk email send failed:", error);
      throw new ApiError(
        500,
        "BULK_EMAIL_FAILED",
        "Failed to send bulk emails"
      );
    }
  }

  /**
   * Chunk array for batch processing
   * @param {Array} array - Array to chunk
   * @param {number} size - Chunk size
   * @returns {Array} - Array of chunks
   */
  _chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Check email service health
   * @returns {Promise<boolean>} - Health status
   */
  async healthCheck() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error("Email service health check failed:", error);
      return false;
    }
  }
}

module.exports = EmailService;
