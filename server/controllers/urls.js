import { supabase } from "../config/supabase.js";
import { nanoid } from "nanoid";
import { createRequestContextLogger } from "../utils/logger.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  UnauthorizedError,
} from "../errors/customErrors.js";

export class UrlController {
  /**
   * Create short URL
   */
  static async createShortUrl(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { originalUrl, customAlias, expiresAt, password } = req.body;
      const userId = req.user?.id;

      if (!originalUrl) {
        throw new BadRequestError("Original URL is required");
      }

      // Validate URL format
      try {
        new URL(originalUrl);
      } catch (error) {
        throw new BadRequestError("Invalid URL format");
      }

      let shortCode = customAlias;

      if (customAlias) {
        // Check if custom alias already exists
        const { data: existing } = await supabase
          .from("urls")
          .select("short_code")
          .eq("short_code", customAlias)
          .single();

        if (existing) {
          throw new ConflictError("Custom alias already taken");
        }
      } else {
        // Generate unique short code
        let isUnique = false;
        while (!isUnique) {
          shortCode = nanoid(6);
          const { data: existing } = await supabase
            .from("urls")
            .select("short_code")
            .eq("short_code", shortCode)
            .single();

          if (!existing) isUnique = true;
        }
      }

      const urlData = {
        original_url: originalUrl,
        short_code: shortCode,
        user_id: userId,
        expires_at: expiresAt || null,
        password: password || null,
        is_active: true,
        click_count: 0,
      };

      const { data, error } = await supabase
        .from("urls")
        .insert([urlData])
        .select()
        .single();

      if (error) throw error;

      log.business("url_created", {
        urlId: data.id,
        shortCode: data.short_code,
        userId,
      });

      log.performance("create_short_url", Date.now() - startTime);

      res.status(201).json({
        success: true,
        data: {
          id: data.id,
          shortCode: data.short_code,
          shortUrl: `${process.env.BASE_URL}/${data.short_code}`,
          originalUrl: data.original_url,
          expiresAt: data.expires_at,
          createdAt: data.created_at,
        },
      });
    } catch (error) {
      log.error(error, { action: "create_short_url" });
      next(error);
    }
  }

  /**
   * Get user's URLs with pagination
   */
  static async listUserUrls(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("User not authenticated");

      const { page = 1, limit = 10, search, status } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from("urls")
        .select("*", { count: "exact" })
        .eq("user_id", userId);

      if (search) {
        query = query.ilike("original_url", `%${search}%`);
      }

      if (status === "active") {
        query = query.eq("is_active", true);
      } else if (status === "inactive") {
        query = query.eq("is_active", false);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const urlsWithStats = data.map((url) => ({
        ...url,
        shortUrl: `${process.env.BASE_URL}/${url.short_code}`,
        totalClicks: url.click_count || 0,
      }));

      log.performance("list_user_urls", Date.now() - startTime);

      res.json({
        success: true,
        data: urlsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      log.error(error, { action: "list_user_urls" });
      next(error);
    }
  }

  /**
   * Get single URL details
   */
  static async getUrlDetails(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;
      const userId = req.user?.id;
      const isAdmin = req.user?.role === "admin";

      const { data: url, error } = await supabase
        .from("urls")
        .select(
          `
          *,
          analytics:analytics(
            click_count,
            unique_visitors,
            devices,
            browsers
          )
        `
        )
        .eq("short_code", shortCode)
        .single();

      if (error || !url) {
        throw new NotFoundError("URL not found");
      }

      // Check permissions
      if (url.user_id !== userId && !isAdmin) {
        throw new ForbiddenError("You do not have permission to view this URL");
      }

      // Get recent analytics
      const { data: recentClicks } = await supabase
        .from("clicks")
        .select("created_at, ip_address, device_type, browser, referrer")
        .eq("url_id", url.id)
        .order("created_at", { ascending: false })
        .limit(10);

      log.performance("get_url_details", Date.now() - startTime);

      res.json({
        success: true,
        data: {
          ...url,
          shortUrl: `${process.env.BASE_URL}/${url.short_code}`,
          recentClicks: recentClicks || [],
          analytics: url.analytics,
        },
      });
    } catch (error) {
      log.error(error, { action: "get_url_details" });
      next(error);
    }
  }

  /**
   * Update URL title/description
   */
  static async updateUrlMetadata(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;
      const { title, description, tags } = req.body;
      const userId = req.user?.id;

      const { data: url, error: fetchError } = await supabase
        .from("urls")
        .select("user_id")
        .eq("short_code", shortCode)
        .single();

      if (fetchError || !url) {
        throw new NotFoundError("URL not found");
      }

      if (url.user_id !== userId) {
        throw new ForbiddenError(
          "You do not have permission to update this URL"
        );
      }

      const { data, error } = await supabase
        .from("urls")
        .update({
          title: title || null,
          description: description || null,
          tags: tags || null,
          updated_at: new Date(),
        })
        .eq("short_code", shortCode)
        .select()
        .single();

      if (error) throw error;

      log.business("url_metadata_updated", {
        shortCode,
        userId,
        updatedFields: { title, description, tags },
      });

      log.performance("update_url_metadata", Date.now() - startTime);

      res.json({
        success: true,
        data,
        message: "URL metadata updated successfully",
      });
    } catch (error) {
      log.error(error, { action: "update_url_metadata" });
      next(error);
    }
  }

  /**
   * Deactivate/Activate link
   */
  static async toggleUrlStatus(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;
      const { isActive } = req.body;
      const userId = req.user?.id;

      if (typeof isActive !== "boolean") {
        throw new BadRequestError("isActive must be a boolean");
      }

      const { data: url, error: fetchError } = await supabase
        .from("urls")
        .select("user_id")
        .eq("short_code", shortCode)
        .single();

      if (fetchError || !url) {
        throw new NotFoundError("URL not found");
      }

      if (url.user_id !== userId) {
        throw new ForbiddenError(
          "You do not have permission to modify this URL"
        );
      }

      const { data, error } = await supabase
        .from("urls")
        .update({
          is_active: isActive,
          updated_at: new Date(),
        })
        .eq("short_code", shortCode)
        .select()
        .single();

      if (error) throw error;

      log.business("url_status_toggled", {
        shortCode,
        userId,
        isActive,
      });

      log.performance("toggle_url_status", Date.now() - startTime);

      res.json({
        success: true,
        data,
        message: `URL ${isActive ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      log.error(error, { action: "toggle_url_status" });
      next(error);
    }
  }

  /**
   * Delete URL
   */
  static async deleteUrl(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;
      const userId = req.user?.id;
      const isAdmin = req.user?.role === "admin";

      const { data: url, error: fetchError } = await supabase
        .from("urls")
        .select("user_id")
        .eq("short_code", shortCode)
        .single();

      if (fetchError || !url) {
        throw new NotFoundError("URL not found");
      }

      if (url.user_id !== userId && !isAdmin) {
        throw new ForbiddenError(
          "You do not have permission to delete this URL"
        );
      }

      const { error } = await supabase
        .from("urls")
        .delete()
        .eq("short_code", shortCode);

      if (error) throw error;

      log.business("url_deleted", {
        shortCode,
        userId,
        deletedByAdmin: isAdmin,
      });

      log.performance("delete_url", Date.now() - startTime);

      res.json({
        success: true,
        message: "URL deleted successfully",
      });
    } catch (error) {
      log.error(error, { action: "delete_url" });
      next(error);
    }
  }

  /**
   * Bulk Archive URLs (set is_active = false)
   */
  static async bulkArchive(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCodes } = req.body;
      const userId = req.user?.id;

      if (!Array.isArray(shortCodes) || shortCodes.length === 0) {
        throw new BadRequestError("shortCodes array is required");
      }

      if (shortCodes.length > 50) {
        throw new BadRequestError("Maximum 50 URLs per bulk operation");
      }

      const { error } = await supabase
        .from("urls")
        .update({
          is_active: false,
          updated_at: new Date(),
        })
        .in("short_code", shortCodes)
        .eq("user_id", userId); // Security: Only affect user's own URLs

      if (error) throw error;

      log.business("bulk_archive", {
        userId,
        count: shortCodes.length,
        shortCodes,
      });

      log.performance("bulk_archive", Date.now() - startTime);

      res.json({
        success: true,
        message: `${shortCodes.length} URLs archived successfully`,
        count: shortCodes.length,
      });
    } catch (error) {
      log.error(error, { action: "bulk_archive" });
      next(error);
    }
  }

  /**
   * Bulk Delete URLs
   */
  static async bulkDelete(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCodes } = req.body;
      const userId = req.user?.id;
      const isAdmin = req.user?.role === "admin";

      if (!Array.isArray(shortCodes) || shortCodes.length === 0) {
        throw new BadRequestError("shortCodes array is required");
      }

      if (shortCodes.length > 30) {
        throw new BadRequestError("Maximum 30 URLs per bulk delete");
      }

      let query = supabase
        .from("urls")
        .select("short_code")
        .in("short_code", shortCodes);

      // Non-admins can only delete their own URLs
      if (!isAdmin) {
        query = query.eq("user_id", userId);
      }

      const { data: urlsToDelete, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (!urlsToDelete || urlsToDelete.length === 0) {
        throw new NotFoundError("No matching URLs found");
      }

      const { error } = await supabase
        .from("urls")
        .delete()
        .in(
          "short_code",
          urlsToDelete.map((u) => u.short_code)
        );

      if (error) throw error;

      log.business("bulk_delete", {
        userId,
        count: urlsToDelete.length,
        deletedByAdmin: isAdmin,
        shortCodes: urlsToDelete.map((u) => u.short_code),
      });

      log.performance("bulk_delete", Date.now() - startTime);

      res.json({
        success: true,
        message: `${urlsToDelete.length} URLs deleted successfully`,
        count: urlsToDelete.length,
      });
    } catch (error) {
      log.error(error, { action: "bulk_delete" });
      next(error);
    }
  }

  /**
   * Bulk Update Tags
   */
  static async bulkUpdateTags(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCodes, tags } = req.body;
      const userId = req.user?.id;

      if (!Array.isArray(shortCodes) || shortCodes.length === 0) {
        throw new BadRequestError("shortCodes array is required");
      }

      if (!Array.isArray(tags)) {
        throw new BadRequestError("tags must be an array");
      }

      if (shortCodes.length > 50) {
        throw new BadRequestError("Maximum 50 URLs per bulk operation");
      }

      const { error } = await supabase
        .from("urls")
        .update({
          tags: tags.length > 0 ? tags : null,
          updated_at: new Date(),
        })
        .in("short_code", shortCodes)
        .eq("user_id", userId); // Security check

      if (error) throw error;

      log.business("bulk_update_tags", {
        userId,
        count: shortCodes.length,
        tags,
      });

      log.performance("bulk_update_tags", Date.now() - startTime);

      res.json({
        success: true,
        message: `Tags updated for ${shortCodes.length} URLs`,
        count: shortCodes.length,
      });
    } catch (error) {
      log.error(error, { action: "bulk_update_tags" });
      next(error);
    }
  }
}
