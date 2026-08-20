// src/modules/system/utils.js
const os = require("os");

const systemUtils = {
  /**
   * Get system metrics
   */
  getSystemMetrics: () => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usagePercent: ((usedMem / totalMem) * 100).toFixed(2),
        totalGB: (totalMem / 1024 ** 3).toFixed(2),
        freeGB: (freeMem / 1024 ** 3).toFixed(2),
        usedGB: (usedMem / 1024 ** 3).toFixed(2),
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || "Unknown",
        speed: os.cpus()[0]?.speed || 0,
        loadAverage: {
          "1min": os.loadavg()[0],
          "5min": os.loadavg()[1],
          "15min": os.loadavg()[2],
        },
      },
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        uptime: os.uptime(),
      },
      network: {
        interfaces: os.networkInterfaces(),
      },
    };
  },

  /**
   * Validate settings format
   */
  validateSettings: (settings) => {
    const errors = [];
    const validators = {
      max_url_length: (value) => {
        if (typeof value !== "number" || value < 100 || value > 10000) {
          errors.push("max_url_length must be between 100 and 10000");
        }
      },
      allowed_domains: (value) => {
        if (!Array.isArray(value) || value.some((d) => typeof d !== "string")) {
          errors.push("allowed_domains must be an array of strings");
        }
      },
      rate_limits: (value) => {
        if (
          typeof value !== "object" ||
          !value.anonymous ||
          !value.authenticated
        ) {
          errors.push(
            "rate_limits must be an object with anonymous and authenticated properties"
          );
        }
        if (
          value.anonymous &&
          (typeof value.anonymous !== "number" || value.anonymous < 1)
        ) {
          errors.push("rate_limits.anonymous must be a positive number");
        }
        if (
          value.authenticated &&
          (typeof value.authenticated !== "number" || value.authenticated < 1)
        ) {
          errors.push("rate_limits.authenticated must be a positive number");
        }
      },
      qr_settings: (value) => {
        if (typeof value !== "object") {
          errors.push("qr_settings must be an object");
        }
        if (
          value.default_size &&
          (typeof value.default_size !== "number" || value.default_size < 100)
        ) {
          errors.push("qr_settings.default_size must be at least 100");
        }
        if (
          value.allowed_formats &&
          (!Array.isArray(value.allowed_formats) ||
            value.allowed_formats.some(
              (f) => !["png", "svg", "jpg"].includes(f)
            ))
        ) {
          errors.push(
            "qr_settings.allowed_formats must be an array of png, svg, or jpg"
          );
        }
      },
      maintenance_mode: (value) => {
        if (typeof value !== "boolean") {
          errors.push("maintenance_mode must be a boolean");
        }
      },
      short_code_length: (value) => {
        if (typeof value !== "number" || value < 3 || value > 10) {
          errors.push("short_code_length must be between 3 and 10");
        }
      },
      max_short_code_length: (value) => {
        if (typeof value !== "number" || value < 5 || value > 30) {
          errors.push("max_short_code_length must be between 5 and 30");
        }
      },
      click_cache_duration: (value) => {
        if (typeof value !== "number" || value < 60 || value > 86400) {
          errors.push("click_cache_duration must be between 60 and 86400");
        }
      },
      bulk_upload_max_rows: (value) => {
        if (typeof value !== "number" || value < 100 || value > 100000) {
          errors.push("bulk_upload_max_rows must be between 100 and 100000");
        }
      },
      api_rate_limit: (value) => {
        if (typeof value !== "number" || value < 10 || value > 10000) {
          errors.push("api_rate_limit must be between 10 and 10000");
        }
      },
    };

    for (const [key, value] of Object.entries(settings)) {
      if (validators[key]) {
        validators[key](value);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Parse settings values
   */
  parseSettingValue: (value) => {
    if (typeof value === "string") {
      // Try to parse JSON
      try {
        return JSON.parse(value);
      } catch (e) {
        // If not JSON, return as is
        return value;
      }
    }
    return value;
  },

  /**
   * Format settings for response
   */
  formatSettingsForResponse: (settings) => {
    const formatted = {};
    for (const [key, value] of Object.entries(settings)) {
      formatted[key] = {
        value: value.value,
        description: value.description || "",
        updatedAt: value.updatedAt,
      };
    }
    return formatted;
  },

  /**
   * Get default settings
   */
  getDefaultSettings: () => {
    return {
      max_url_length: 2048,
      allowed_domains: ["*"],
      rate_limits: {
        anonymous: 10,
        authenticated: 100,
        premium: 1000,
      },
      qr_settings: {
        default_size: 300,
        allowed_formats: ["png", "svg"],
      },
      maintenance_mode: false,
      short_code_length: 6,
      max_short_code_length: 20,
      click_cache_duration: 3600,
      bulk_upload_max_rows: 10000,
      api_rate_limit: 1000,
    };
  },

  /**
   * Check if setting is critical
   */
  isCriticalSetting: (key) => {
    const criticalKeys = [
      "maintenance_mode",
      "api_rate_limit",
      "max_url_length",
      "allowed_domains",
    ];
    return criticalKeys.includes(key);
  },

  /**
   * Get setting type
   */
  getSettingType: (key) => {
    const types = {
      max_url_length: "number",
      allowed_domains: "array",
      rate_limits: "object",
      qr_settings: "object",
      maintenance_mode: "boolean",
      short_code_length: "number",
      max_short_code_length: "number",
      click_cache_duration: "number",
      bulk_upload_max_rows: "number",
      api_rate_limit: "number",
    };
    return types[key] || "string";
  },

  /**
   * Validate setting value by type
   */
  validateByType: (value, type) => {
    switch (type) {
      case "number":
        return typeof value === "number" && !isNaN(value);
      case "string":
        return typeof value === "string";
      case "boolean":
        return typeof value === "boolean";
      case "array":
        return Array.isArray(value);
      case "object":
        return (
          typeof value === "object" && value !== null && !Array.isArray(value)
        );
      default:
        return true;
    }
  },

  /**
   * Get system information
   */
  getSystemInfo: () => {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      title: process.title,
      env: process.env.NODE_ENV || "development",
      packageVersion: process.env.npm_package_version || "1.0.0",
      memory: {
        rss: process.memoryUsage().rss,
        heapTotal: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed,
        external: process.memoryUsage().external,
      },
      uptime: process.uptime(),
    };
  },

  /**
   * Format timestamp
   */
  formatTimestamp: (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return {
      iso: date.toISOString(),
      locale: date.toLocaleString(),
      relative: systemUtils.getRelativeTime(date),
    };
  },

  /**
   * Get relative time
   */
  getRelativeTime: (date) => {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "just now";
  },

  /**
   * Format bytes to human readable
   */
  formatBytes: (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  },

  /**
   * Format duration
   */
  formatDuration: (seconds) => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600)
      return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
    if (seconds < 86400)
      return `${Math.floor(seconds / 3600)}h ${Math.floor(
        (seconds % 3600) / 60
      )}m`;
    return `${Math.floor(seconds / 86400)}d ${Math.floor(
      (seconds % 86400) / 3600
    )}h`;
  },

  /**
   * Generate health check summary
   */
  generateHealthSummary: (health) => {
    const summary = {
      status: health.status,
      timestamp: health.timestamp,
      services: {},
      message: "",
    };

    for (const [name, service] of Object.entries(health.services)) {
      summary.services[name] = {
        status: service.status,
        details: service.details || service.error || "OK",
      };
    }

    switch (health.status) {
      case "healthy":
        summary.message = "All systems operational";
        break;
      case "degraded":
        summary.message = "Some services are experiencing issues";
        break;
      case "unhealthy":
        summary.message = "Critical services are down";
        break;
      default:
        summary.message = "Unknown health status";
    }

    return summary;
  },
};

module.exports = systemUtils;
