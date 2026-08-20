// src/modules/api-logs/service.js
const { v4: uuidv4 } = require("uuid");
const DatabaseService = require("../../services/database.service");
const CacheService = require("../../services/cache.service");
const apiLogUtils = require("./utils");
const { NotFoundError } = require("../../utils/errors");

class ApiLogService {
  constructor() {
    this.db = new DatabaseService();
    this.cache = new CacheService();
  }

  /**
   * Log API Request
   * Logs API request details to database
   */
  async logApiRequest(logData) {
    const {
      userId,
      apiKey,
      endpoint,
      method,
      statusCode,
      responseTime,
      ip,
      userAgent,
      requestBody,
      responseBody,
    } = logData;

    // Truncate long fields
    const truncatedRequestBody = requestBody
      ? requestBody.substring(0, 10000)
      : null;
    const truncatedResponseBody = responseBody
      ? responseBody.substring(0, 10000)
      : null;

    const result = await this.db.executeQuery(
      `INSERT INTO api_logs (
        id, user_id, api_key, endpoint, method, 
        status_code, response_time, ip_address, user_agent,
        request_body, response_body, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *`,
      [
        uuidv4(),
        userId,
        apiKey,
        endpoint,
        method,
        statusCode,
        responseTime,
        ip,
        userAgent,
        truncatedRequestBody,
        truncatedResponseBody,
      ]
    );

    // Update cache stats
    if (userId) {
      await this.cache.increment(`user:${userId}:log:count`, 1);
      await this.cache.increment(
        `user:${userId}:log:${new Date().toISOString().split("T")[0]}`,
        1
      );
    }

    return result[0];
  }

  /**
   * Get API Logs
   * Retrieves API logs with filtering and pagination
   */
  async getApiLogs(userId, filters = {}, pagination = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = pagination;
    const offset = (page - 1) * limit;

    // Build cache key
    const cacheKey = `logs:${userId}:${JSON.stringify(
      filters
    )}:${page}:${limit}:${sortBy}:${sortOrder}`;

    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Build WHERE clause
    let whereConditions = [];
    let params = [];
    let paramCounter = 1;

    // User filter
    if (userId) {
      whereConditions.push(`user_id = $${paramCounter}`);
      params.push(userId);
      paramCounter++;
    }

    // Date range filter
    if (filters.startDate) {
      whereConditions.push(`created_at >= $${paramCounter}`);
      params.push(filters.startDate);
      paramCounter++;
    }

    if (filters.endDate) {
      whereConditions.push(`created_at <= $${paramCounter}`);
      params.push(filters.endDate);
      paramCounter++;
    }

    // Method filter
    if (filters.method) {
      whereConditions.push(`method = $${paramCounter}`);
      params.push(filters.method);
      paramCounter++;
    }

    // Status code filter
    if (filters.statusCode) {
      whereConditions.push(`status_code = $${paramCounter}`);
      params.push(filters.statusCode);
      paramCounter++;
    }

    // Endpoint search
    if (filters.endpoint) {
      whereConditions.push(`endpoint ILIKE $${paramCounter}`);
      params.push(`%${filters.endpoint}%`);
      paramCounter++;
    }

    // Response time range
    if (filters.minResponseTime !== undefined) {
      whereConditions.push(`response_time >= $${paramCounter}`);
      params.push(filters.minResponseTime);
      paramCounter++;
    }

    if (filters.maxResponseTime !== undefined) {
      whereConditions.push(`response_time <= $${paramCounter}`);
      params.push(filters.maxResponseTime);
      paramCounter++;
    }

    // Search in request/response
    if (filters.search) {
      whereConditions.push(`(
        request_body ILIKE $${paramCounter} OR 
        response_body ILIKE $${paramCounter} OR 
        endpoint ILIKE $${paramCounter}
      )`);
      params.push(`%${filters.search}%`);
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
      SELECT al.*, u.email as user_email, u.full_name as user_name
      FROM api_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    params.push(limit, offset);
    const logs = await this.db.executeQuery(query, params);

    // Format logs for response
    const formattedLogs = logs.map((log) => ({
      ...log,
      request_body: log.request_body ? JSON.parse(log.request_body) : null,
      response_body: log.response_body ? JSON.parse(log.response_body) : null,
    }));

    const result = {
      logs: formattedLogs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };

    // Cache result (5 minutes)
    await this.cache.set(cacheKey, result, 300);

    return result;
  }

  /**
   * Get Log Details
   * Retrieves detailed log information
   */
  async getLogDetails(logId, userId) {
    // Try cache first
    const cacheKey = `log:${logId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      // Verify access
      if (
        cached.user_id === userId ||
        ["admin", "moderator"].includes(userId)
      ) {
        return cached;
      }
      throw new NotFoundError("Log not found or access denied");
    }

    // Build query with access control
    let query = `
      SELECT al.*, u.email as user_email, u.full_name as user_name
      FROM api_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = $1
    `;
    let params = [logId];

    // Non-admin users can only see their own logs
    if (userId && !["admin", "moderator"].includes(userId)) {
      query += ` AND al.user_id = $2`;
      params.push(userId);
    }

    const result = await this.db.executeQuery(query, params);

    if (!result || result.length === 0) {
      throw new NotFoundError("Log not found or access denied");
    }

    const log = {
      ...result[0],
      request_body: result[0].request_body
        ? JSON.parse(result[0].request_body)
        : null,
      response_body: result[0].response_body
        ? JSON.parse(result[0].response_body)
        : null,
    };

    // Cache result (1 hour)
    await this.cache.set(cacheKey, log, 3600);

    return log;
  }

  /**
   * Get Log Statistics
   * Retrieves aggregated log statistics
   */
  async getLogStats(userId, dateRange = {}) {
    const { startDate, endDate } = dateRange;

    // Build cache key
    const cacheKey = `log:stats:${userId}:${startDate || "all"}:${
      endDate || "all"
    }`;

    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let params = [];
    let paramCounter = 1;
    let dateConditions = [];

    if (userId) {
      dateConditions.push(`user_id = $${paramCounter}`);
      params.push(userId);
      paramCounter++;
    }

    if (startDate) {
      dateConditions.push(`created_at >= $${paramCounter}`);
      params.push(startDate);
      paramCounter++;
    }

    if (endDate) {
      dateConditions.push(`created_at <= $${paramCounter}`);
      params.push(endDate);
      paramCounter++;
    }

    const whereClause =
      dateConditions.length > 0 ? `WHERE ${dateConditions.join(" AND ")}` : "";

    // Get basic stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(response_time) as avg_response_time,
        MIN(response_time) as min_response_time,
        MAX(response_time) as max_response_time,
        SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status_code >= 400 AND status_code < 500 THEN 1 ELSE 0 END) as client_error_count,
        SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as server_error_count
      FROM api_logs
      ${whereClause}
    `;

    const statsResult = await this.db.executeQuery(statsQuery, params);
    const stats = statsResult[0] || {};

    // Get top endpoints
    const endpointsQuery = `
      SELECT 
        endpoint,
        method,
        COUNT(*) as count,
        AVG(response_time) as avg_response_time,
        MAX(status_code) as max_status_code
      FROM api_logs
      ${whereClause}
      GROUP BY endpoint, method
      ORDER BY count DESC
      LIMIT 10
    `;

    const topEndpoints = await this.db.executeQuery(endpointsQuery, params);

    // Get status code distribution
    const statusQuery = `
      SELECT 
        status_code,
        COUNT(*) as count
      FROM api_logs
      ${whereClause}
      GROUP BY status_code
      ORDER BY status_code
    `;

    const statusDistribution = await this.db.executeQuery(statusQuery, params);

    // Get daily request count (last 30 days)
    const dailyQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        AVG(response_time) as avg_response_time
      FROM api_logs
      ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    const dailyData = await this.db.executeQuery(dailyQuery, params);

    // Calculate success rate
    const total = parseInt(stats.total_requests) || 0;
    const success = parseInt(stats.success_count) || 0;
    const successRate = total > 0 ? (success / total) * 100 : 0;

    const result = {
      overview: {
        totalRequests: parseInt(stats.total_requests) || 0,
        uniqueUsers: parseInt(stats.unique_users) || 0,
        successRate: Math.round(successRate * 100) / 100,
        avgResponseTime:
          Math.round(parseFloat(stats.avg_response_time) * 100) / 100 || 0,
        minResponseTime: parseInt(stats.min_response_time) || 0,
        maxResponseTime: parseInt(stats.max_response_time) || 0,
        errors: {
          clientErrors: parseInt(stats.client_error_count) || 0,
          serverErrors: parseInt(stats.server_error_count) || 0,
        },
      },
      topEndpoints,
      statusDistribution,
      dailyData: dailyData.map((d) => ({
        date: d.date,
        count: parseInt(d.count),
        avgResponseTime:
          Math.round(parseFloat(d.avg_response_time) * 100) / 100 || 0,
      })),
    };

    // Cache result (15 minutes)
    await this.cache.set(cacheKey, result, 900);

    return result;
  }

  /**
   * Export Logs
   * Exports logs in specified format
   */
  async exportLogs(userId, filters = {}, format = "json") {
    // Get all logs (no pagination limit for export)
    const result = await this.getApiLogs(userId, filters, {
      page: 1,
      limit: 10000,
    });

    // Format for export
    const exportData = apiLogUtils.formatLogForExport(result.logs, format);

    return {
      data: exportData,
      format,
      count: result.logs.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clean Old Logs
   * Deletes logs older than specified days
   */
  async cleanOldLogs(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.db.executeQuery(
      `DELETE FROM api_logs 
       WHERE created_at < $1 
       RETURNING id`,
      [cutoffDate]
    );

    const deletedCount = result ? result.length : 0;

    // Clear cache
    await this.cache.clear("log:*");

    return {
      deletedCount,
      daysKept: daysToKeep,
      cutoffDate: cutoffDate.toISOString(),
    };
  }

  /**
   * Get User Log Summary
   * Gets quick summary for a user
   */
  async getUserLogSummary(userId) {
    const cacheKey = `user:${userId}:log:summary`;

    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.db.executeQuery(
      `SELECT 
        COUNT(*) as total_requests,
        COUNT(DISTINCT DATE(created_at)) as active_days,
        AVG(response_time) as avg_response_time,
        MAX(created_at) as last_request
      FROM api_logs
      WHERE user_id = $1`,
      [userId]
    );

    const summary = {
      userId,
      totalRequests: parseInt(result[0].total_requests) || 0,
      activeDays: parseInt(result[0].active_days) || 0,
      avgResponseTime:
        Math.round(parseFloat(result[0].avg_response_time) * 100) / 100 || 0,
      lastRequest: result[0].last_request || null,
    };

    // Cache for 1 hour
    await this.cache.set(cacheKey, summary, 3600);

    return summary;
  }
}

module.exports = ApiLogService;
