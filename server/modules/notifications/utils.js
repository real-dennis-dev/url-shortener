// src/modules/notifications/utils.js
const notificationUtils = {
  /**
   * Format notification message from template
   */
  formatNotificationTemplate: (template, data) => {
    if (!template) return "";

    let formatted = template;

    // Replace all {variable} placeholders
    const matches = template.match(/\{([^}]+)\}/g);
    if (matches) {
      for (const match of matches) {
        const key = match.slice(1, -1);
        let value = data[key] !== undefined ? data[key] : "";

        // Handle special transformations
        if (key.includes("|")) {
          const [varName, transform] = key.split("|");
          const originalValue =
            data[varName] !== undefined ? data[varName] : "";

          switch (transform) {
            case "upper":
              value = String(originalValue).toUpperCase();
              break;
            case "lower":
              value = String(originalValue).toLowerCase();
              break;
            case "capitalize":
              value =
                String(originalValue).charAt(0).toUpperCase() +
                String(originalValue).slice(1);
              break;
            default:
              value = originalValue;
          }
        }

        formatted = formatted.replace(new RegExp(`\\{${key}\\}`, "g"), value);
      }
    }

    return formatted;
  },

  /**
   * Validate email format
   */
  validateEmail: (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  },

  /**
   * Build email template HTML
   */
  buildEmailTemplate: (template, data) => {
    // This is now handled by the database templates
    // This method is kept for backward compatibility
    return notificationUtils.formatNotificationTemplate(template, data);
  },

  /**
   * Get default template variables
   */
  getDefaultTemplateVariables: () => {
    return {
      app_name: process.env.APP_NAME || "URL Shortener",
      app_url: process.env.APP_URL || "https://yourdomain.com",
      support_email: process.env.SUPPORT_EMAIL || "support@yourdomain.com",
      current_year: new Date().getFullYear(),
    };
  },

  /**
   * Merge template variables with defaults
   */
  mergeTemplateVariables: (variables = {}) => {
    const defaults = notificationUtils.getDefaultTemplateVariables();
    return { ...defaults, ...variables };
  },

  /**
   * Validate template structure
   */
  validateTemplateStructure: (template, type) => {
    const errors = [];

    if (!template.name) {
      errors.push("Template name is required");
    }

    if (type === "email") {
      if (!template.subject) errors.push("Email subject is required");
      if (!template.htmlContent) errors.push("Email HTML content is required");
    }

    if (type === "notification") {
      if (!template.title) errors.push("Notification title is required");
      if (!template.messageTemplate)
        errors.push("Notification message template is required");
    }

    // Validate variables format
    if (template.variables && !Array.isArray(template.variables)) {
      errors.push("Variables must be an array");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Extract variables from template
   */
  extractVariables: (template) => {
    const regex = /\{([^}]+)\}/g;
    const matches = template.match(regex);

    if (!matches) return [];

    // Remove duplicates and clean
    const variables = new Set();
    for (const match of matches) {
      const key = match.slice(1, -1);
      // Remove any transformations
      const cleanKey = key.split("|")[0];
      variables.add(cleanKey);
    }

    return Array.from(variables);
  },

  /**
   * Preview template with sample data
   */
  previewTemplate: (template, type, sampleData = {}) => {
    const defaults = notificationUtils.getDefaultTemplateVariables();
    const variables = { ...defaults, ...sampleData };

    if (type === "email") {
      return {
        subject: notificationUtils.formatNotificationTemplate(
          template.subject,
          variables
        ),
        html: notificationUtils.formatNotificationTemplate(
          template.htmlContent,
          variables
        ),
        text: template.textContent
          ? notificationUtils.formatNotificationTemplate(
              template.textContent,
              variables
            )
          : notificationUtils
              .formatNotificationTemplate(template.htmlContent, variables)
              .replace(/<[^>]*>/g, ""),
      };
    } else {
      return {
        title: notificationUtils.formatNotificationTemplate(
          template.title,
          variables
        ),
        message: notificationUtils.formatNotificationTemplate(
          template.messageTemplate,
          variables
        ),
      };
    }
  },

  /**
   * Sanitize template input
   */
  sanitizeTemplateInput: (input) => {
    // Remove any dangerous HTML/JS
    const sanitized = input
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+=/gi, "")
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "");

    return sanitized;
  },

  /**
   * Get template categories
   */
  getTemplateCategories: () => {
    return [
      "welcome",
      "verification",
      "security",
      "moderation",
      "analytics",
      "url_management",
      "system",
      "general",
      "marketing",
      "custom",
    ];
  },

  /**
   * Validate template variables
   */
  validateVariables: (template, variables) => {
    const requiredVars = template.variables || [];
    const missing = [];
    const extra = [];

    for (const varName of requiredVars) {
      if (!variables[varName] && variables[varName] !== "") {
        missing.push(varName);
      }
    }

    for (const key of Object.keys(variables)) {
      if (!requiredVars.includes(key)) {
        extra.push(key);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      extra,
      message:
        missing.length > 0
          ? `Missing required variables: ${missing.join(", ")}`
          : "All required variables provided",
    };
  },
};

module.exports = notificationUtils;
