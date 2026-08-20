// src/modules/users/service.js
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const DatabaseService = require("../../services/database.service");
const CacheService = require("../../services/cache.service");
const QueueService = require("../../services/queue.service");
const EmailService = require("../../services/email.service");
const userUtils = require("./utils");
const { NotFoundError, ValidationError } = require("../../utils/errors");

class UserService {
  constructor() {
    this.db = new DatabaseService();
    this.cache = new CacheService();
    this.queue = new QueueService();
    this.email = new EmailService();
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    // Try cache first
    const cacheKey = `user:profile:${userId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.db.executeQuery(
      `SELECT id, email, full_name, avatar_url, role, plan, 
              preferences, quota_limit, total_clicks, last_login, 
              email_verified, status, is_online, created_at, updated_at
       FROM users 
       WHERE id = $1 AND is_active = true`,
      [userId]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError("User not found");
    }

    const user = result[0];

    // Format user data
    const formattedUser = userUtils.formatUserResponse(user);

    // Calculate quota usage
    formattedUser.quota = await this.calculateQuotaUsage(user);

    // Cache user profile
    await this.cache.set(cacheKey, formattedUser, 1800); // 30 minutes

    return formattedUser;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updates) {
    // Validate updates
    const validation = userUtils.validateProfileData(updates);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(", "));
    }

    // Sanitize input
    const sanitizedUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key === "fullName") {
        sanitizedUpdates.full_name = userUtils.sanitizeUserInput(value);
      } else if (key === "avatarUrl") {
        sanitizedUpdates.avatar_url = value;
      } else if (key === "email") {
        // Check if email already exists
        const existingUser = await this.db.executeQuery(
          "SELECT id FROM users WHERE email = $1 AND id != $2",
          [value, userId]
        );
        if (existingUser && existingUser.length > 0) {
          throw new ValidationError("Email already in use");
        }
        sanitizedUpdates.email = value;
        // Set email verification required
        sanitizedUpdates.email_verified = false;
      } else if (key === "preferences") {
        sanitizedUpdates.preferences = value;
      }
    }

    // Build dynamic update query
    const setClauses = [];
    const params = [];
    let paramCounter = 1;

    for (const [key, value] of Object.entries(sanitizedUpdates)) {
      setClauses.push(`${key} = $${paramCounter}`);
      params.push(value);
      paramCounter++;
    }

    // Add updated_at
    setClauses.push(`updated_at = NOW()`);
    params.push(userId);

    const query = `
      UPDATE users 
      SET ${setClauses.join(", ")} 
      WHERE id = $${paramCounter} 
      RETURNING id, email, full_name, avatar_url, role, plan, 
                preferences, quota_limit, total_clicks, last_login, 
                email_verified, status, is_online, created_at, updated_at
    `;

    const result = await this.db.executeQuery(query, params);

    if (!result || result.length === 0) {
      throw new NotFoundError("User not found");
    }

    const updatedUser = result[0];
    const formattedUser = userUtils.formatUserResponse(updatedUser);
    formattedUser.quota = await this.calculateQuotaUsage(updatedUser);

    // Clear cache
    await this.cache.delete(`user:profile:${userId}`);

    // If email was updated, send verification email
    if (updates.email) {
      const verificationToken = crypto.randomBytes(32).toString("hex");
      await this.db.executeQuery(
        `UPDATE users 
         SET email_verification_token = $1, 
             email_verification_expires = NOW() + INTERVAL '24 hours' 
         WHERE id = $2`,
        [verificationToken, userId]
      );

      // Send verification email
      await this.email.sendVerificationEmail(
        userId,
        updatedUser.email,
        verificationToken
      );
    }

    return formattedUser;
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Get user with password hash
    const result = await this.db.executeQuery(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError("User not found");
    }

    const user = result[0];

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw new ValidationError("Current password is incorrect", 401);
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.db.executeQuery(
      `UPDATE users 
       SET password_hash = $1, 
           updated_at = NOW(),
           login_attempts = 0
       WHERE id = $2`,
      [newPasswordHash, userId]
    );

    // Clear cache
    await this.cache.delete(`user:profile:${userId}`);

    // Send password change notification
    await this.queue.addJob("send-email", {
      to: (await this.getUserProfile(userId)).email,
      subject: "Password Changed",
      template: "password-changed",
      data: { userId },
    });

    return { success: true, message: "Password changed successfully" };
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId) {
    const cacheKey = `user:preferences:${userId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.db.executeQuery(
      "SELECT preferences FROM users WHERE id = $1",
      [userId]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError("User not found");
    }

    const preferences = result[0].preferences || {
      theme: "light",
      notifications: true,
      language: "en",
      timezone: "UTC",
      emailNotifications: true,
      pushNotifications: true,
      analyticsOptOut: false,
    };

    // Cache preferences
    await this.cache.set(cacheKey, preferences, 3600); // 1 hour

    return preferences;
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId, preferences) {
    // Merge with existing preferences
    const existingPrefs = await this.getUserPreferences(userId);
    const mergedPrefs = { ...existingPrefs, ...preferences };

    const result = await this.db.executeQuery(
      `UPDATE users 
       SET preferences = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING preferences`,
      [JSON.stringify(mergedPrefs), userId]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError("User not found");
    }

    // Clear cache
    await this.cache.delete(`user:preferences:${userId}`);
    await this.cache.delete(`user:profile:${userId}`);

    return result[0].preferences;
  }

  /**
   * Update user plan (Admin only)
   */
  async updateUserPlan(userId, plan) {
    // Validate plan
    const validPlans = ["free", "pro", "business", "enterprise"];
    if (!validPlans.includes(plan)) {
      throw new ValidationError("Invalid plan");
    }

    // Get current plan and quota
    const userResult = await this.db.executeQuery(
      "SELECT plan, quota_limit FROM users WHERE id = $1",
      [userId]
    );

    if (!userResult || userResult.length === 0) {
      throw new NotFoundError("User not found");
    }

    const currentUser = userResult[0];

    // Update quota based on plan
    const quotaMap = {
      free: 100,
      pro: 1000,
      business: 10000,
      enterprise: 100000,
    };

    const newQuota = quotaMap[plan] || 100;

    const result = await this.db.executeQuery(
      `UPDATE users 
       SET plan = $1, 
           quota_limit = $2, 
           updated_at = NOW() 
       WHERE id = $3 
       RETURNING id, plan, quota_limit`,
      [plan, newQuota, userId]
    );

    // Clear cache
    await this.cache.delete(`user:profile:${userId}`);

    // Send notification
    await this.queue.addJob("send-email", {
      to: (await this.getUserProfile(userId)).email,
      subject: "Plan Updated",
      template: "plan-updated",
      data: {
        userId,
        oldPlan: currentUser.plan,
        newPlan: plan,
        newQuota,
      },
    });

    return result[0];
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId) {
    const cacheKey = `user:stats:${userId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get user data
    const userResult = await this.db.executeQuery(
      "SELECT total_clicks, quota_limit FROM users WHERE id = $1",
      [userId]
    );

    if (!userResult || userResult.length === 0) {
      throw new NotFoundError("User not found");
    }

    const user = userResult[0];

    // Get URL stats
    const urlStats = await this.db.executeQuery(
      `SELECT 
        COUNT(*) as total_urls,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_urls,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_urls,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_urls,
        COUNT(CASE WHEN status = 'flagged' THEN 1 END) as flagged_urls,
        SUM(click_count) as total_clicks
       FROM urls 
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );

    const stats = urlStats[0] || {
      total_urls: 0,
      active_urls: 0,
      inactive_urls: 0,
      blocked_urls: 0,
      flagged_urls: 0,
      total_clicks: 0,
    };

    // Get recent activity (last 7 days)
    const recentActivity = await this.db.executeQuery(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as clicks
       FROM clicks 
       WHERE url_id IN (SELECT id FROM urls WHERE user_id = $1)
         AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [userId]
    );

    // Get top performing URLs
    const topUrls = await this.db.executeQuery(
      `SELECT id, short_code, original_url, title, click_count, created_at
       FROM urls 
       WHERE user_id = $1 AND is_active = true
       ORDER BY click_count DESC 
       LIMIT 5`,
      [userId]
    );

    // Calculate quota usage
    const quotaUsage = {
      used: parseInt(stats.total_urls) || 0,
      total: user.quota_limit || 100,
      percentage:
        ((parseInt(stats.total_urls) || 0) / (user.quota_limit || 100)) * 100,
    };

    const result = {
      overview: {
        totalUrls: parseInt(stats.total_urls) || 0,
        activeUrls: parseInt(stats.active_urls) || 0,
        totalClicks: parseInt(stats.total_clicks) || 0,
        quota: quotaUsage,
      },
      urlBreakdown: {
        active: parseInt(stats.active_urls) || 0,
        inactive: parseInt(stats.inactive_urls) || 0,
        blocked: parseInt(stats.blocked_urls) || 0,
        flagged: parseInt(stats.flagged_urls) || 0,
      },
      recentActivity: recentActivity || [],
      topUrls: topUrls || [],
      userInfo: {
        plan: user.plan,
        joinedDate: (await this.getUserProfile(userId)).createdAt,
      },
    };

    // Cache stats
    await this.cache.set(cacheKey, result, 300); // 5 minutes

    return result;
  }

  /**
   * Delete user account
   */
  async deleteUserAccount(userId, password) {
    // Verify user exists and password is correct
    const userResult = await this.db.executeQuery(
      "SELECT password_hash, email FROM users WHERE id = $1",
      [userId]
    );

    if (!userResult || userResult.length === 0) {
      throw new NotFoundError("User not found");
    }

    const user = userResult[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new ValidationError("Invalid password", 401);
    }

    // Start transaction
    const queries = [
      // Soft delete user
      {
        query: `UPDATE users 
                SET is_active = false, 
                    deleted_at = NOW(), 
                    status = 'banned',
                    email = CONCAT('deleted_', id, '_', email),
                    updated_at = NOW()
                WHERE id = $1`,
        params: [userId],
      },
      // Soft delete user's URLs
      {
        query: `UPDATE urls 
                SET is_active = false, 
                    status = 'inactive',
                    updated_at = NOW()
                WHERE user_id = $1`,
        params: [userId],
      },
      // Delete user tokens
      {
        query: "DELETE FROM user_tokens WHERE user_id = $1",
        params: [userId],
      },
    ];

    await this.db.transaction(queries);

    // Clear all user caches
    await this.cache.delete(`user:profile:${userId}`);
    await this.cache.delete(`user:preferences:${userId}`);
    await this.cache.delete(`user:stats:${userId}`);
    await this.cache.clear(`user:*`);

    // Send goodbye email
    await this.email.sendEmail(
      user.email,
      "Account Deleted",
      "Your account has been successfully deleted. We are sorry to see you go."
    );

    return { success: true, message: "Account deleted successfully" };
  }

  /**
   * Regenerate API key
   */
  async regenerateApiKey(userId) {
    // Generate new API key
    const apiKey = `uk_${crypto.randomBytes(32).toString("hex")}`;

    const result = await this.db.executeQuery(
      `UPDATE users 
       SET api_key = $1, 
           api_key_last_regenerated = NOW(),
           updated_at = NOW()
       WHERE id = $2 
       RETURNING api_key, api_key_last_regenerated`,
      [apiKey, userId]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError("User not found");
    }

    // Clear cache
    await this.cache.delete(`user:profile:${userId}`);

    // Send notification
    await this.queue.addJob("send-email", {
      to: (await this.getUserProfile(userId)).email,
      subject: "API Key Regenerated",
      template: "api-key-regenerated",
      data: { userId },
    });

    return {
      apiKey: result[0].api_key,
      regeneratedAt: result[0].api_key_last_regenerated,
    };
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId, filters = {}, pagination = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = pagination;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ["user_id = $1"];
    let params = [userId];
    let paramCounter = 2;

    if (filters.activityType) {
      whereConditions.push(`activity_type = $${paramCounter}`);
      params.push(filters.activityType);
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

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM user_activity 
      ${whereClause}
    `;
    const countResult = await this.db.executeQuery(countQuery, params);
    const total = parseInt(countResult[0].total);

    // Get paginated activity
    const sortColumn = sortBy === "createdAt" ? "created_at" : sortBy;
    const query = `
      SELECT id, user_id, activity_type, description, metadata, created_at
      FROM user_activity 
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    params.push(limit, offset);
    const activities = await this.db.executeQuery(query, params);

    return {
      activities,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }

  /**
   * Calculate quota usage (private helper)
   */
  async calculateQuotaUsage(user) {
    const urlCount = await this.db.executeQuery(
      "SELECT COUNT(*) as count FROM urls WHERE user_id = $1 AND is_active = true",
      [user.id]
    );

    const used = parseInt(urlCount[0].count) || 0;
    const total = user.quota_limit || 100;

    return {
      used,
      total,
      percentage: Math.min((used / total) * 100, 100),
      remaining: Math.max(total - used, 0),
      isExceeded: used >= total,
    };
  }

  /**
   * Get all users (Admin only)
   */
  async getAllUsers(filters = {}, pagination = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = pagination;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ["is_active = true"];
    let params = [];
    let paramCounter = 1;

    if (filters.role) {
      whereConditions.push(`role = $${paramCounter}`);
      params.push(filters.role);
      paramCounter++;
    }

    if (filters.plan) {
      whereConditions.push(`plan = $${paramCounter}`);
      params.push(filters.plan);
      paramCounter++;
    }

    if (filters.status) {
      whereConditions.push(`status = $${paramCounter}`);
      params.push(filters.status);
      paramCounter++;
    }

    if (filters.search) {
      whereConditions.push(
        `(email ILIKE $${paramCounter} OR full_name ILIKE $${paramCounter})`
      );
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
      FROM users 
      ${whereClause}
    `;
    const countResult = await this.db.executeQuery(countQuery, params);
    const total = parseInt(countResult[0].total);

    // Get paginated users
    const sortColumn = sortBy === "createdAt" ? "created_at" : sortBy;
    const query = `
      SELECT id, email, full_name, avatar_url, role, plan, 
             preferences, quota_limit, total_clicks, last_login, 
             email_verified, status, is_online, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    params.push(limit, offset);
    const users = await this.db.executeQuery(query, params);

    // Format users
    const formattedUsers = users.map((user) => {
      const formatted = userUtils.formatUserResponse(user);
      return formatted;
    });

    return {
      users: formattedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }
}

module.exports = UserService;
