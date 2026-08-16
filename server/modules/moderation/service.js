// src/modules/moderation/service.js
const { v4: uuidv4 } = require("uuid");
const DatabaseService = require("../../services/database.service");
const CacheService = require("../../services/cache.service");
const QueueService = require("../../services/queue.service");
const NotificationService = require("../../services/notification.service");
const moderationUtils = require("./utils");
const { NotFoundError, ValidationError } = require("../../utils/errors");

class ModerationService {
  constructor() {
    this.db = new DatabaseService();
    this.cache = new CacheService();
    this.queue = new QueueService();
    this.notification = new NotificationService();
  }

  /**
   * Moderate URL
   */
  async moderateUrl(urlId, adminId, action, reason, notes = "") {
    // Check if URL exists
    const url = await this.db.executeQuery(
      "SELECT id, user_id, status FROM urls WHERE id = $1",
      [urlId]
    );

    if (!url || url.length === 0) {
      throw new NotFoundError("URL not found");
    }

    const urlData = url[0];

    // Update URL status based on action
    let statusMap = {
      block: "blocked",
      flag: "flagged",
      warn: "active",
      delete: "inactive",
      review: "flagged",
    };

    const newStatus = statusMap[action] || urlData.status;

    // Begin transaction
    const queries = [
      {
        query: `UPDATE urls 
                SET status = $1, 
                    moderated_at = NOW(), 
                    moderation_reason = $2,
                    updated_at = NOW()
                WHERE id = $3 
                RETURNING *`,
        params: [newStatus, reason, urlId],
      },
      {
        query: `INSERT INTO moderation_logs (id, url_id, admin_id, action, reason, notes, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING *`,
        params: [uuidv4(), urlId, adminId, action, reason, notes],
      },
    ];

    const results = await this.db.transaction(queries);
    const updatedUrl = results[0][0];
    const moderationLog = results[1][0];

    // If action is 'block' or 'delete', notify the URL owner
    if (["block", "delete"].includes(action)) {
      await this.notification.createNotification(
        urlData.user_id,
        `Your URL has been ${action}ed`,
        `Your short URL has been ${action}ed due to: ${reason}`,
        "warning",
        { urlId, action, reason }
      );
    }

    // Clear cache
    await this.cache.delete(`url:${urlId}`);
    await this.cache.delete(`url:shortcode:${urlData.short_code}`);

    return {
      success: true,
      message: `URL successfully ${action}ed`,
      url: updatedUrl,
      moderationLog,
    };
  }

  /**
   * Create abuse report
   */
  async createReport(
    urlId,
    reportedBy,
    reason,
    description = "",
    reporterEmail = ""
  ) {
    // Check if URL exists
    const url = await this.db.executeQuery(
      "SELECT id, user_id, status FROM urls WHERE id = $1",
      [urlId]
    );

    if (!url || url.length === 0) {
      throw new NotFoundError("URL not found");
    }

    // Check if report already exists for this URL
    const existingReport = await this.db.executeQuery(
      `SELECT id FROM abuse_reports 
       WHERE url_id = $1 AND status IN ('pending', 'investigating')`,
      [urlId]
    );

    if (existingReport && existingReport.length > 0) {
      throw new ValidationError("A report already exists for this URL");
    }

    // Create report
    const result = await this.db.executeQuery(
      `INSERT INTO abuse_reports (id, url_id, reported_by, reporter_email, reason, description, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
       RETURNING *`,
      [uuidv4(), urlId, reportedBy, reporterEmail, reason, description]
    );

    const report = result[0];

    // Queue for moderation review
    await this.queue.addJob("moderation-review", {
      reportId: report.id,
      urlId,
      reason,
      priority:
        reason === "malware" || reason === "phishing" ? "high" : "normal",
    });

    // Notify moderators
    await this.queue.addJob("notify-moderators", {
      reportId: report.id,
      urlId,
      reason,
    });

    // Clear cache
    await this.cache.delete(`reports:url:${urlId}`);

    return report;
  }

  /**
   * Get reports with filters
   */
  async getReports(filters = {}, pagination = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = pagination;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = [];
    let params = [];
    let paramCounter = 1;

    if (filters.status) {
      whereConditions.push(`status = $${paramCounter}`);
      params.push(filters.status);
      paramCounter++;
    }

    if (filters.reason) {
      whereConditions.push(`reason = $${paramCounter}`);
      params.push(filters.reason);
      paramCounter++;
    }

    if (filters.urlId) {
      whereConditions.push(`url_id = $${paramCounter}`);
      params.push(filters.urlId);
      paramCounter++;
    }

    if (filters.reportedBy) {
      whereConditions.push(`reported_by = $${paramCounter}`);
      params.push(filters.reportedBy);
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
      FROM abuse_reports 
      ${whereClause}
    `;
    const countResult = await this.db.executeQuery(countQuery, params);
    const total = parseInt(countResult[0].total);

    // Get paginated reports
    const sortColumn = sortBy === "createdAt" ? "created_at" : sortBy;
    const query = `
      SELECT ar.*, 
             u.email as reporter_email_full,
             urls.short_code,
             urls.original_url
      FROM abuse_reports ar
      LEFT JOIN users u ON ar.reported_by = u.id
      LEFT JOIN urls ON ar.url_id = urls.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    params.push(limit, offset);
    const reports = await this.db.executeQuery(query, params);

    // Cache result
    await this.cache.set(
      `reports:${JSON.stringify(filters)}:${page}:${limit}`,
      { reports, total },
      300 // 5 minutes cache
    );

    return {
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }

  /**
   * Update report
   */
  async updateReport(reportId, adminId, status, resolution = "") {
    // Check if report exists
    const report = await this.db.executeQuery(
      "SELECT * FROM abuse_reports WHERE id = $1",
      [reportId]
    );

    if (!report || report.length === 0) {
      throw new NotFoundError("Report not found");
    }

    const reportData = report[0];

    // Update report
    const result = await this.db.executeQuery(
      `UPDATE abuse_reports 
       SET status = $1, 
           resolution = $2, 
           resolved_by = $3, 
           resolved_at = NOW(),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, resolution, adminId, reportId]
    );

    const updatedReport = result[0];

    // If status is 'resolved' or 'dismissed', notify the reporter
    if (["resolved", "dismissed"].includes(status) && reportData.reported_by) {
      await this.notification.createNotification(
        reportData.reported_by,
        `Report ${status}`,
        `Your report has been ${status}${resolution ? `: ${resolution}` : ""}`,
        status === "resolved" ? "success" : "info",
        { reportId, status, resolution }
      );
    }

    // If status is 'resolved' and it's a valid issue, moderate the URL
    if (status === "resolved" && resolution.includes("valid")) {
      await this.moderateUrl(
        reportData.url_id,
        adminId,
        "block",
        `Resolved report: ${resolution}`
      );
    }

    // Clear cache
    await this.cache.delete(`reports:${reportId}`);
    await this.cache.delete(`reports:url:${reportData.url_id}`);

    return updatedReport;
  }

  /**
   * Get report details
   */
  async getReportDetails(reportId) {
    // Try cache first
    const cached = await this.cache.get(`reports:${reportId}`);
    if (cached) {
      return cached;
    }

    const result = await this.db.executeQuery(
      `SELECT ar.*, 
              u.email as reporter_email_full,
              u.full_name as reporter_name,
              urls.short_code,
              urls.original_url,
              urls.title,
              urls.click_count,
              urls.status as url_status,
              ml.action as moderation_action,
              ml.reason as moderation_reason,
              ml.created_at as moderated_at
       FROM abuse_reports ar
       LEFT JOIN users u ON ar.reported_by = u.id
       LEFT JOIN urls ON ar.url_id = urls.id
       LEFT JOIN moderation_logs ml ON ar.url_id = ml.url_id
       WHERE ar.id = $1
       ORDER BY ml.created_at DESC
       LIMIT 1`,
      [reportId]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError("Report not found");
    }

    const report = result[0];

    // Get all moderation logs for this URL
    const logs = await this.db.executeQuery(
      `SELECT * FROM moderation_logs 
       WHERE url_id = $1 
       ORDER BY created_at DESC`,
      [report.url_id]
    );

    report.moderation_logs = logs;

    // Cache result
    await this.cache.set(`reports:${reportId}`, report, 600); // 10 minutes cache

    return report;
  }

  /**
   * Add domain to blacklist
   */
  async addToBlacklist(domain, reason, addedBy, expiresAt = null) {
    // Check if domain already exists
    const existing = await this.db.executeQuery(
      "SELECT * FROM domain_blacklist WHERE domain = $1",
      [domain]
    );

    if (existing && existing.length > 0) {
      throw new ValidationError("Domain already in blacklist");
    }

    const result = await this.db.executeQuery(
      `INSERT INTO domain_blacklist (domain, reason, added_by, added_at, expires_at)
       VALUES ($1, $2, $3, NOW(), $4)
       RETURNING *`,
      [domain, reason, addedBy, expiresAt]
    );

    const blacklistEntry = result[0];

    // Clear cache
    await this.cache.delete("blacklist:all");

    // Queue for blacklist sync
    await this.queue.addJob("sync-blacklist", {
      domain,
      action: "add",
    });

    return blacklistEntry;
  }

  /**
   * Remove from blacklist
   */
  async removeFromBlacklist(domainId) {
    const result = await this.db.executeQuery(
      "DELETE FROM domain_blacklist WHERE id = $1 RETURNING *",
      [domainId]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError("Domain not found in blacklist");
    }

    const deletedEntry = result[0];

    // Clear cache
    await this.cache.delete("blacklist:all");

    // Queue for blacklist sync
    await this.queue.addJob("sync-blacklist", {
      domain: deletedEntry.domain,
      action: "remove",
    });

    return { success: true, deleted: deletedEntry };
  }

  /**
   * Get blacklist
   */
  async getBlacklist(filters = {}, pagination = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = "addedAt",
      sortOrder = "DESC",
    } = pagination;
    const offset = (page - 1) * limit;

    // Try cache first
    const cacheKey = `blacklist:${JSON.stringify(filters)}:${page}:${limit}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let whereConditions = [];
    let params = [];
    let paramCounter = 1;

    if (filters.domain) {
      whereConditions.push(`domain ILIKE $${paramCounter}`);
      params.push(`%${filters.domain}%`);
      paramCounter++;
    }

    if (filters.expiresAt) {
      whereConditions.push(
        `expires_at IS NOT NULL AND expires_at <= $${paramCounter}`
      );
      params.push(filters.expiresAt);
      paramCounter++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM domain_blacklist 
      ${whereClause}
    `;
    const countResult = await this.db.executeQuery(countQuery, params);
    const total = parseInt(countResult[0].total);

    // Get paginated blacklist
    const sortColumn = sortBy === "addedAt" ? "added_at" : sortBy;
    const query = `
      SELECT db.*, u.email as added_by_email, u.full_name as added_by_name
      FROM domain_blacklist db
      LEFT JOIN users u ON db.added_by = u.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    params.push(limit, offset);
    const blacklist = await this.db.executeQuery(query, params);

    const result = {
      blacklist,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };

    // Cache result
    await this.cache.set(cacheKey, result, 3600); // 1 hour cache

    return result;
  }

  /**
   * Get flagged URLs
   */
  async getFlaggedUrls(pagination = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = "flaggedAt",
      sortOrder = "DESC",
    } = pagination;
    const offset = (page - 1) * limit;

    // Try cache first
    const cacheKey = `flagged:urls:${page}:${limit}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM urls 
      WHERE status = 'flagged' OR status = 'blocked'
    `;
    const countResult = await this.db.executeQuery(countQuery);
    const total = parseInt(countResult[0].total);

    // Get flagged URLs
    const query = `
      SELECT u.*, 
             us.email as user_email,
             us.full_name as user_name,
             COUNT(c.id) as total_clicks,
             MAX(c.created_at) as last_click
      FROM urls u
      LEFT JOIN users us ON u.user_id = us.id
      LEFT JOIN clicks c ON u.id = c.url_id
      WHERE u.status IN ('flagged', 'blocked')
      GROUP BY u.id, us.email, us.full_name
      ORDER BY u.moderated_at ${sortOrder}
      LIMIT $1 OFFSET $2
    `;

    const urls = await this.db.executeQuery(query, [limit, offset]);

    // Get moderation logs for each URL
    for (const url of urls) {
      const logs = await this.db.executeQuery(
        `SELECT * FROM moderation_logs 
         WHERE url_id = $1 
         ORDER BY created_at DESC 
         LIMIT 5`,
        [url.id]
      );
      url.recent_moderation_logs = logs;
    }

    const result = {
      urls,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };

    // Cache result
    await this.cache.set(cacheKey, result, 300); // 5 minutes cache

    return result;
  }

  /**
   * Auto-moderation check
   */
  async autoModerateUrl(url, title = "", description = "") {
    // Check against blacklist
    const blacklistCheck = await moderationUtils.checkDomainBlacklist(url);
    if (blacklistCheck.isBlacklisted) {
      return {
        flagged: true,
        reason: `Domain in blacklist: ${blacklistCheck.reason}`,
        action: "block",
      };
    }

    // Check for malware
    const malwareCheck = await moderationUtils.scanUrlForMalware(url);
    if (!malwareCheck.safe) {
      return {
        flagged: true,
        reason: `Malware detected: ${malwareCheck.threats.join(", ")}`,
        action: "block",
      };
    }

    // Check for spam patterns
    const spamCheck = await moderationUtils.detectSpamPatterns(
      url,
      title,
      description
    );
    if (spamCheck.isSpam && spamCheck.confidence > 0.7) {
      return {
        flagged: true,
        reason: `Spam detected: ${spamCheck.reasons.join(", ")}`,
        action: "flag",
        confidence: spamCheck.confidence,
      };
    }

    // Check content
    const contentCheck = await moderationUtils.validateUrlContent(url);
    if (!contentCheck.valid) {
      return {
        flagged: true,
        reason: `Prohibited content: ${contentCheck.issues.join(", ")}`,
        action: "flag",
      };
    }

    return {
      flagged: false,
      reason: null,
      action: null,
    };
  }

  /**
   * Get moderation logs
   */
  async getModerationLogs(urlId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    // Check if URL exists
    const url = await this.db.executeQuery(
      "SELECT id FROM urls WHERE id = $1",
      [urlId]
    );

    if (!url || url.length === 0) {
      throw new NotFoundError("URL not found");
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM moderation_logs 
      WHERE url_id = $1
    `;
    const countResult = await this.db.executeQuery(countQuery, [urlId]);
    const total = parseInt(countResult[0].total);

    // Get logs with user details
    const query = `
      SELECT ml.*, 
             u.email as admin_email,
             u.full_name as admin_name
      FROM moderation_logs ml
      LEFT JOIN users u ON ml.admin_id = u.id
      WHERE ml.url_id = $1
      ORDER BY ml.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const logs = await this.db.executeQuery(query, [urlId, limit, offset]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }
}

module.exports = ModerationService;
