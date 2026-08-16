// src/modules/urls/services/url.service.js
const bcrypt = require("bcrypt");
const urlUtils = require("../utils/url.utils");
const { v4: uuidv4 } = require("uuid");

class UrlService {
  constructor(dbService, cacheService, queueService) {
    this.db = dbService;
    this.cache = cacheService;
    this.queue = queueService;
  }

  // Create short URL
  async createShortUrl(userId, originalUrl, options = {}) {
    try {
      // Normalize and validate URL
      const normalizedUrl = urlUtils.normalizeUrl(originalUrl);
      if (!urlUtils.validateUrl(normalizedUrl)) {
        throw new Error("Invalid URL format");
      }

      // Check domain blacklist
      const blacklistCheck = await urlUtils.checkDomainBlacklist(
        normalizedUrl,
        this.db
      );
      if (blacklistCheck.isBlacklisted) {
        throw new Error(`Domain is blacklisted: ${blacklistCheck.reason}`);
      }

      // Generate short code
      let shortCode;
      if (options.custom_code) {
        if (!urlUtils.isValidShortCode(options.custom_code)) {
          throw new Error("Invalid custom code format");
        }

        // Check if custom code is already taken
        const existing = await this.getUrlByShortCode(options.custom_code);
        if (existing) {
          throw new Error("Custom code is already taken");
        }
        shortCode = options.custom_code;
      } else {
        shortCode = await urlUtils.generateUniqueShortCode(6, this.db);
      }

      // Hash password if provided
      let passwordHash = null;
      let requiresPassword = false;
      if (options.password) {
        const saltRounds = 10;
        passwordHash = await bcrypt.hash(options.password, saltRounds);
        requiresPassword = true;
      }

      // Parse expiration if provided
      let expiresAt = null;
      if (options.expires_at) {
        expiresAt = new Date(options.expires_at);
        if (isNaN(expiresAt.getTime())) {
          throw new Error("Invalid expiration date");
        }
      }

      // Build query
      const query = `
        INSERT INTO urls (
          short_code, original_url, user_id, title, description, tags,
          requires_password, password_hash, expires_at,
          utm_source, utm_medium, utm_campaign, utm_term, utm_content,
          domain_redirect, status, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, 'active', true, NOW(), NOW()
        )
        RETURNING *
      `;

      const params = [
        shortCode,
        normalizedUrl,
        userId,
        options.title || null,
        options.description || null,
        options.tags || null,
        requiresPassword,
        passwordHash,
        expiresAt,
        options.utm_source || null,
        options.utm_medium || null,
        options.utm_campaign || null,
        options.utm_term || null,
        options.utm_content || null,
        options.domain_redirect || null,
      ];

      const result = await this.db.query(query, params);
      const url = result.rows[0];

      // Cache the URL
      await this.cache.set(`url:${url.short_code}`, url, 3600);

      // Queue URL for metadata fetching
      await this.queue.addJob("fetch-metadata", {
        urlId: url.id,
        originalUrl: url.original_url,
      });

      // Fetch metadata in background
      this.fetchUrlMetadataAsync(url.id, url.original_url);

      return {
        url: urlUtils.formatUrlResponse(url),
        shortCode: url.short_code,
      };
    } catch (error) {
      throw error;
    }
  }

  // Async metadata fetching
  async fetchUrlMetadataAsync(urlId, url) {
    try {
      const metadata = await urlUtils.fetchUrlMetadata(url);
      if (metadata.title || metadata.description) {
        const query = `
          UPDATE urls 
          SET title = COALESCE($1, title),
              description = COALESCE($2, description),
              updated_at = NOW()
          WHERE id = $3
        `;
        await this.db.query(query, [
          metadata.title || null,
          metadata.description || null,
          urlId,
        ]);

        // Clear cache
        await this.cache.delete(`url:${urlId}`);
      }
    } catch (error) {
      console.error("Error fetching URL metadata:", error);
    }
  }

  // Get URL by ID
  async getUrlById(urlId, userId) {
    try {
      // Check cache first
      const cachedUrl = await this.cache.get(`url:id:${urlId}`);
      if (cachedUrl) {
        return cachedUrl;
      }

      const query = `
        SELECT * FROM urls 
        WHERE id = $1 AND (user_id = $2 OR is_active = true)
      `;
      const result = await this.db.query(query, [urlId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const url = result.rows[0];

      // Cache the URL
      await this.cache.set(`url:id:${urlId}`, url, 3600);

      return url;
    } catch (error) {
      throw error;
    }
  }

  // Get URL by short code
  async getUrlByShortCode(shortCode) {
    try {
      // Check cache first
      const cachedUrl = await this.cache.get(`url:${shortCode}`);
      if (cachedUrl) {
        return cachedUrl;
      }

      const query = `
        SELECT * FROM urls 
        WHERE short_code = $1 AND (is_active = true OR status = 'active')
      `;
      const result = await this.db.query(query, [shortCode]);

      if (result.rows.length === 0) {
        return null;
      }

      const url = result.rows[0];

      // Check if URL is expired
      if (url.expires_at && new Date(url.expires_at) < new Date()) {
        url.status = "expired";
        url.is_active = false;
        await this.updateUrlStatus(url.id, "expired", false);
        return null;
      }

      // Cache the URL
      await this.cache.set(`url:${shortCode}`, url, 3600);

      return url;
    } catch (error) {
      throw error;
    }
  }

  // Update URL
  async updateUrl(urlId, userId, updates) {
    try {
      // Check ownership
      const existingUrl = await this.getUrlById(urlId, userId);
      if (!existingUrl) {
        throw new Error("URL not found or unauthorized");
      }

      // Build update query
      const fields = [];
      const values = [];
      let paramCount = 1;

      const allowedFields = [
        "title",
        "description",
        "tags",
        "is_active",
        "status",
      ];
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          fields.push(`${field} = $${paramCount}`);
          values.push(updates[field]);
          paramCount++;
        }
      }

      if (fields.length === 0) {
        throw new Error("No valid fields to update");
      }

      fields.push("updated_at = NOW()");
      values.push(urlId);

      const query = `
        UPDATE urls 
        SET ${fields.join(", ")}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      const updatedUrl = result.rows[0];

      // Clear cache
      await this.cache.delete(`url:${updatedUrl.short_code}`);
      await this.cache.delete(`url:id:${updatedUrl.id}`);

      return updatedUrl;
    } catch (error) {
      throw error;
    }
  }

  // Update URL status
  async updateUrlStatus(urlId, status, isActive) {
    const query = `
      UPDATE urls 
      SET status = $1, is_active = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await this.db.query(query, [status, isActive, urlId]);
    return result.rows[0];
  }

  // Delete URL
  async deleteUrl(urlId, userId) {
    try {
      // Check ownership
      const existingUrl = await this.getUrlById(urlId, userId);
      if (!existingUrl) {
        throw new Error("URL not found or unauthorized");
      }

      const query = `
        UPDATE urls 
        SET is_active = false, 
            status = 'inactive',
            deleted_at = NOW(),
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;

      const result = await this.db.query(query, [urlId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const deletedUrl = result.rows[0];

      // Clear cache
      await this.cache.delete(`url:${deletedUrl.short_code}`);
      await this.cache.delete(`url:id:${deletedUrl.id}`);

      // Queue for cleanup
      await this.queue.addJob("delete-related-data", {
        urlId: deletedUrl.id,
      });

      return { success: true, message: "URL deleted successfully" };
    } catch (error) {
      throw error;
    }
  }

  // Get user URLs with pagination
  async getUserUrls(userId, filters = {}, pagination = {}) {
    try {
      const page = parseInt(pagination.page) || 1;
      const limit = parseInt(pagination.limit) || 20;
      const offset = (page - 1) * limit;
      const sort = pagination.sort || "created_at";
      const order = pagination.order || "DESC";

      // Build WHERE clause
      const conditions = ["user_id = $1"];
      const params = [userId];
      let paramCount = 2;

      if (filters.status) {
        conditions.push(`status = $${paramCount}`);
        params.push(filters.status);
        paramCount++;
      }

      if (filters.search) {
        conditions.push(
          `(original_url ILIKE $${paramCount} OR title ILIKE $${paramCount} OR description ILIKE $${paramCount})`
        );
        params.push(`%${filters.search}%`);
        paramCount++;
      }

      if (filters.tags) {
        conditions.push(`tags ILIKE $${paramCount}`);
        params.push(`%${filters.tags}%`);
        paramCount++;
      }

      if (filters.date_from) {
        conditions.push(`created_at >= $${paramCount}`);
        params.push(filters.date_from);
        paramCount++;
      }

      if (filters.date_to) {
        conditions.push(`created_at <= $${paramCount}`);
        params.push(filters.date_to);
        paramCount++;
      }

      const whereClause =
        conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM urls
        ${whereClause}
      `;
      const countResult = await this.db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results
      const query = `
        SELECT *
        FROM urls
        ${whereClause}
        ORDER BY ${sort} ${order}
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      const paginationParams = [...params, limit, offset];
      const result = await this.db.query(query, paginationParams);

      return {
        urls: result.rows.map((url) => urlUtils.formatUrlResponse(url)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Get URL analytics
  async getUrlAnalytics(urlId, userId, dateRange) {
    try {
      // Check ownership
      const url = await this.getUrlById(urlId, userId);
      if (!url) {
        throw new Error("URL not found or unauthorized");
      }

      const { startDate, endDate } = dateRange || {};

      // Build conditions
      const conditions = ["url_id = $1"];
      const params = [urlId];
      let paramCount = 2;

      if (startDate) {
        conditions.push(`created_at >= $${paramCount}`);
        params.push(startDate);
        paramCount++;
      }

      if (endDate) {
        conditions.push(`created_at <= $${paramCount}`);
        params.push(endDate);
        paramCount++;
      }

      const whereClause = conditions.join(" AND ");

      // Get total clicks
      const totalQuery = `
        SELECT COUNT(*) as total
        FROM clicks
        WHERE ${whereClause}
      `;
      const totalResult = await this.db.query(totalQuery, params);
      const totalClicks = parseInt(totalResult.rows[0].total);

      // Get unique visitors
      const uniqueQuery = `
        SELECT COUNT(DISTINCT session_id) as unique_visitors
        FROM clicks
        WHERE ${whereClause}
      `;
      const uniqueResult = await this.db.query(uniqueQuery, params);
      const uniqueVisitors = parseInt(uniqueResult.rows[0].unique_visitors);

      // Get device breakdown
      const deviceQuery = `
        SELECT device_type, COUNT(*) as count
        FROM clicks
        WHERE ${whereClause}
        GROUP BY device_type
        ORDER BY count DESC
      `;
      const deviceResult = await this.db.query(deviceQuery, params);
      const devices = deviceResult.rows;

      // Get browser breakdown
      const browserQuery = `
        SELECT browser, COUNT(*) as count
        FROM clicks
        WHERE ${whereClause}
        GROUP BY browser
        ORDER BY count DESC
      `;
      const browserResult = await this.db.query(browserQuery, params);
      const browsers = browserResult.rows;

      // Get country breakdown
      const countryQuery = `
        SELECT country, COUNT(*) as count
        FROM clicks
        WHERE ${whereClause}
        GROUP BY country
        ORDER BY count DESC
      `;
      const countryResult = await this.db.query(countryQuery, params);
      const countries = countryResult.rows;

      // Get referrer breakdown
      const referrerQuery = `
        SELECT referrer_domain, COUNT(*) as count
        FROM clicks
        WHERE ${whereClause}
        GROUP BY referrer_domain
        ORDER BY count DESC
        LIMIT 10
      `;
      const referrerResult = await this.db.query(referrerQuery, params);
      const referrers = referrerResult.rows;

      // Get timeline data
      const timelineQuery = `
        SELECT DATE(created_at) as date, COUNT(*) as clicks
        FROM clicks
        WHERE ${whereClause}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;
      const timelineResult = await this.db.query(timelineQuery, params);
      const timeline = timelineResult.rows;

      return {
        url: url.short_code,
        total_clicks: totalClicks,
        unique_visitors: uniqueVisitors,
        devices: devices,
        browsers: browsers,
        countries: countries,
        referrers: referrers,
        timeline: timeline,
      };
    } catch (error) {
      throw error;
    }
  }

  // Record click
  async recordClick(shortCode, requestData) {
    try {
      const url = await this.getUrlByShortCode(shortCode);
      if (!url) {
        throw new Error("URL not found");
      }

      // Check if URL is active
      if (!url.is_active || url.status !== "active") {
        throw new Error("URL is not active");
      }

      // Check if URL is expired
      if (url.expires_at && new Date(url.expires_at) < new Date()) {
        await this.updateUrlStatus(url.id, "expired", false);
        throw new Error("URL has expired");
      }

      const { ip, userAgent, referrer, location, sessionId } = requestData;

      // Determine if click is unique
      const isUnique = sessionId
        ? await this.isUniqueClick(url.id, sessionId)
        : true;

      // Insert click record
      const clickQuery = `
        INSERT INTO clicks (
          url_id, ip_address, user_agent, referrer, session_id,
          device_type, browser, browser_version, os, os_version,
          country, city, region, latitude, longitude,
          is_unique, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, NOW()
        )
        RETURNING *
      `;

      // Parse user agent
      const parsedUserAgent = this.parseUserAgent(userAgent || "");

      const clickParams = [
        url.id,
        ip || null,
        userAgent || null,
        referrer || null,
        sessionId || null,
        parsedUserAgent.device || null,
        parsedUserAgent.browser || null,
        parsedUserAgent.version || null,
        parsedUserAgent.os || null,
        parsedUserAgent.osVersion || null,
        location?.country || null,
        location?.city || null,
        location?.region || null,
        location?.latitude || null,
        location?.longitude || null,
        isUnique,
      ];

      const clickResult = await this.db.query(clickQuery, clickParams);
      const click = clickResult.rows[0];

      // Update URL click count
      const updateQuery = `
        UPDATE urls 
        SET click_count = click_count + 1,
            last_clicked_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const updateResult = await this.db.query(updateQuery, [url.id]);
      const updatedUrl = updateResult.rows[0];

      // Update analytics summary asynchronously
      await this.queue.addJob("update-analytics-summary", {
        urlId: url.id,
        date: new Date().toISOString().split("T")[0],
      });

      // Clear cache
      await this.cache.delete(`url:${shortCode}`);

      return {
        click: click,
        url: updatedUrl,
      };
    } catch (error) {
      throw error;
    }
  }

  // Check if click is unique
  async isUniqueClick(urlId, sessionId) {
    const query = `
      SELECT id FROM clicks 
      WHERE url_id = $1 AND session_id = $2 
      AND created_at >= NOW() - INTERVAL '24 hours'
      LIMIT 1
    `;
    const result = await this.db.query(query, [urlId, sessionId]);
    return result.rows.length === 0;
  }

  // Parse user agent
  parseUserAgent(userAgent) {
    const parsed = {
      device: "unknown",
      browser: "unknown",
      version: null,
      os: "unknown",
      osVersion: null,
    };

    if (!userAgent) return parsed;

    // Detect device
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      parsed.device = "mobile";
    } else if (/Android/i.test(userAgent)) {
      parsed.device = "mobile";
    } else if (/Tablet/i.test(userAgent)) {
      parsed.device = "tablet";
    } else if (/Mobile/i.test(userAgent)) {
      parsed.device = "mobile";
    } else {
      parsed.device = "desktop";
    }

    // Detect browser
    if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) {
      parsed.browser = "Chrome";
    } else if (/Firefox/i.test(userAgent)) {
      parsed.browser = "Firefox";
    } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
      parsed.browser = "Safari";
    } else if (/Edge/i.test(userAgent)) {
      parsed.browser = "Edge";
    } else if (/Opera/i.test(userAgent)) {
      parsed.browser = "Opera";
    } else if (/MSIE|Trident/i.test(userAgent)) {
      parsed.browser = "Internet Explorer";
    }

    // Detect OS
    if (/Windows/i.test(userAgent)) {
      parsed.os = "Windows";
      const winMatch = userAgent.match(/Windows NT (\d+\.\d+)/);
      if (winMatch) {
        const versions = {
          "10.0": "10",
          6.3: "8.1",
          6.2: "8",
          6.1: "7",
          "6.0": "Vista",
          5.1: "XP",
        };
        parsed.osVersion = versions[winMatch[1]] || winMatch[1];
      }
    } else if (/Mac OS X/i.test(userAgent)) {
      parsed.os = "macOS";
      const macMatch = userAgent.match(/Mac OS X (\d+_\d+)/);
      if (macMatch) {
        parsed.osVersion = macMatch[1].replace("_", ".");
      }
    } else if (/Linux/i.test(userAgent)) {
      parsed.os = "Linux";
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
      parsed.os = "iOS";
      const iosMatch = userAgent.match(/OS (\d+_\d+)/);
      if (iosMatch) {
        parsed.osVersion = iosMatch[1].replace("_", ".");
      }
    } else if (/Android/i.test(userAgent)) {
      parsed.os = "Android";
      const androidMatch = userAgent.match(/Android (\d+\.\d+)/);
      if (androidMatch) {
        parsed.osVersion = androidMatch[1];
      }
    }

    return parsed;
  }

  // Get URL statistics
  async getUrlStats(urlId, userId) {
    try {
      // Check ownership
      const url = await this.getUrlById(urlId, userId);
      if (!url) {
        throw new Error("URL not found or unauthorized");
      }

      // Get total clicks and unique visitors
      const statsQuery = `
        SELECT 
          COUNT(*) as total_clicks,
          COUNT(DISTINCT session_id) as unique_visitors,
          AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_time_since_click,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days
        FROM clicks
        WHERE url_id = $1
      `;
      const statsResult = await this.db.query(statsQuery, [urlId]);
      const stats = statsResult.rows[0];

      // Calculate bounce rate (single-page visits)
      const bounceQuery = `
        WITH click_groups AS (
          SELECT session_id, COUNT(*) as click_count
          FROM clicks
          WHERE url_id = $1
          GROUP BY session_id
        )
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN click_count = 1 THEN 1 END) as single_click_sessions
        FROM click_groups
      `;
      const bounceResult = await this.db.query(bounceQuery, [urlId]);
      const bounceData = bounceResult.rows[0];

      const totalSessions = parseInt(bounceData.total_sessions) || 0;
      const singleClickSessions =
        parseInt(bounceData.single_click_sessions) || 0;
      const bounceRate =
        totalSessions > 0 ? (singleClickSessions / totalSessions) * 100 : 0;

      return {
        total_clicks: parseInt(stats.total_clicks) || 0,
        unique_visitors: parseInt(stats.unique_visitors) || 0,
        last_7_days: parseInt(stats.last_7_days) || 0,
        last_30_days: parseInt(stats.last_30_days) || 0,
        bounce_rate: parseFloat(bounceRate.toFixed(2)),
        avg_time_since_click: stats.avg_time_since_click || 0,
        last_clicked_at: url.last_clicked_at,
        click_count: url.click_count,
      };
    } catch (error) {
      throw error;
    }
  }

  // Bulk create URLs
  async bulkCreateUrls(userId, urlsData) {
    try {
      const results = {
        successful: [],
        failed: [],
      };

      for (const urlData of urlsData) {
        try {
          const result = await this.createShortUrl(
            userId,
            urlData.original_url,
            {
              custom_code: urlData.custom_code,
              title: urlData.title,
              tags: urlData.tags,
            }
          );

          results.successful.push({
            original_url: urlData.original_url,
            short_code: result.shortCode,
            short_url: `${process.env.BASE_URL}/${result.shortCode}`,
          });
        } catch (error) {
          results.failed.push({
            original_url: urlData.original_url,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

  // Set URL password
  async setUrlPassword(urlId, userId, password) {
    try {
      // Check ownership
      const url = await this.getUrlById(urlId, userId);
      if (!url) {
        throw new Error("URL not found or unauthorized");
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const query = `
        UPDATE urls 
        SET requires_password = true,
            password_hash = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await this.db.query(query, [passwordHash, urlId]);

      if (result.rows.length === 0) {
        return null;
      }

      const updatedUrl = result.rows[0];

      // Clear cache
      await this.cache.delete(`url:${updatedUrl.short_code}`);
      await this.cache.delete(`url:id:${updatedUrl.id}`);

      return { success: true, message: "Password set successfully" };
    } catch (error) {
      throw error;
    }
  }

  // Validate URL password
  async validateUrlPassword(urlId, password) {
    try {
      const query = `
        SELECT password_hash 
        FROM urls 
        WHERE id = $1 AND requires_password = true
      `;
      const result = await this.db.query(query, [urlId]);

      if (result.rows.length === 0) {
        return false;
      }

      const { password_hash } = result.rows[0];
      return await bcrypt.compare(password, password_hash);
    } catch (error) {
      throw error;
    }
  }

  // Remove URL password
  async removeUrlPassword(urlId, userId) {
    try {
      // Check ownership
      const url = await this.getUrlById(urlId, userId);
      if (!url) {
        throw new Error("URL not found or unauthorized");
      }

      const query = `
        UPDATE urls 
        SET requires_password = false,
            password_hash = null,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const result = await this.db.query(query, [urlId]);

      if (result.rows.length === 0) {
        return null;
      }

      const updatedUrl = result.rows[0];

      // Clear cache
      await this.cache.delete(`url:${updatedUrl.short_code}`);
      await this.cache.delete(`url:id:${updatedUrl.id}`);

      return { success: true, message: "Password removed successfully" };
    } catch (error) {
      throw error;
    }
  }

  // Set URL expiration
  async setUrlExpiration(urlId, userId, expiresAt) {
    try {
      // Check ownership
      const url = await this.getUrlById(urlId, userId);
      if (!url) {
        throw new Error("URL not found or unauthorized");
      }

      const expirationDate = new Date(expiresAt);
      if (isNaN(expirationDate.getTime())) {
        throw new Error("Invalid expiration date");
      }

      const query = `
        UPDATE urls 
        SET expires_at = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await this.db.query(query, [expirationDate, urlId]);

      if (result.rows.length === 0) {
        return null;
      }

      const updatedUrl = result.rows[0];

      // Schedule expiration job
      await this.queue.addJob(
        "expire-url",
        {
          urlId: updatedUrl.id,
          expiresAt: expirationDate.toISOString(),
        },
        {
          delay: expirationDate.getTime() - Date.now(),
        }
      );

      // Clear cache
      await this.cache.delete(`url:${updatedUrl.short_code}`);
      await this.cache.delete(`url:id:${updatedUrl.id}`);

      return {
        success: true,
        message: "Expiration set successfully",
        expires_at: expirationDate,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get URLs by tag
  async getUrlsByTag(userId, tag, pagination = {}) {
    try {
      const page = parseInt(pagination.page) || 1;
      const limit = parseInt(pagination.limit) || 20;
      const offset = (page - 1) * limit;

      const query = `
        SELECT *
        FROM urls
        WHERE user_id = $1 
          AND tags ILIKE $2
          AND is_active = true
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
      `;

      const params = [userId, `%${tag}%`, limit, offset];
      const result = await this.db.query(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM urls
        WHERE user_id = $1 AND tags ILIKE $2 AND is_active = true
      `;
      const countResult = await this.db.query(countQuery, [userId, `%${tag}%`]);
      const total = parseInt(countResult.rows[0].total);

      return {
        urls: result.rows.map((url) => urlUtils.formatUrlResponse(url)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Get URL redirect
  async getUrlRedirect(shortCode) {
    try {
      const url = await this.getUrlByShortCode(shortCode);
      if (!url) {
        throw new Error("URL not found");
      }

      // Check if URL is active
      if (!url.is_active || url.status !== "active") {
        throw new Error("URL is not active");
      }

      // Check if URL is expired
      if (url.expires_at && new Date(url.expires_at) < new Date()) {
        await this.updateUrlStatus(url.id, "expired", false);
        throw new Error("URL has expired");
      }

      // Check if password protected
      if (url.requires_password && url.password_hash) {
        return {
          redirect: null,
          requiresPassword: true,
          urlId: url.id,
        };
      }

      // Check domain redirect
      let redirectUrl = url.original_url;
      if (url.domain_redirect) {
        redirectUrl = url.domain_redirect;
      }

      return {
        redirect: redirectUrl,
        requiresPassword: false,
        urlId: url.id,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UrlService;
