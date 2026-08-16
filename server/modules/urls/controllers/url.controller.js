// src/modules/urls/controllers/url.controller.js
class UrlController {
  constructor(urlService) {
    this.urlService = urlService;
  }

  // Create short URL
  async createShortUrl(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        original_url,
        custom_code,
        title,
        description,
        tags,
        password,
        expires_at,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        domain_redirect,
      } = req.validatedBody;

      const options = {
        custom_code,
        title,
        description,
        tags,
        password,
        expires_at,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        domain_redirect,
      };

      const result = await this.urlService.createShortUrl(
        userId,
        original_url,
        options
      );

      res.status(201).json({
        success: true,
        message: "URL created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all URLs for user
  async getUserUrls(req, res, next) {
    try {
      const userId = req.user.id;
      const filters = req.validatedQuery || {};
      const pagination = {
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort,
        order: filters.order,
      };

      const result = await this.urlService.getUserUrls(
        userId,
        filters,
        pagination
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get URL details
  async getUrlDetails(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const url = await this.urlService.getUrlById(id, userId);

      if (!url) {
        return res.status(404).json({
          success: false,
          message: "URL not found",
        });
      }

      res.status(200).json({
        success: true,
        data: url,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update URL
  async updateUrl(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.validatedBody;

      const updatedUrl = await this.urlService.updateUrl(id, userId, updates);

      if (!updatedUrl) {
        return res.status(404).json({
          success: false,
          message: "URL not found or unauthorized",
        });
      }

      res.status(200).json({
        success: true,
        message: "URL updated successfully",
        data: updatedUrl,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete URL
  async deleteUrl(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await this.urlService.deleteUrl(id, userId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "URL not found or unauthorized",
        });
      }

      res.status(200).json({
        success: true,
        message: "URL deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Redirect to original URL
  async redirectToUrl(req, res, next) {
    try {
      const { shortCode } = req.params;

      // Check if URL exists and is valid
      const redirectData = await this.urlService.getUrlRedirect(shortCode);

      if (!redirectData) {
        return res.status(404).json({
          success: false,
          message: "URL not found",
        });
      }

      // If password required, return 401
      if (redirectData.requiresPassword) {
        return res.status(401).json({
          success: false,
          message: "Password required",
          requires_password: true,
          url_id: redirectData.urlId,
        });
      }

      // Record click asynchronously
      const clickData = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers["user-agent"],
        referrer: req.headers["referer"] || req.headers["referrer"],
        sessionId:
          req.cookies?.session_id || req.headers["x-session-id"] || null,
        location: req.location || null,
      };

      // Don't await, let it run in background
      this.urlService.recordClick(shortCode, clickData).catch((error) => {
        console.error("Error recording click:", error);
      });

      // Redirect to original URL
      res.redirect(301, redirectData.redirect);
    } catch (error) {
      next(error);
    }
  }

  // Get URL analytics
  async getUrlAnalytics(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      const analytics = await this.urlService.getUrlAnalytics(id, userId, {
        startDate,
        endDate,
      });

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get URL statistics
  async getUrlStats(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const stats = await this.urlService.getUrlStats(id, userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk create URLs
  async bulkCreateUrls(req, res, next) {
    try {
      const userId = req.user.id;
      const { urls } = req.validatedBody;

      const result = await this.urlService.bulkCreateUrls(userId, urls);

      res.status(201).json({
        success: true,
        message: "Bulk URL creation completed",
        data: {
          successful: result.successful.length,
          failed: result.failed.length,
          details: result,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Set URL password
  async setUrlPassword(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { password } = req.validatedBody;

      const result = await this.urlService.setUrlPassword(id, userId, password);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "URL not found or unauthorized",
        });
      }

      res.status(200).json({
        success: true,
        message: "Password set successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove URL password
  async removeUrlPassword(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await this.urlService.removeUrlPassword(id, userId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "URL not found or unauthorized",
        });
      }

      res.status(200).json({
        success: true,
        message: "Password removed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Set URL expiration
  async setUrlExpiration(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { expires_at } = req.validatedBody;

      const result = await this.urlService.setUrlExpiration(
        id,
        userId,
        expires_at
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "URL not found or unauthorized",
        });
      }

      res.status(200).json({
        success: true,
        message: "Expiration set successfully",
        data: { expires_at: result.expires_at },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get URLs by tag
  async getUrlsByTag(req, res, next) {
    try {
      const { tag } = req.params;
      const userId = req.user.id;
      const { page, limit } = req.query;

      const result = await this.urlService.getUrlsByTag(userId, tag, {
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UrlController;
