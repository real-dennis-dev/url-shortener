import { supabase } from "../config/supabase.js";
import { createRequestContextLogger } from "../utils/logger.js";
import {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ConflictError,
} from "../errors/customErrors.js";
import bcrypt from "bcrypt";

export class UserController {
  /**
   * Get user profile
   */
  static async getProfile(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("Not authenticated");

      const { data: user, error } = await supabase
        .from("users")
        .select(
          "id, email, full_name, avatar_url, plan, created_at, last_login, api_key"
        )
        .eq("id", userId)
        .single();

      if (error || !user) {
        throw new NotFoundError("User not found");
      }

      // Get user statistics
      const { data: urls } = await supabase
        .from("urls")
        .select("click_count")
        .eq("user_id", userId);

      const totalClicks =
        urls?.reduce((sum, url) => sum + (url.click_count || 0), 0) || 0;
      const totalUrls = urls?.length || 0;
      const activeUrls =
        urls?.filter((url) => url.is_active !== false).length || 0;

      log.performance("get_profile", Date.now() - startTime);

      res.json({
        success: true,
        data: {
          ...user,
          stats: {
            total_urls: totalUrls,
            total_clicks: totalClicks,
            active_urls: activeUrls,
          },
        },
      });
    } catch (error) {
      log.error(error, { action: "get_profile" });
      next(error);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      const { full_name, avatar_url, preferences } = req.body;

      if (!userId) throw new UnauthorizedError("Not authenticated");

      const updateData = {
        updated_at: new Date(),
      };

      if (full_name) updateData.full_name = full_name;
      if (avatar_url) updateData.avatar_url = avatar_url;
      if (preferences) updateData.preferences = preferences;

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;

      log.business("profile_updated", {
        userId,
        updatedFields: Object.keys(updateData),
      });
      log.performance("update_profile", Date.now() - startTime);

      res.json({
        success: true,
        data,
        message: "Profile updated successfully",
      });
    } catch (error) {
      log.error(error, { action: "update_profile" });
      next(error);
    }
  }

  /**
   * Change password
   */
  static async changePassword(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      const { current_password, new_password } = req.body;

      if (!userId) throw new UnauthorizedError("Not authenticated");

      if (!current_password || !new_password) {
        throw new BadRequestError(
          "Current password and new password are required"
        );
      }

      if (new_password.length < 6) {
        throw new BadRequestError("New password must be at least 6 characters");
      }

      // Get user with password
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("password_hash")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        throw new NotFoundError("User not found");
      }

      // Verify current password
      const isValid = await bcrypt.compare(
        current_password,
        user.password_hash
      );
      if (!isValid) {
        throw new BadRequestError("Current password is incorrect");
      }

      // Hash new password
      const password_hash = await bcrypt.hash(new_password, 10);

      const { error } = await supabase
        .from("users")
        .update({ password_hash, updated_at: new Date() })
        .eq("id", userId);

      if (error) throw error;

      log.security("password_changed", { userId });
      log.performance("change_password", Date.now() - startTime);

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      log.error(error, { action: "change_password" });
      next(error);
    }
  }

  /**
   * Get user's URL statistics
   */
  static async getUserStats(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("Not authenticated");

      // Get all user's URLs with click data
      const { data: urls, error } = await supabase
        .from("urls")
        .select("id, click_count, created_at, is_active")
        .eq("user_id", userId);

      if (error) throw error;

      const stats = {
        summary: {
          total_links: urls.length,
          active_links: urls.filter((u) => u.is_active).length,
          inactive_links: urls.filter((u) => !u.is_active).length,
          total_clicks: urls.reduce(
            (sum, url) => sum + (url.click_count || 0),
            0
          ),
          average_clicks_per_link: urls.length
            ? (
                urls.reduce((sum, url) => sum + (url.click_count || 0), 0) /
                urls.length
              ).toFixed(1)
            : 0,
        },
        timeline: this.generateUrlTimeline(urls),
        performance: {
          most_clicked: urls
            .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
            .slice(0, 5),
          recently_created: urls
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5),
        },
        usage_trends: this.calculateUsageTrends(urls),
      };

      log.performance("get_user_stats", Date.now() - startTime);

      res.json({ success: true, data: stats });
    } catch (error) {
      log.error(error, { action: "get_user_stats" });
      next(error);
    }
  }

  /**
   * Generate/Regenerate API Key
   */
  static async regenerateApiKey(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("Not authenticated");

      const newApiKey = this.generateApiKey();

      const { data, error } = await supabase
        .from("users")
        .update({
          api_key: newApiKey,
          api_key_last_regenerated: new Date(),
          updated_at: new Date(),
        })
        .eq("id", userId)
        .select("api_key")
        .single();

      if (error) throw error;

      log.security("api_key_regenerated", { userId });
      log.performance("regenerate_api_key", Date.now() - startTime);

      res.json({
        success: true,
        data: { api_key: data.api_key },
        message: "API key regenerated successfully",
      });
    } catch (error) {
      log.error(error, { action: "regenerate_api_key" });
      next(error);
    }
  }

  /**
   * Delete user account
   */
  static async deleteAccount(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      const { password } = req.body;

      if (!userId) throw new UnauthorizedError("Not authenticated");

      if (!password) {
        throw new BadRequestError("Password is required to delete account");
      }

      // Verify password
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("password_hash")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        throw new NotFoundError("User not found");
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        throw new BadRequestError("Incorrect password");
      }

      // Soft delete or hard delete
      const { error } = await supabase
        .from("users")
        .update({
          deleted_at: new Date(),
          is_active: false,
          email: `deleted_${userId}@example.com`,
        })
        .eq("id", userId);

      if (error) throw error;

      log.security("account_deleted", { userId });
      log.performance("delete_account", Date.now() - startTime);

      res.json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error) {
      log.error(error, { action: "delete_account" });
      next(error);
    }
  }

  /**
   * Get current API Key (without exposing it in profile)
   */
  static async getApiKey(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("Not authenticated");

      const { data: user, error } = await supabase
        .from("users")
        .select("api_key, api_key_last_regenerated")
        .eq("id", userId)
        .single();

      if (error || !user) {
        throw new NotFoundError("User not found");
      }

      log.performance("get_api_key", Date.now() - startTime);

      res.json({
        success: true,
        data: {
          api_key: user.api_key,
          last_regenerated: user.api_key_last_regenerated,
        },
      });
    } catch (error) {
      log.error(error, { action: "get_api_key" });
      next(error);
    }
  }

  /**
   * Revoke / Delete current API Key
   */
  static async revokeApiKey(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("Not authenticated");

      const { error } = await supabase
        .from("users")
        .update({
          api_key: null,
          api_key_last_regenerated: null,
          updated_at: new Date(),
        })
        .eq("id", userId);

      if (error) throw error;

      log.security("api_key_revoked", { userId });

      log.performance("revoke_api_key", Date.now() - startTime);

      res.json({
        success: true,
        message: "API key revoked successfully",
      });
    } catch (error) {
      log.error(error, { action: "revoke_api_key" });
      next(error);
    }
  }

  /**
   * Upload / Update Avatar
   */
  static async uploadAvatar(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("Not authenticated");

      // Assuming you're using multer or similar and req.file exists
      if (!req.file) {
        throw new BadRequestError("No image file uploaded");
      }

      const fileName = `${userId}-${Date.now()}${req.file.originalname.substring(
        req.file.originalname.lastIndexOf(".")
      )}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Update user profile
      const { data, error: updateError } = await supabase
        .from("users")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date(),
        })
        .eq("id", userId)
        .select("avatar_url")
        .single();

      if (updateError) throw updateError;

      log.business("avatar_updated", { userId });

      log.performance("upload_avatar", Date.now() - startTime);

      res.json({
        success: true,
        data: { avatar_url: data.avatar_url },
        message: "Avatar uploaded successfully",
      });
    } catch (error) {
      log.error(error, { action: "upload_avatar" });
      next(error);
    }
  }

  /**
   * Get user notifications
   */
  static async getNotifications(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("Not authenticated");

      const { page = 1, limit = 20, unreadOnly = "false" } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (unreadOnly === "true") {
        query = query.eq("read", false);
      }

      const {
        data: notifications,
        error,
        count,
      } = await query.range(offset, offset + limit - 1);

      if (error) throw error;

      log.performance("get_notifications", Date.now() - startTime);

      res.json({
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      log.error(error, { action: "get_notifications" });
      next(error);
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationRead(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      const { notificationId } = req.params;

      if (!notificationId) {
        throw new BadRequestError("Notification ID is required");
      }

      const { error } = await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date() })
        .eq("id", notificationId)
        .eq("user_id", userId); // Security

      if (error) throw error;

      log.performance("mark_notification_read", Date.now() - startTime);

      res.json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      log.error(error, { action: "mark_notification_read" });
      next(error);
    }
  }

  // Fixed generateApiKey method (using import instead of require)
  static generateApiKey() {
    const crypto = require("crypto"); // or better: import crypto from 'crypto' at top
    return "uk_" + crypto.randomBytes(32).toString("hex");
  }
  // Helper methods
  static generateUrlTimeline(urls) {
    const timeline = {};
    urls.forEach((url) => {
      const date = new Date(url.created_at).toISOString().split("T")[0];
      if (!timeline[date]) {
        timeline[date] = { created: 0, clicks: 0 };
      }
      timeline[date].created++;
      timeline[date].clicks += url.click_count || 0;
    });
    return timeline;
  }

  static calculateUsageTrends(urls) {
    const now = new Date();
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));

    const lastWeek = urls.filter((u) => new Date(u.created_at) >= weekAgo);
    const lastMonth = urls.filter((u) => new Date(u.created_at) >= monthAgo);

    return {
      growth_rate: lastMonth.length
        ? ((lastWeek.length / lastMonth.length) * 100).toFixed(1)
        : 0,
      weekly_average: (lastWeek.length / 7).toFixed(1),
      monthly_average: (lastMonth.length / 30).toFixed(1),
    };
  }
}
