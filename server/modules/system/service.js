// src/modules/system/service.js
const os = require("os");
const process = require("process");
const DatabaseService = require("../../services/database.service");
const CacheService = require("../../services/cache.service");
const systemUtils = require("./utils");
const { ValidationError } = require("../../utils/errors");

class SystemService {
  constructor() {
    this.db = new DatabaseService();
    this.cache = new CacheService();
  }

  /**
   * Get system settings
   */
  async getSystemSettings(keys = null) {
    try {
      // Try cache first
      const cacheKey = "system:settings:all";
      let settings = await this.cache.get(cacheKey);

      if (!settings) {
        // Get all settings from database
        const result = await this.db.executeQuery(
          "SELECT key, value, description, updated_at FROM system_settings ORDER BY key"
        );

        settings = {};
        for (const row of result) {
          // Parse JSON values
          try {
            settings[row.key] = {
              value: JSON.parse(row.value),
              description: row.description,
              updatedAt: row.updated_at,
            };
          } catch (e) {
            // If not JSON, keep as string
            settings[row.key] = {
              value: row.value,
              description: row.description,
              updatedAt: row.updated_at,
            };
          }
        }

        // Cache for 1 hour
        await this.cache.set(cacheKey, settings, 3600);
      }

      // Filter by keys if provided
      if (keys && keys.length > 0) {
        const filtered = {};
        for (const key of keys) {
          if (settings[key]) {
            filtered[key] = settings[key];
          }
        }
        return filtered;
      }

      return settings;
    } catch (error) {
      console.error("Error getting system settings:", error);
      throw error;
    }
  }

  /**
   * Update system settings
   */
  async updateSystemSettings(settings, adminId) {
    try {
      const updates = [];
      const params = [];
      let paramCounter = 1;

      // Validate settings before updating
      const validation = systemUtils.validateSettings(settings);
      if (!validation.valid) {
        throw new ValidationError(validation.errors.join(", "));
      }

      // Prepare update queries
      for (const [key, value] of Object.entries(settings)) {
        // Parse and validate value
        const parsedValue = systemUtils.parseSettingValue(value);

        updates.push({
          query: `
            INSERT INTO system_settings (key, value, description, updated_by, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (key) 
            DO UPDATE SET 
              value = EXCLUDED.value,
              updated_by = EXCLUDED.updated_by,
              updated_at = NOW()
            RETURNING *
          `,
          params: [
            key,
            JSON.stringify(parsedValue),
            this.getSettingDescription(key),
            adminId,
          ],
        });
        paramCounter += 4;
      }

      // Execute all updates in a transaction
      const results = await this.db.transaction(updates);

      // Build updated settings object
      const updatedSettings = {};
      for (const result of results) {
        if (result && result.length > 0) {
          const row = result[0];
          try {
            updatedSettings[row.key] = {
              value: JSON.parse(row.value),
              description: row.description,
              updatedAt: row.updated_at,
            };
          } catch (e) {
            updatedSettings[row.key] = {
              value: row.value,
              description: row.description,
              updatedAt: row.updated_at,
            };
          }
        }
      }

      // Clear cache
      await this.cache.delete("system:settings:all");

      // If maintenance mode was updated, clear maintenance cache
      if (settings.maintenance_mode !== undefined) {
        await this.cache.delete("system:maintenance");
      }

      // Log the update
      await this.logSystemOperation(adminId, "settings_update", {
        updatedSettings: Object.keys(settings),
      });

      return updatedSettings;
    } catch (error) {
      console.error("Error updating system settings:", error);
      throw error;
    }
  }

  /**
   * Get setting description
   */
  getSettingDescription(key) {
    const descriptions = {
      max_url_length: "Maximum allowed URL length",
      allowed_domains: 'List of allowed domains or "*" for all',
      rate_limits: "Rate limits per minute for different user types",
      qr_settings: "QR code generation settings",
      maintenance_mode: "System maintenance mode flag",
      short_code_length: "Default short code length",
      max_short_code_length: "Maximum short code length",
      click_cache_duration: "Click analytics cache duration in seconds",
      bulk_upload_max_rows: "Maximum rows per bulk upload",
      api_rate_limit: "Default API rate limit per minute",
    };
    return descriptions[key] || "System setting";
  }

  /**
   * Health check
   */
  async healthCheck() {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: await this.checkDatabaseHealth(),
        cache: await this.checkCacheHealth(),
        queue: await this.checkQueueHealth(),
        email: await this.checkEmailHealth(),
      },
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
    };

    // Determine overall status
    const unhealthyServices = Object.values(health.services).filter(
      (service) => service.status === "unhealthy"
    );

    if (unhealthyServices.length > 0) {
      health.status = "degraded";
      health.unhealthyServices = unhealthyServices.map((s) => s.name);
    }

    // Check if any service is critical and failed
    const criticalServices = ["database", "cache"];
    const criticalFailed = criticalServices.some(
      (service) => health.services[service]?.status === "unhealthy"
    );

    if (criticalFailed) {
      health.status = "unhealthy";
    }

    return health;
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    try {
      const startTime = Date.now();
      await this.db.executeQuery("SELECT 1");
      const responseTime = Date.now() - startTime;

      return {
        name: "database",
        status: "healthy",
        responseTime: `${responseTime}ms`,
        details: "Database connection successful",
      };
    } catch (error) {
      return {
        name: "database",
        status: "unhealthy",
        error: error.message,
        details: "Database connection failed",
      };
    }
  }

  /**
   * Check cache health
   */
  async checkCacheHealth() {
    try {
      const startTime = Date.now();
      await this.cache.set("health:check", "ok", 10);
      const result = await this.cache.get("health:check");
      const responseTime = Date.now() - startTime;

      if (result === "ok") {
        return {
          name: "cache",
          status: "healthy",
          responseTime: `${responseTime}ms`,
          details: "Cache connection successful",
        };
      } else {
        throw new Error("Cache read/write failed");
      }
    } catch (error) {
      return {
        name: "cache",
        status: "unhealthy",
        error: error.message,
        details: "Cache connection failed",
      };
    }
  }

  /**
   * Check queue health
   */
  async checkQueueHealth() {
    try {
      const QueueService = require("../../services/queue.service");
      const queue = new QueueService();
      const stats = await queue.getQueueStats("default");

      return {
        name: "queue",
        status: "healthy",
        details: `Queue is operational. ${stats.waiting || 0} jobs waiting`,
        stats,
      };
    } catch (error) {
      return {
        name: "queue",
        status: "healthy", // Queue is optional, so don't mark as unhealthy
        warning: error.message,
        details: "Queue service is not available",
      };
    }
  }

  /**
   * Check email health
   */
  async checkEmailHealth() {
    try {
      const EmailService = require("../../services/email.service");
      const email = new EmailService();

      // Just check if email service is configured
      const configured = process.env.SMTP_HOST && process.env.SMTP_USER;

      return {
        name: "email",
        status: configured ? "healthy" : "warning",
        details: configured
          ? "Email service configured"
          : "Email service not configured",
      };
    } catch (error) {
      return {
        name: "email",
        status: "warning",
        error: error.message,
        details: "Email service not available",
      };
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus() {
    const status = {
      uptime: {
        process: process.uptime(),
        system: os.uptime(),
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: (
          ((os.totalmem() - os.freemem()) / os.totalmem()) *
          100
        ).toFixed(2),
        process: process.memoryUsage(),
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || "Unknown",
        loadAverage: os.loadavg(),
        usage: await this.getCpuUsage(),
      },
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
      },
      activeUsers: await this.getActiveUsers(),
      activeSessions: await this.getActiveSessions(),
      timestamp: new Date().toISOString(),
    };

    return status;
  }

  /**
   * Get CPU usage percentage
   */
  async getCpuUsage() {
    try {
      const cpus = os.cpus();
      const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
      const totalTick = cpus.reduce((acc, cpu) => {
        return acc + Object.values(cpu.times).reduce((a, t) => a + t, 0);
      }, 0);

      const usage = ((totalTick - totalIdle) / totalTick) * 100;
      return Math.round(usage * 100) / 100;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get active users count
   */
  async getActiveUsers() {
    try {
      const result = await this.db.executeQuery(
        `SELECT COUNT(*) as count FROM users 
         WHERE is_online = true AND last_login > NOW() - INTERVAL '15 minutes'`
      );
      return parseInt(result[0]?.count || 0);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get active sessions count
   */
  async getActiveSessions() {
    try {
      const result = await this.db.executeQuery(
        `SELECT COUNT(*) as count FROM user_tokens 
         WHERE revoked = false AND expires_at > NOW()`
      );
      return parseInt(result[0]?.count || 0);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Toggle maintenance mode
   */
  async toggleMaintenanceMode(adminId, enable, message = null) {
    try {
      // Get current maintenance mode
      const currentSettings = await this.getSystemSettings([
        "maintenance_mode",
      ]);
      const currentMode = currentSettings.maintenance_mode?.value === true;

      if (currentMode === enable) {
        return {
          success: false,
          message: `Maintenance mode is already ${
            enable ? "enabled" : "disabled"
          }`,
          maintenanceMode: enable,
        };
      }

      // Update maintenance mode
      const updates = {
        maintenance_mode: enable,
      };

      await this.updateSystemSettings(updates, adminId);

      // Clear maintenance cache
      await this.cache.delete("system:maintenance");

      // Log the action
      await this.logSystemOperation(adminId, "maintenance_toggle", {
        enabled: enable,
        message,
      });

      // If enabling, send notification to admins
      if (enable) {
        await this.notifyAdmins(
          "Maintenance Mode Enabled",
          `System maintenance mode has been enabled${
            message ? `: ${message}` : ""
          }`
        );
      }

      return {
        success: true,
        message: `Maintenance mode ${
          enable ? "enabled" : "disabled"
        } successfully`,
        maintenanceMode: enable,
      };
    } catch (error) {
      console.error("Error toggling maintenance mode:", error);
      throw error;
    }
  }

  /**
   * Notify admins about system events
   */
  async notifyAdmins(subject, message) {
    try {
      const QueueService = require("../../services/queue.service");
      const queue = new QueueService();

      await queue.addJob("notify-admins", {
        subject,
        message,
        type: "system",
      });
    } catch (error) {
      console.error("Error notifying admins:", error);
    }
  }

  /**
   * Log system operation
   */
  async logSystemOperation(userId, operation, metadata = {}) {
    try {
      await this.db.executeQuery(
        `INSERT INTO api_logs (user_id, endpoint, method, request_body, created_at)
         VALUES ($1, $2, 'SYSTEM', $3, NOW())`,
        [userId, `/system/${operation}`, JSON.stringify(metadata)]
      );
    } catch (error) {
      console.error("Error logging system operation:", error);
    }
  }

  /**
   * Get system metrics for monitoring
   */
  async getSystemMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      memory: systemUtils.getSystemMetrics().memory,
      cpu: systemUtils.getSystemMetrics().cpu,
      process: {
        pid: process.pid,
        title: process.title,
        version: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      system: {
        uptime: os.uptime(),
        loadavg: os.loadavg(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
      },
      database: await this.getDatabaseMetrics(),
      cache: await this.getCacheMetrics(),
    };

    return metrics;
  }

  /**
   * Get database metrics
   */
  async getDatabaseMetrics() {
    try {
      // Get connection pool status
      const pool = this.db.getPool();
      const connections = pool ? pool.totalCount || 0 : 0;
      const available = pool ? pool.idleCount || 0 : 0;

      return {
        connections,
        available,
        status: connections > 0 ? "healthy" : "warning",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
      };
    }
  }

  /**
   * Get cache metrics
   */
  async getCacheMetrics() {
    try {
      const stats = await this.cache.getStats();
      return {
        hits: stats.hits || 0,
        misses: stats.misses || 0,
        keys: stats.keys || 0,
        hitRate:
          stats.hits && stats.misses
            ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2)
            : 0,
        status: "healthy",
      };
    } catch (error) {
      return {
        status: "warning",
        error: error.message,
      };
    }
  }

  /**
   * Clear system cache
   */
  async clearSystemCache() {
    try {
      await this.cache.clear("system:*");
      await this.cache.clear("user:*");
      await this.cache.clear("url:*");

      return {
        success: true,
        message: "System cache cleared successfully",
      };
    } catch (error) {
      throw new Error(`Failed to clear cache: ${error.message}`);
    }
  }

  /**
   * Get system logs
   */
  async getSystemLogs(filters = {}, pagination = {}) {
    const {
      page = 1,
      limit = 50,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = pagination;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramCounter = 1;

    if (filters.operation) {
      whereConditions.push(`endpoint ILIKE $${paramCounter}`);
      params.push(`%${filters.operation}%`);
      paramCounter++;
    }

    if (filters.userId) {
      whereConditions.push(`user_id = $${paramCounter}`);
      params.push(filters.userId);
      paramCounter++;
    }

    if (filters.dateFrom) {
      whereConditions.push(`created_at >= $${paramCounter}`);
      params.push(filters.dateFrom);
      paramCounter++;
    }

    if (filters.dateTo) {
      whereConditions.push(`created_at <= $${paramCounter}`);
      params.push(filters.dateTo);
      paramCounter++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM api_logs 
      ${whereClause}
    `;
    const countResult = await this.db.executeQuery(countQuery, params);
    const total = parseInt(countResult[0].total);

    // Get paginated logs
    const sortColumn = sortBy === "createdAt" ? "created_at" : sortBy;
    const query = `
      SELECT id, user_id, endpoint, method, status_code, response_time, 
             request_body, created_at
      FROM api_logs 
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    params.push(limit, offset);
    const logs = await this.db.executeQuery(query, params);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }
}

module.exports = SystemService;
