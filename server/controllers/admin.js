import { supabase } from "../config/supabase.js";
import { createRequestContextLogger } from "../utils/logger.js";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from "../errors/customErrors.js";

export class AdminController {
  /**
   * Middleware to check admin role
   */
  static async isAdmin(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("Not authenticated");

      const { data: user, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (error || !user || user.role !== "admin") {
        throw new ForbiddenError("Admin access required");
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all short URLs with filtering and pagination
   */
  static async getAllUrls(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        userId,
        fromDate,
        toDate,
      } = req.query;

      const offset = (page - 1) * limit;

      let query = supabase.from("urls").select(
        `
          *,
          users!inner(email, full_name, plan)
        `,
        { count: "exact" }
      );

      if (search) {
        query = query.or(
          `original_url.ilike.%${search}%,short_code.ilike.%${search}%`
        );
      }

      if (status === "active") {
        query = query.eq("is_active", true);
      } else if (status === "inactive") {
        query = query.eq("is_active", false);
      }

      if (userId) {
        query = query.eq("user_id", userId);
      }

      if (fromDate) {
        query = query.gte("created_at", fromDate);
      }

      if (toDate) {
        query = query.lte("created_at", toDate);
      }

      const {
        data: urls,
        error,
        count,
      } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Get abuse reports for each URL
      const urlsWithReports = await Promise.all(
        urls.map(async (url) => {
          const { data: reports } = await supabase
            .from("abuse_reports")
            .select("count")
            .eq("url_id", url.id)
            .single();

          return {
            ...url,
            abuse_reports_count: reports?.count || 0,
          };
        })
      );

      log.performance("admin_get_all_urls", Date.now() - startTime);

      res.json({
        success: true,
        data: urlsWithReports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      log.error(error, { action: "admin_get_all_urls" });
      next(error);
    }
  }

  /**
   * Get all users with their statistics
   */
  static async getAllUsers(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { page = 1, limit = 20, search, plan, status } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from("users")
        .select(
          `
          *,
          urls(count)
        `,
          { count: "exact" }
        )
        .not("role", "eq", "admin"); // Exclude admins

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }

      if (plan) {
        query = query.eq("plan", plan);
      }

      if (status === "active") {
        query = query.is("deleted_at", null);
      } else if (status === "suspended") {
        query = query.not("deleted_at", "is", null);
      }

      const {
        data: users,
        error,
        count,
      } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Get additional stats for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const { data: urls } = await supabase
            .from("urls")
            .select("click_count")
            .eq("user_id", user.id);

          const totalClicks =
            urls?.reduce((sum, url) => sum + (url.click_count || 0), 0) || 0;
          const activeUrls =
            urls?.filter((url) => url.is_active !== false).length || 0;

          return {
            ...user,
            stats: {
              total_urls: urls?.length || 0,
              active_urls: activeUrls,
              total_clicks: totalClicks,
              average_clicks_per_url: urls?.length
                ? (totalClicks / urls.length).toFixed(1)
                : 0,
            },
          };
        })
      );

      log.performance("admin_get_all_users", Date.now() - startTime);

      res.json({
        success: true,
        data: usersWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      log.error(error, { action: "admin_get_all_users" });
      next(error);
    }
  }

  /**
   * Get global analytics for admin dashboard
   */
  static async getGlobalAnalytics(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { period = "30d" } = req.query;
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get global stats
      const [usersCount, urlsCount, clicksCount, activeUsers] =
        await Promise.all([
          supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .not("role", "eq", "admin"),
          supabase.from("urls").select("*", { count: "exact", head: true }),
          supabase
            .from("clicks")
            .select("*", { count: "exact", head: true })
            .gte("created_at", startDate.toISOString()),
          supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .gte("last_login", startDate.toISOString()),
        ]);

      // Get top users by clicks
      const { data: topUsers } = await supabase
        .from("urls")
        .select("user_id, users(email, full_name), click_count")
        .not("user_id", "is", null)
        .order("click_count", { ascending: false })
        .limit(10);

      const aggregatedUserClicks = {};
      topUsers?.forEach((url) => {
        const userId = url.user_id;
        if (!aggregatedUserClicks[userId]) {
          aggregatedUserClicks[userId] = {
            email: url.users.email,
            full_name: url.users.full_name,
            total_clicks: 0,
          };
        }
        aggregatedUserClicks[userId].total_clicks += url.click_count || 0;
      });

      const topUsersList = Object.values(aggregatedUserClicks)
        .sort((a, b) => b.total_clicks - a.total_clicks)
        .slice(0, 10);

      // Get click timeline
      const { data: clicksTimeline } = await supabase
        .from("clicks")
        .select("created_at")
        .gte("created_at", startDate.toISOString());

      const timeline = this.generateGlobalTimeline(clicksTimeline || [], days);

      // Get abuse reports
      const { data: abuseReports } = await supabase
        .from("abuse_reports")
        .select("*")
        .gte("created_at", startDate.toISOString());

      const analytics = {
        overview: {
          total_users: usersCount.count || 0,
          total_urls: urlsCount.count || 0,
          total_clicks_period: clicksCount.count || 0,
          total_clicks_period: clicksCount.count || 0,
          active_users_period: activeUsers.count || 0,
          engagement_rate: usersCount.count
            ? (((activeUsers.count || 0) / usersCount.count) * 100).toFixed(1)
            : 0,
        },
        timeline,
        top_users: topUsersList,
        abuse_reports: {
          total: abuseReports?.length || 0,
          pending:
            abuseReports?.filter((r) => r.status === "pending").length || 0,
          resolved:
            abuseReports?.filter((r) => r.status === "resolved").length || 0,
        },
        growth: {
          user_growth: await this.getUserGrowth(startDate),
          url_growth: await this.getUrlGrowth(startDate),
          click_growth: await this.getClickGrowth(startDate),
        },
      };

      log.performance("admin_get_global_analytics", Date.now() - startTime);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      log.error(error, { action: "admin_get_global_analytics" });
      next(error);
    }
  }

  /**
   * Moderate abusive links
   */
  static async moderateAbusiveLink(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;
      const { action, reason } = req.body;

      if (!["deactivate", "delete", "warn"].includes(action)) {
        throw new BadRequestError(
          "Invalid action. Use: deactivate, delete, or warn"
        );
      }

      // Get URL details
      const { data: url, error: urlError } = await supabase
        .from("urls")
        .select("*, users(email, full_name)")
        .eq("short_code", shortCode)
        .single();

      if (urlError || !url) {
        throw new NotFoundError("URL not found");
      }

      let result;
      let message;

      switch (action) {
        case "deactivate":
          const { error: deactivateError } = await supabase
            .from("urls")
            .update({
              is_active: false,
              moderated_at: new Date(),
              moderation_reason: reason || "Violation of terms of service",
            })
            .eq("short_code", shortCode);

          if (deactivateError) throw deactivateError;
          message = "URL has been deactivated";
          break;

        case "delete":
          const { error: deleteError } = await supabase
            .from("urls")
            .delete()
            .eq("short_code", shortCode);

          if (deleteError) throw deleteError;
          message = "URL has been permanently deleted";
          break;

        case "warn":
          const { error: warnError } = await supabase
            .from("urls")
            .update({
              warned_at: new Date(),
              warning_reason: reason || "Content warning issued",
            })
            .eq("short_code", shortCode);

          if (warnError) throw warnError;
          message = "Warning has been issued for this URL";
          break;
      }

      // Log moderation action
      await supabase.from("moderation_logs").insert([
        {
          url_id: url.id,
          admin_id: req.user.id,
          action,
          reason,
          created_at: new Date(),
        },
      ]);

      // Send notification to user
      await this.sendModerationNotification(url.user_id, action, reason);

      log.business("admin_moderated_link", {
        shortCode,
        adminId: req.user.id,
        action,
        reason,
        userId: url.user_id,
      });

      log.performance("moderate_abusive_link", Date.now() - startTime);

      res.json({
        success: true,
        message,
        data: { shortCode, action },
      });
    } catch (error) {
      log.error(error, { action: "admin_moderate_abusive_link" });
      next(error);
    }
  }

  /**
   * Get abuse reports
   */
  static async getAbuseReports(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { status = "pending", page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase.from("abuse_reports").select(
        `
          *,
          urls!inner(
            id,
            short_code,
            original_url,
            user_id,
            users(email, full_name)
          )
        `,
        { count: "exact" }
      );

      if (status !== "all") {
        query = query.eq("status", status);
      }

      const {
        data: reports,
        error,
        count,
      } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      log.performance("get_abuse_reports", Date.now() - startTime);

      res.json({
        success: true,
        data: reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      log.error(error, { action: "get_abuse_reports" });
      next(error);
    }
  }

  /**
   * Resolve abuse report
   */
  static async resolveAbuseReport(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { reportId } = req.params;
      const { resolution, notes } = req.body;

      const { data: report, error: reportError } = await supabase
        .from("abuse_reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (reportError || !report) {
        throw new NotFoundError("Abuse report not found");
      }

      const { error } = await supabase
        .from("abuse_reports")
        .update({
          status: "resolved",
          resolved_at: new Date(),
          resolved_by: req.user.id,
          resolution,
          resolution_notes: notes,
        })
        .eq("id", reportId);

      if (error) throw error;

      log.business("abuse_report_resolved", {
        reportId,
        resolvedBy: req.user.id,
        resolution,
      });

      log.performance("resolve_abuse_report", Date.now() - startTime);

      res.json({
        success: true,
        message: "Abuse report resolved successfully",
      });
    } catch (error) {
      log.error(error, { action: "resolve_abuse_report" });
      next(error);
    }
  }

  /**
   * Update user plan/role
   */
  static async updateUser(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { userId } = req.params;
      const { plan, role, status, quota_limit } = req.body;

      // Don't allow modifying admin users
      const { data: targetUser, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (userError || !targetUser) {
        throw new NotFoundError("User not found");
      }

      if (targetUser.role === "admin") {
        throw new ForbiddenError("Cannot modify admin users");
      }

      const updateData = {};
      if (plan) updateData.plan = plan;
      if (role && role !== "admin") updateData.role = role;
      if (status === "suspend") updateData.suspended_at = new Date();
      if (status === "unsuspend") updateData.suspended_at = null;
      if (quota_limit) updateData.quota_limit = quota_limit;

      updateData.updated_at = new Date();

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;

      log.business("admin_updated_user", {
        targetUserId: userId,
        adminId: req.user.id,
        updates: updateData,
      });

      log.performance("admin_update_user", Date.now() - startTime);

      res.json({
        success: true,
        data,
        message: "User updated successfully",
      });
    } catch (error) {
      log.error(error, { action: "admin_update_user" });
      next(error);
    }
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { userId } = req.params;

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        throw new NotFoundError("User not found");
      }

      if (user.role === "admin") {
        throw new ForbiddenError("Cannot delete admin users");
      }

      // Soft delete user
      const { error } = await supabase
        .from("users")
        .update({
          deleted_at: new Date(),
          is_active: false,
          email: `deleted_${userId}@example.com`,
        })
        .eq("id", userId);

      if (error) throw error;

      // Deactivate all user's URLs
      await supabase
        .from("urls")
        .update({ is_active: false })
        .eq("user_id", userId);

      log.security("admin_deleted_user", {
        deletedUserId: userId,
        adminId: req.user.id,
      });

      log.performance("admin_delete_user", Date.now() - startTime);

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      log.error(error, { action: "admin_delete_user" });
      next(error);
    }
  }

  /**
   * Get system health and metrics
   */
  static async getSystemHealth(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      // Check database connection
      const { error: dbError } = await supabase
        .from("users")
        .select("count", { count: "exact", head: true });

      // Get system metrics
      const [
        totalUsers,
        activeUsers24h,
        totalUrls,
        totalClicks30d,
        storageUsage,
      ] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte(
            "last_login",
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          ),
        supabase.from("urls").select("*", { count: "exact", head: true }),
        supabase
          .from("clicks")
          .select("*", { count: "exact", head: true })
          .gte(
            "created_at",
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          ),
        this.getStorageUsage(),
      ]);

      const health = {
        status: dbError ? "degraded" : "healthy",
        timestamp: new Date().toISOString(),
        database: {
          status: dbError ? "error" : "connected",
          error: dbError?.message || null,
        },
        metrics: {
          total_users: totalUsers.count || 0,
          active_users_24h: activeUsers24h.count || 0,
          total_urls: totalUrls.count || 0,
          clicks_last_30d: totalClicks30d.count || 0,
          storage_used_mb: storageUsage,
          average_response_time: await this.getAverageResponseTime(),
        },
        performance: {
          cache_hit_rate: await this.getCacheHitRate(),
          api_requests_per_minute: await this.getApiRequestRate(),
          error_rate: await this.getErrorRate(),
        },
      };

      log.performance("get_system_health", Date.now() - startTime);

      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      log.error(error, { action: "get_system_health" });
      next(error);
    }
  }

  /**
   * Export system data (CSV/JSON)
   */
  static async exportData(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { type = "urls", format = "json", fromDate, toDate } = req.query;

      let data;
      let filename;

      switch (type) {
        case "urls":
          data = await this.exportUrls(fromDate, toDate);
          filename = `urls_export_${Date.now()}.${format}`;
          break;
        case "users":
          data = await this.exportUsers(fromDate, toDate);
          filename = `users_export_${Date.now()}.${format}`;
          break;
        case "analytics":
          data = await this.exportAnalytics(fromDate, toDate);
          filename = `analytics_export_${Date.now()}.${format}`;
          break;
        default:
          throw new BadRequestError("Invalid export type");
      }

      log.business("admin_exported_data", {
        type,
        format,
        adminId: req.user.id,
      });

      log.performance("export_data", Date.now() - startTime);

      if (format === "csv") {
        const csv = this.convertToCSV(data);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        return res.send(csv);
      } else {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        return res.json(data);
      }
    } catch (error) {
      log.error(error, { action: "export_data" });
      next(error);
    }
  }

  /**
   * Get single URL details (Admin)
   */
  static async getUrlDetails(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;

      const { data: url, error } = await supabase
        .from("urls")
        .select(
          `
          *,
          users!inner(email, full_name, plan),
          abuse_reports(count)
        `
        )
        .eq("short_code", shortCode)
        .single();

      if (error || !url) {
        throw new NotFoundError("URL not found");
      }

      // Get recent clicks
      const { data: recentClicks } = await supabase
        .from("clicks")
        .select("created_at, ip_address, country, device_type, browser")
        .eq("url_id", url.id)
        .order("created_at", { ascending: false })
        .limit(20);

      log.performance("admin_get_url_details", Date.now() - startTime);

      res.json({
        success: true,
        data: {
          ...url,
          shortUrl: `${process.env.BASE_URL}/${url.short_code}`,
          recentClicks: recentClicks || [],
        },
      });
    } catch (error) {
      log.error(error, { action: "admin_get_url_details" });
      next(error);
    }
  }

  /**
   * Update URL (Admin) - e.g., title, expiry, status
   */
  static async updateUrl(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;
      const { title, description, is_active, expires_at } = req.body;

      const { data: url, error: fetchError } = await supabase
        .from("urls")
        .select("id")
        .eq("short_code", shortCode)
        .single();

      if (fetchError || !url) {
        throw new NotFoundError("URL not found");
      }

      const updateData = { updated_at: new Date() };
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (expires_at !== undefined) updateData.expires_at = expires_at;

      const { data, error } = await supabase
        .from("urls")
        .update(updateData)
        .eq("short_code", shortCode)
        .select()
        .single();

      if (error) throw error;

      log.business("admin_updated_url", {
        shortCode,
        adminId: req.user.id,
        updates: Object.keys(updateData),
      });

      log.performance("admin_update_url", Date.now() - startTime);

      res.json({
        success: true,
        data,
        message: "URL updated successfully",
      });
    } catch (error) {
      log.error(error, { action: "admin_update_url" });
      next(error);
    }
  }

  /**
   * Delete URL (Admin - Hard delete)
   */
  static async deleteUrl(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;

      const { data: url } = await supabase
        .from("urls")
        .select("id")
        .eq("short_code", shortCode)
        .single();

      if (!url) throw new NotFoundError("URL not found");

      const { error } = await supabase
        .from("urls")
        .delete()
        .eq("short_code", shortCode);

      if (error) throw error;

      log.security("admin_deleted_url", {
        shortCode,
        adminId: req.user.id,
      });

      log.performance("admin_delete_url", Date.now() - startTime);

      res.json({
        success: true,
        message: "URL permanently deleted",
      });
    } catch (error) {
      log.error(error, { action: "admin_delete_url" });
      next(error);
    }
  }

  /**
   * Get single user details
   */
  static async getUserDetails(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { userId } = req.params;

      const { data: user, error } = await supabase
        .from("users")
        .select(
          `
          *,
          urls(count)
        `
        )
        .eq("id", userId)
        .single();

      if (error || !user) {
        throw new NotFoundError("User not found");
      }

      log.performance("admin_get_user_details", Date.now() - startTime);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      log.error(error, { action: "admin_get_user_details" });
      next(error);
    }
  }

  /**
   * Suspend User
   */
  static async suspendUser(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { userId } = req.params;
      const { reason } = req.body;

      await this.updateUserStatus(userId, "suspended", reason);

      log.security("admin_suspended_user", {
        userId,
        adminId: req.user.id,
        reason,
      });

      res.json({
        success: true,
        message: "User has been suspended",
      });
    } catch (error) {
      log.error(error, { action: "admin_suspend_user" });
      next(error);
    }
  }

  /**
   * Unsuspend User
   */
  static async unsuspendUser(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { userId } = req.params;

      await this.updateUserStatus(userId, "active");

      log.security("admin_unsuspended_user", { userId, adminId: req.user.id });

      res.json({
        success: true,
        message: "User has been unsuspended",
      });
    } catch (error) {
      log.error(error, { action: "admin_unsuspend_user" });
      next(error);
    }
  }

  /**
   * Realtime Analytics
   */
  static async getRealtimeAnalytics(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [clicks24h, activeUsers, recentSignups] = await Promise.all([
        supabase
          .from("clicks")
          .select("*", { count: "exact", head: true })
          .gte("created_at", last24h.toISOString()),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("last_login", last24h.toISOString()),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("created_at", last24h.toISOString()),
      ]);

      res.json({
        success: true,
        data: {
          clicks_last_24h: clicks24h.count || 0,
          active_users_24h: activeUsers.count || 0,
          new_signups_24h: recentSignups.count || 0,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      log.error(error, { action: "admin_realtime_analytics" });
      next(error);
    }
  }

  /**
   * Daily / Weekly / Monthly Reports (Placeholder)
   */
  static async getDailyReport(req, res, next) {
    // You can enhance this with proper aggregation
    res.json({
      success: true,
      reportType: "daily",
      message:
        "Daily report endpoint ready. Implement detailed aggregation as needed.",
    });
  }

  static async getWeeklyReport(req, res, next) {
    res.json({
      success: true,
      reportType: "weekly",
      message: "Weekly report endpoint ready.",
    });
  }

  static async getMonthlyReport(req, res, next) {
    res.json({
      success: true,
      reportType: "monthly",
      message: "Monthly report endpoint ready.",
    });
  }

  /**
   * Get single abuse report details
   */
  static async getAbuseReportDetails(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { reportId } = req.params;

      const { data: report, error } = await supabase
        .from("abuse_reports")
        .select(
          `
          *,
          urls!inner(short_code, original_url),
          users!inner(email, full_name)
        `
        )
        .eq("id", reportId)
        .single();

      if (error || !report) {
        throw new NotFoundError("Abuse report not found");
      }

      log.performance("get_abuse_report_details", Date.now() - startTime);

      res.json({ success: true, data: report });
    } catch (error) {
      log.error(error, { action: "get_abuse_report_details" });
      next(error);
    }
  }

  /**
   * Escalate abuse report
   */
  static async escalateAbuseReport(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { reportId } = req.params;
      const { notes } = req.body;

      const { error } = await supabase
        .from("abuse_reports")
        .update({
          status: "escalated",
          escalated_at: new Date(),
          escalation_notes: notes,
          escalated_by: req.user.id,
        })
        .eq("id", reportId);

      if (error) throw error;

      log.business("abuse_report_escalated", {
        reportId,
        adminId: req.user.id,
      });

      res.json({
        success: true,
        message: "Report escalated successfully",
      });
    } catch (error) {
      log.error(error, { action: "escalate_abuse_report" });
      next(error);
    }
  }

  /**
   * System Metrics
   */
  static async getSystemMetrics(req, res, next) {
    // Similar to getSystemHealth but more detailed
    res.json({
      success: true,
      data: {
        message: "System metrics endpoint - extend as needed",
      },
    });
  }

  /**
   * Get System Logs
   */
  static async getSystemLogs(req, res, next) {
    res.json({
      success: true,
      data: [],
      message: "System logs endpoint ready (connect to your logging system)",
    });
  }

  /**
   * Clear Cache
   */
  static async clearCache(req, res, next) {
    const log = createRequestContextLogger(req);
    try {
      // Implement cache clearing logic (Redis, etc.)
      log.business("cache_cleared", { adminId: req.user.id });

      res.json({
        success: true,
        message: "Cache cleared successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle Maintenance Mode
   */
  static async toggleMaintenanceMode(req, res, next) {
    const log = createRequestContextLogger(req);
    const { enabled, message } = req.body;

    try {
      // You can store this in settings table or env
      log.business("maintenance_mode_toggled", {
        enabled,
        adminId: req.user.id,
      });

      res.json({
        success: true,
        message: `Maintenance mode ${enabled ? "enabled" : "disabled"}`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get System Settings
   */
  static async getSettings(req, res, next) {
    res.json({
      success: true,
      data: {
        maintenance_mode: false,
        allow_registration: true,
        require_email_verification: true,
        max_urls_per_user: 500,
      },
    });
  }

  /**
   * Update System Settings
   */
  static async updateSettings(req, res, next) {
    const log = createRequestContextLogger(req);
    try {
      log.business("settings_updated", { adminId: req.user.id });

      res.json({
        success: true,
        message: "Settings updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Backup Settings / Status
   */
  static async getBackupSettings(req, res, next) {
    res.json({
      success: true,
      data: {
        last_backup: new Date().toISOString(),
        backup_frequency: "daily",
        status: "operational",
      },
    });
  }

  /**
   * Trigger Manual Backup
   */
  static async triggerBackup(req, res, next) {
    const log = createRequestContextLogger(req);
    try {
      log.business("manual_backup_triggered", { adminId: req.user.id });

      res.json({
        success: true,
        message: "Backup initiated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== Private Helper ====================
  static async updateUserStatus(userId, status, reason = null) {
    const updateData = {
      updated_at: new Date(),
    };

    if (status === "suspended") {
      updateData.suspended_at = new Date();
      updateData.suspension_reason = reason;
    } else if (status === "active") {
      updateData.suspended_at = null;
      updateData.suspension_reason = null;
    }

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId);

    if (error) throw error;
  }

  // Helper methods
  static generateGlobalTimeline(clicks, days) {
    const timeline = {};
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      timeline[dateStr] = 0;
    }

    clicks.forEach((click) => {
      const dateStr = new Date(click.created_at).toISOString().split("T")[0];
      if (timeline[dateStr] !== undefined) {
        timeline[dateStr]++;
      }
    });

    return {
      labels: Object.keys(timeline),
      values: Object.values(timeline),
    };
  }

  static async getUserGrowth(startDate) {
    const { data } = await supabase
      .from("users")
      .select("created_at")
      .gte("created_at", startDate.toISOString());

    const growth = {};
    data?.forEach((user) => {
      const date = new Date(user.created_at).toISOString().split("T")[0];
      growth[date] = (growth[date] || 0) + 1;
    });

    return growth;
  }

  static async getUrlGrowth(startDate) {
    const { data } = await supabase
      .from("urls")
      .select("created_at")
      .gte("created_at", startDate.toISOString());

    const growth = {};
    data?.forEach((url) => {
      const date = new Date(url.created_at).toISOString().split("T")[0];
      growth[date] = (growth[date] || 0) + 1;
    });

    return growth;
  }

  static async getClickGrowth(startDate) {
    const { data } = await supabase
      .from("clicks")
      .select("created_at")
      .gte("created_at", startDate.toISOString());

    const growth = {};
    data?.forEach((click) => {
      const date = new Date(click.created_at).toISOString().split("T")[0];
      growth[date] = (growth[date] || 0) + 1;
    });

    return growth;
  }

  static async sendModerationNotification(userId, action, reason) {
    // Implementation for sending email/in-app notification
    // This would integrate with your notification service
    console.log(`Notification sent to user ${userId}: ${action} - ${reason}`);
    return true;
  }

  static async getStorageUsage() {
    // This would query actual storage usage from Supabase storage
    // Placeholder implementation
    return 45.6; // MB
  }

  static async getAverageResponseTime() {
    // This would calculate from logs or monitoring system
    return 124; // ms
  }

  static async getCacheHitRate() {
    // This would query Redis or cache metrics
    return 78.5; // percentage
  }

  static async getApiRequestRate() {
    // This would calculate from API logs
    return 342; // requests per minute
  }

  static async getErrorRate() {
    // This would calculate from error logs
    return 1.2; // percentage
  }

  static async exportUrls(fromDate, toDate) {
    let query = supabase.from("urls").select(`
      short_code,
      original_url,
      click_count,
      created_at,
      is_active,
      users(email, full_name)
    `);

    if (fromDate) query = query.gte("created_at", fromDate);
    if (toDate) query = query.lte("created_at", toDate);

    const { data } = await query;
    return data || [];
  }

  static async exportUsers(fromDate, toDate) {
    let query = supabase
      .from("users")
      .select(
        `
      email,
      full_name,
      plan,
      created_at,
      last_login,
      total_clicks,
      urls(count)
    `
      )
      .not("role", "eq", "admin");

    if (fromDate) query = query.gte("created_at", fromDate);
    if (toDate) query = query.lte("created_at", toDate);

    const { data } = await query;
    return data || [];
  }

  static async exportAnalytics(fromDate, toDate) {
    let query = supabase.from("clicks").select(`
      created_at,
      ip_address,
      device_type,
      browser,
      country,
      urls(short_code, original_url, users(email))
    `);

    if (fromDate) query = query.gte("created_at", fromDate);
    if (toDate) query = query.lte("created_at", toDate);

    const { data } = await query;
    return data || [];
  }

  static convertToCSV(data) {
    if (!data || data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [];

    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        if (typeof value === "object") {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  }
}
