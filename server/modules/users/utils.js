// src/modules/users/utils.js
const Joi = require("joi");

const userUtils = {
  /**
   * Validate user profile data
   */
  validateProfileData: (data) => {
    const errors = [];

    // Validate full name
    if (data.fullName !== undefined) {
      if (
        typeof data.fullName !== "string" ||
        data.fullName.length < 2 ||
        data.fullName.length > 100
      ) {
        errors.push("Full name must be between 2 and 100 characters");
      }
    }

    // Validate avatar URL
    if (data.avatarUrl !== undefined) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(data.avatarUrl)) {
        errors.push("Avatar URL must be a valid URL");
      }
    }

    // Validate email
    if (data.email !== undefined) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(data.email)) {
        errors.push("Invalid email format");
      }
    }

    // Validate preferences
    if (data.preferences !== undefined) {
      if (typeof data.preferences !== "object") {
        errors.push("Preferences must be an object");
      } else {
        const schema = Joi.object({
          theme: Joi.string().valid("light", "dark", "system"),
          notifications: Joi.boolean(),
          language: Joi.string().length(2),
          timezone: Joi.string(),
          emailNotifications: Joi.boolean(),
          pushNotifications: Joi.boolean(),
          analyticsOptOut: Joi.boolean(),
        });

        const { error } = schema.validate(data.preferences);
        if (error) {
          errors.push(`Invalid preferences: ${error.details[0].message}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Sanitize user input
   */
  sanitizeUserInput: (input) => {
    if (typeof input !== "string") return input;

    // Trim whitespace
    let sanitized = input.trim();

    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, "");

    // Remove special characters (keep only alphanumeric, spaces, and common punctuation)
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_.]/g, "");

    // Normalize multiple spaces
    sanitized = sanitized.replace(/\s+/g, " ");

    return sanitized;
  },

  /**
   * Format user data for response
   */
  formatUserResponse: (user) => {
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name || "",
      avatarUrl: user.avatar_url || null,
      role: user.role || "user",
      plan: user.plan || "free",
      preferences: user.preferences || {
        theme: "light",
        notifications: true,
        language: "en",
        timezone: "UTC",
      },
      quotaLimit: user.quota_limit || 100,
      totalClicks: parseInt(user.total_clicks) || 0,
      lastLogin: user.last_login || null,
      emailVerified: user.email_verified || false,
      status: user.status || "active",
      isOnline: user.is_online || false,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  },

  /**
   * Calculate quota usage
   */
  calculateQuotaUsage: (user) => {
    const used = user.total_urls || 0;
    const total = user.quota_limit || 100;
    const percentage = total > 0 ? (used / total) * 100 : 0;

    return {
      used,
      total,
      percentage: Math.min(percentage, 100),
      remaining: Math.max(total - used, 0),
      isExceeded: used >= total,
    };
  },

  /**
   * Get plan limits
   */
  getPlanLimits: (plan) => {
    const limits = {
      free: {
        urls: 100,
        clicks: 1000,
        apiRequests: 100,
        features: ["basic_analytics", "qr_codes"],
      },
      pro: {
        urls: 1000,
        clicks: 10000,
        apiRequests: 1000,
        features: [
          "advanced_analytics",
          "qr_codes",
          "custom_domain",
          "bulk_upload",
        ],
      },
      business: {
        urls: 10000,
        clicks: 100000,
        apiRequests: 10000,
        features: [
          "advanced_analytics",
          "qr_codes",
          "custom_domain",
          "bulk_upload",
          "api_access",
          "webhooks",
        ],
      },
      enterprise: {
        urls: 100000,
        clicks: 1000000,
        apiRequests: 100000,
        features: [
          "all_features",
          "dedicated_support",
          "sla_guarantee",
          "white_label",
        ],
      },
    };

    return limits[plan] || limits.free;
  },

  /**
   * Generate random username if needed
   */
  generateUsername: (email) => {
    const username = email.split("@")[0];
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${username}_${randomSuffix}`;
  },

  /**
   * Check if user can perform action based on plan
   */
  canPerformAction: (user, action) => {
    const planLimits = userUtils.getPlanLimits(user.plan);
    return planLimits.features.includes(action);
  },

  /**
   * Format activity data
   */
  formatActivity: (activity) => {
    const activityMap = {
      url_created: "Created a new short URL",
      url_updated: "Updated a short URL",
      url_deleted: "Deleted a short URL",
      url_clicked: "Clicked a short URL",
      api_key_regenerated: "Regenerated API key",
      password_changed: "Changed password",
      plan_updated: "Updated plan",
      profile_updated: "Updated profile",
      preferences_updated: "Updated preferences",
    };

    return {
      ...activity,
      description: activityMap[activity.activity_type] || activity.description,
      formattedDate: new Date(activity.created_at).toLocaleString(),
    };
  },

  /**
   * Validate password strength
   */
  validatePasswordStrength: (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const strength =
      {
        0: "very_weak",
        1: "weak",
        2: "medium",
        3: "strong",
        4: "very_strong",
        5: "excellent",
      }[score] || "weak";

    return {
      valid: score >= 3,
      score,
      strength,
      checks,
      feedback: this.getPasswordFeedback(checks),
    };
  },

  /**
   * Get password feedback
   */
  getPasswordFeedback: (checks) => {
    const feedback = [];
    if (!checks.length) feedback.push("Password must be at least 8 characters");
    if (!checks.uppercase)
      feedback.push("Include at least one uppercase letter");
    if (!checks.lowercase)
      feedback.push("Include at least one lowercase letter");
    if (!checks.number) feedback.push("Include at least one number");
    if (!checks.special)
      feedback.push("Include at least one special character (@$!%*?&)");
    return feedback;
  },

  /**
   * Mask sensitive data
   */
  maskSensitiveData: (data) => {
    const masked = { ...data };

    if (masked.email) {
      const [username, domain] = masked.email.split("@");
      masked.email = `${username.substring(0, 2)}****@${domain}`;
    }

    if (masked.apiKey) {
      masked.apiKey = `${masked.apiKey.substring(
        0,
        4
      )}...${masked.apiKey.substring(masked.apiKey.length - 4)}`;
    }

    return masked;
  },
};

module.exports = userUtils;
