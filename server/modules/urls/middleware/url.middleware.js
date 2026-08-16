// src/modules/urls/middleware/url.middleware.js
const Joi = require("joi");
const urlSchemas = require("../validations/url.validation");
const urlService = require("../services/url.service");
const urlUtils = require("../utils/url.utils");

const urlMiddleware = {
  // Validate URL creation data
  validateUrlCreation: async (req, res, next) => {
    try {
      const { error, value } = urlSchemas.createUrl.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((d) => d.message),
        });
      }
      req.validatedBody = value;
      next();
    } catch (error) {
      next(error);
    }
  },

  // Check URL ownership
  checkUrlOwnership: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const url = await urlService.getUrlById(id, userId);
      if (!url) {
        return res.status(404).json({
          success: false,
          message: "URL not found",
        });
      }

      req.url = url;
      next();
    } catch (error) {
      next(error);
    }
  },

  // Validate short code
  validateShortCode: async (req, res, next) => {
    try {
      const { shortCode } = req.params;
      const { error } = urlSchemas.shortCodeParam.validate({ shortCode });
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid short code format",
          errors: error.details.map((d) => d.message),
        });
      }

      if (!urlUtils.isValidShortCode(shortCode)) {
        return res.status(400).json({
          success: false,
          message: "Invalid short code format",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  // URL expiration check
  checkUrlExpiration: async (req, res, next) => {
    try {
      const url =
        req.url || (await urlService.getUrlByShortCode(req.params.shortCode));

      if (url && url.expires_at && new Date(url.expires_at) < new Date()) {
        return res.status(410).json({
          success: false,
          message: "This URL has expired",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  // Password protected URL check
  checkUrlPassword: async (req, res, next) => {
    try {
      const url =
        req.url || (await urlService.getUrlByShortCode(req.params.shortCode));

      if (url && url.requires_password && url.password_hash) {
        // Check if password is provided in request
        const providedPassword =
          req.headers["x-url-password"] || req.body.password;

        if (!providedPassword) {
          return res.status(401).json({
            success: false,
            message: "Password required to access this URL",
            requires_password: true,
          });
        }

        const isValid = await urlService.validateUrlPassword(
          url.id,
          providedPassword
        );
        if (!isValid) {
          return res.status(401).json({
            success: false,
            message: "Invalid password",
          });
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  // Rate limiting for URL creation
  urlCreationLimiter: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userPlan = req.user.plan || "free";

      // Define limits based on plan
      const limits = {
        free: { windowMs: 60000, max: 10 },
        pro: { windowMs: 60000, max: 100 },
        business: { windowMs: 60000, max: 500 },
        enterprise: { windowMs: 60000, max: 1000 },
      };

      const limit = limits[userPlan] || limits.free;

      // Implement rate limiting using cache service
      const cacheService = req.cacheService;
      const key = `url_creation_limit:${userId}`;
      const currentCount = (await cacheService.get(key)) || 0;

      if (currentCount >= limit.max) {
        return res.status(429).json({
          success: false,
          message: "Too many URL creation requests. Please try again later.",
          retry_after: Math.ceil(limit.windowMs / 1000),
        });
      }

      await cacheService.increment(key);
      await cacheService.set(
        key,
        currentCount + 1,
        Math.ceil(limit.windowMs / 1000)
      );

      next();
    } catch (error) {
      next(error);
    }
  },

  // Validate bulk upload data
  validateBulkUpload: async (req, res, next) => {
    try {
      const { error, value } = urlSchemas.bulkCreate.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((d) => d.message),
        });
      }

      // Check bulk upload limits
      const maxRows = {
        free: 100,
        pro: 1000,
        business: 5000,
        enterprise: 10000,
      };

      const userPlan = req.user.plan || "free";
      const maxAllowed = maxRows[userPlan] || 100;

      if (value.urls.length > maxAllowed) {
        return res.status(400).json({
          success: false,
          message: `Bulk upload limit exceeded. Maximum ${maxAllowed} URLs allowed for ${userPlan} plan.`,
        });
      }

      req.validatedBody = value;
      next();
    } catch (error) {
      next(error);
    }
  },

  // Validate URL ID param
  validateUrlId: async (req, res, next) => {
    try {
      const { error } = urlSchemas.urlIdParam.validate({ id: req.params.id });
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid URL ID format",
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  },

  // Validate password request
  validatePasswordRequest: async (req, res, next) => {
    try {
      const { error, value } = urlSchemas.setPassword.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((d) => d.message),
        });
      }
      req.validatedBody = value;
      next();
    } catch (error) {
      next(error);
    }
  },

  // Validate expiration request
  validateExpirationRequest: async (req, res, next) => {
    try {
      const { error, value } = urlSchemas.setExpiration.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((d) => d.message),
        });
      }
      req.validatedBody = value;
      next();
    } catch (error) {
      next(error);
    }
  },

  // Validate update request
  validateUpdateRequest: async (req, res, next) => {
    try {
      const { error, value } = urlSchemas.updateUrl.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((d) => d.message),
        });
      }
      req.validatedBody = value;
      next();
    } catch (error) {
      next(error);
    }
  },

  // Validate get URLs query
  validateGetUrlsQuery: async (req, res, next) => {
    try {
      const { error, value } = urlSchemas.getUrls.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((d) => d.message),
        });
      }
      req.validatedQuery = value;
      next();
    } catch (error) {
      next(error);
    }
  },
};

module.exports = urlMiddleware;
